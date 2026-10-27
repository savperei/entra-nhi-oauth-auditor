"""Risk scoring and rule evaluation engine for Entra Non-Human Identities."""

from typing import Any, Dict, List, Literal, Optional
from src.dummy_data.synthetic_identities import SYNTHETIC_FINDINGS
from src.inventory.models import BaseModel, ModelDictMixin
from .rule_loader import Rule, RuleLoader
from .credential_health import check_credential_health

HIGH_RISK_PERMISSIONS = {
    "Directory.ReadWrite.All",
    "Application.ReadWrite.All",
    "RoleManagement.ReadWrite.Directory",
    "Mail.ReadWrite",
    "Files.ReadWrite.All",
    "User.ReadWrite.All",
    "Group.ReadWrite.All",
}


class RiskScore(BaseModel, ModelDictMixin):
    """Represents the risk scoring outcome for an evaluated identity."""

    total_score: int
    level: Literal["Critical", "High", "Medium", "Low", "None"]
    triggered_rule_ids: list[str]


class RiskScorer:
    """Scores non-human identities against configured risk rules."""

    def __init__(self, rules: Optional[List[Rule]] = None):
        if rules is None:
            try:
                self.rules = RuleLoader.load()
            except Exception:
                self.rules = []
        else:
            self.rules = rules

        self.rules_by_id: Dict[str, Rule] = {r.id: r for r in self.rules}

    def score(self, identity: Any, analyser_results: Optional[Dict[str, Any]] = None) -> RiskScore:
        """Evaluates identity against risk rules and returns a RiskScore."""
        triggered: List[str] = []

        # 1. Credential Health Rules (CRED_001, CRED_002, CRED_003, CRED_004)
        cred_health = check_credential_health(identity)
        has_cred_001 = any(c["has_no_expiry"] for c in cred_health)
        has_cred_002 = any(c["is_expiring_14d"] for c in cred_health)
        has_cred_003 = any(c["is_expired"] for c in cred_health)
        has_cred_004 = any(c["is_expiring_30d"] and not c["is_expiring_14d"] for c in cred_health)

        if has_cred_001 and "CRED_001" in self.rules_by_id:
            triggered.append("CRED_001")
        if has_cred_002 and "CRED_002" in self.rules_by_id:
            triggered.append("CRED_002")
        if has_cred_003 and "CRED_003" in self.rules_by_id:
            triggered.append("CRED_003")
        if has_cred_004 and "CRED_004" in self.rules_by_id:
            triggered.append("CRED_004")

        # 2. High-Risk Application Permissions (PERM_001)
        raw_perms = (
            getattr(identity, "permissions", None)
            or (identity.get("permissions") if isinstance(identity, dict) else None)
            or (identity.get("oauth_permissions") if isinstance(identity, dict) else None)
            or []
        )
        has_high_app_perm = False
        for p in raw_perms:
            p_type = (
                getattr(p, "permission_type", None)
                or getattr(p, "type", None)
                or (p.get("permission_type") if isinstance(p, dict) else None)
                or (p.get("type") if isinstance(p, dict) else None)
                or ""
            )
            is_app = str(p_type).lower() == "application"
            is_high = getattr(p, "is_high_risk", False) or (p.get("is_high_risk") if isinstance(p, dict) else False)
            scope = (
                getattr(p, "scope_or_role", None)
                or getattr(p, "permission", None)
                or (p.get("scope_or_role") if isinstance(p, dict) else None)
                or (p.get("permission") if isinstance(p, dict) else None)
            )
            if is_app and (is_high or (scope and scope in HIGH_RISK_PERMISSIONS)):
                has_high_app_perm = True
                break

        if has_high_app_perm and "PERM_001" in self.rules_by_id:
            triggered.append("PERM_001")

        # 3. Org-Wide OAuth Grant AllPrincipals (PERM_002)
        raw_grants = (
            getattr(identity, "oauth_grants", None)
            or (identity.get("oauth_grants") if isinstance(identity, dict) else None)
            or []
        )
        has_all_principals = (
            getattr(identity, "has_all_principals_grant", False)
            or (identity.get("has_all_principals_grant") if isinstance(identity, dict) else False)
            or any(
                str(
                    getattr(g, "consent_type", None)
                    or getattr(g, "consentType", None)
                    or (g.get("consent_type") if isinstance(g, dict) else None)
                    or (g.get("consentType") if isinstance(g, dict) else None)
                ) == "AllPrincipals"
                for g in raw_grants
            )
        )
        if has_all_principals and "PERM_002" in self.rules_by_id:
            triggered.append("PERM_002")

        # 4. Unverified Publisher with Permissions (PUB_001)
        pub_risk = False
        pub_check = None
        if analyser_results and isinstance(analyser_results, dict):
            pub_check = analyser_results.get("publisher_check")
        if pub_check is None:
            pub_check = getattr(identity, "publisher_check", None) or (
                identity.get("publisher_check") if isinstance(identity, dict) else None
            )

        if isinstance(pub_check, dict):
            pub_risk = bool(pub_check.get("risk_flag"))
        else:
            is_verified = None
            for attr in ("is_publisher_verified", "is_verified_publisher", "is_verified"):
                val = getattr(identity, attr, None) if not isinstance(identity, dict) else identity.get(attr)
                if val is not None:
                    is_verified = bool(val)
                    break
            if is_verified is None:
                vp = getattr(identity, "verified_publisher", None) if not isinstance(identity, dict) else identity.get("verified_publisher")
                if isinstance(vp, dict):
                    is_verified = bool(vp.get("verifiedPublisherId") or vp.get("displayName"))
                elif vp:
                    is_verified = True
                else:
                    is_verified = False

            has_perms = len(raw_perms) > 0
            if is_verified is False and has_perms:
                pub_risk = True

        if pub_risk and "PUB_001" in self.rules_by_id:
            triggered.append("PUB_001")

        # 5. Disabled Identity with Active OAuth Grants (ID_001)
        is_enabled = (
            getattr(identity, "is_enabled", None)
            if not isinstance(identity, dict)
            else identity.get("is_enabled")
        )
        if is_enabled is None:
            if isinstance(identity, dict):
                is_enabled = not bool(identity.get("disabled", False))
                if "account_enabled" in identity:
                    is_enabled = bool(identity["account_enabled"])
                elif "is_active" in identity:
                    is_enabled = bool(identity["is_active"])
            else:
                is_enabled = not bool(getattr(identity, "disabled", False))
                if hasattr(identity, "account_enabled"):
                    is_enabled = bool(getattr(identity, "account_enabled"))

        if is_enabled is False and len(raw_grants) > 0 and "ID_001" in self.rules_by_id:
            triggered.append("ID_001")

        # Calculate total score from triggered rules
        total_score = sum(self.rules_by_id[r_id].score for r_id in triggered if r_id in self.rules_by_id)

        # Apply Thresholds: Critical>=80, High>=50, Medium>=25, Low>=1, else None
        if total_score >= 80:
            level: Literal["Critical", "High", "Medium", "Low", "None"] = "Critical"
        elif total_score >= 50:
            level = "High"
        elif total_score >= 25:
            level = "Medium"
        elif total_score >= 1:
            level = "Low"
        else:
            level = "None"

        return RiskScore(
            total_score=total_score,
            level=level,
            triggered_rule_ids=triggered,
        )


# Backward-compatible RiskEngine for existing API endpoints
class RiskEngine:
    """Legacy service for listing findings and summary metrics."""

    @staticmethod
    def list_findings(identity_id: str = None) -> List[Dict[str, Any]]:
        if identity_id:
            return [f for f in SYNTHETIC_FINDINGS if f["identity_id"] == identity_id]
        return SYNTHETIC_FINDINGS

    @staticmethod
    def get_summary_metrics(identities: List[Dict[str, Any]], findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_identities = len(identities)
        critical_count = sum(1 for i in identities if str(i.get("risk_level", "")).upper() == "CRITICAL")
        high_count = sum(1 for i in identities if str(i.get("risk_level", "")).upper() == "HIGH")
        medium_count = sum(1 for i in identities if str(i.get("risk_level", "")).upper() == "MEDIUM")
        low_count = sum(1 for i in identities if str(i.get("risk_level", "")).upper() == "LOW")
        total_findings = len(findings)

        return {
            "total_identities": total_identities,
            "total_findings": total_findings,
            "critical_risk_count": critical_count,
            "high_risk_count": high_count,
            "medium_risk_count": medium_count,
            "low_risk_count": low_count,
        }


risk_engine = RiskEngine()
