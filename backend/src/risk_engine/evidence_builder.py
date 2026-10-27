"""Evidence builder module for constructing detailed risk findings."""

from typing import Any, Dict, List, Optional, Union
from src.inventory.models import BaseModel, ModelDictMixin
from .rule_loader import Rule, RuleLoader
from .credential_health import check_credential_health


class Finding(BaseModel, ModelDictMixin):
    """Represents a specific audit risk finding with contextual evidence."""

    rule_id: str
    rule_name: str
    severity: str
    evidence_text: str
    remediation: str


class EvidenceBuilder:
    """Builds specific, human-readable evidence for triggered risk rules."""

    def __init__(self, rules: Optional[List[Rule]] = None):
        if rules is None:
            try:
                self.rules_by_id = {r.id: r for r in RuleLoader.load()}
            except Exception:
                self.rules_by_id = {}
        else:
            self.rules_by_id = {r.id: r for r in rules}

    def _get_display_name(self, identity: Any) -> str:
        return str(
            getattr(identity, "display_name", None)
            or (identity.get("display_name") if isinstance(identity, dict) else None)
            or getattr(identity, "name", None)
            or (identity.get("name") if isinstance(identity, dict) else None)
            or "Unknown"
        )

    def _build_evidence_for_rule(self, rule_id: str, identity: Any, rule: Optional[Rule]) -> str:
        """Constructs specific contextual evidence text for a given rule and identity."""
        cred_health = check_credential_health(identity)
        display_name = self._get_display_name(identity)

        if rule_id == "CRED_001":
            for c in cred_health:
                if c["has_no_expiry"]:
                    name = c["display_name"] or c["credential_id"] or "unnamed-secret"
                    return f"Secret '{name}' has no expiry date configured (long-lived credential)."
            return f"Identity '{display_name}' has credentials configured without an expiry date."

        elif rule_id == "CRED_002":
            for c in cred_health:
                if c["is_expiring_14d"]:
                    name = c["display_name"] or c["credential_id"] or "unnamed-secret"
                    days = c["days_until_expiry"]
                    exp_date = c["expires"].strftime("%Y-%m-%d") if c["expires"] else "soon"
                    return f"Secret '{name}' expires in {days} days ({exp_date})"
            return f"Identity '{display_name}' has a credential expiring within 14 days."

        elif rule_id == "CRED_003":
            for c in cred_health:
                if c["is_expired"]:
                    name = c["display_name"] or c["credential_id"] or "unnamed-credential"
                    days = abs(c["days_until_expiry"]) if c["days_until_expiry"] is not None else "unknown"
                    exp_date = c["expires"].strftime("%Y-%m-%d") if c["expires"] else "past"
                    return f"Credential '{name}' expired on {exp_date} ({days} days ago)."
            return f"Identity '{display_name}' has an expired credential."

        elif rule_id == "CRED_004":
            for c in cred_health:
                if c["is_expiring_30d"] and not c["is_expiring_14d"]:
                    name = c["display_name"] or c["credential_id"] or "unnamed-secret"
                    days = c["days_until_expiry"]
                    exp_date = c["expires"].strftime("%Y-%m-%d") if c["expires"] else "soon"
                    return f"Secret '{name}' expires in {days} days ({exp_date})"
            # Fallback if triggered
            for c in cred_health:
                if c["is_expiring_30d"]:
                    name = c["display_name"] or c["credential_id"] or "unnamed-secret"
                    days = c["days_until_expiry"]
                    exp_date = c["expires"].strftime("%Y-%m-%d") if c["expires"] else "soon"
                    return f"Secret '{name}' expires in {days} days ({exp_date})"
            return f"Identity '{display_name}' has a credential expiring within 30 days."

        elif rule_id == "PERM_001":
            raw_perms = (
                getattr(identity, "permissions", None)
                or (identity.get("permissions") if isinstance(identity, dict) else None)
                or []
            )
            high_risk_names = []
            for p in raw_perms:
                is_high = getattr(p, "is_high_risk", False) or (p.get("is_high_risk") if isinstance(p, dict) else False)
                scope = (
                    getattr(p, "scope_or_role", None)
                    or getattr(p, "permission", None)
                    or (p.get("scope_or_role") if isinstance(p, dict) else None)
                    or (p.get("permission") if isinstance(p, dict) else None)
                )
                if is_high and scope:
                    high_risk_names.append(scope)

            if high_risk_names:
                if len(high_risk_names) == 1:
                    return f"Permission {high_risk_names[0]} is high risk"
                return f"Permissions {', '.join(high_risk_names)} are high risk application permissions."
            return f"Identity '{display_name}' holds high-risk application permissions."

        elif rule_id == "PERM_002":
            raw_grants = (
                getattr(identity, "oauth_grants", None)
                or (identity.get("oauth_grants") if isinstance(identity, dict) else None)
                or []
            )
            all_princ_scopes = []
            for g in raw_grants:
                c_type = (
                    getattr(g, "consent_type", None)
                    or getattr(g, "consentType", None)
                    or (g.get("consent_type") if isinstance(g, dict) else None)
                    or (g.get("consentType") if isinstance(g, dict) else None)
                )
                if c_type == "AllPrincipals":
                    scope = getattr(g, "scope", None) or (g.get("scope") if isinstance(g, dict) else "")
                    if scope:
                        all_princ_scopes.append(scope)

            if all_princ_scopes:
                return f"Org-wide OAuth grant (AllPrincipals) active for scope: '{' '.join(all_princ_scopes)}'."
            return f"Identity '{display_name}' holds an org-wide OAuth consent grant (AllPrincipals)."

        elif rule_id == "PUB_001":
            pub_name = (
                getattr(identity, "publisher_name", None)
                or (identity.get("publisher_name") if isinstance(identity, dict) else None)
                or "Unknown Developer"
            )
            return f"Unverified publisher '{pub_name}' granted active permissions."

        elif rule_id == "ID_001":
            raw_grants = (
                getattr(identity, "oauth_grants", None)
                or (identity.get("oauth_grants") if isinstance(identity, dict) else None)
                or []
            )
            return f"Disabled identity '{display_name}' retains {len(raw_grants)} active OAuth grant(s)."

        # Generic fallback
        rule_desc = rule.name if rule else rule_id
        return f"Rule {rule_id} triggered: {rule_desc} on identity '{display_name}'."

    def build(
        self,
        identity: Any,
        triggered_rules: Union[List[Rule], List[str]],
    ) -> List[Finding]:
        """Builds a list of Finding objects containing specific contextual evidence."""
        findings: List[Finding] = []

        for item in triggered_rules:
            if isinstance(item, Rule):
                rule = item
                rule_id = rule.id
            elif isinstance(item, str):
                rule_id = item
                rule = self.rules_by_id.get(rule_id)
            elif isinstance(item, dict):
                rule_id = item.get("id") or item.get("rule_id") or ""
                rule = self.rules_by_id.get(rule_id) or Rule(**item)
            else:
                rule_id = str(item)
                rule = self.rules_by_id.get(rule_id)

            rule_name = rule.name if rule else rule_id
            severity = rule.severity if rule else "MEDIUM"
            remediation = rule.remediation if rule else "Review and remediate this finding."

            evidence_text = self._build_evidence_for_rule(rule_id, identity, rule)

            findings.append(
                Finding(
                    rule_id=rule_id,
                    rule_name=rule_name,
                    severity=severity,
                    evidence_text=evidence_text,
                    remediation=remediation,
                )
            )

        return findings

