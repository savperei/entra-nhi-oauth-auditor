"""HTML report renderer using Jinja2 templates."""

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List
import jinja2


class HTMLRenderer:
    """Renders audit pipeline results into a standalone HTML report."""

    def __init__(self, template_dir: Path | str | None = None) -> None:
        if template_dir:
            self.template_dir = Path(template_dir)
        else:
            # backend/src/reporting -> backend/templates
            self.template_dir = Path(__file__).resolve().parent.parent.parent / "templates"

    @classmethod
    def _extract_val(cls, obj: Any, key: str, default: Any = None) -> Any:
        if hasattr(obj, key):
            return getattr(obj, key)
        if isinstance(obj, dict):
            return obj.get(key, default)
        return default

    @classmethod
    def _format_date(cls, val: Any) -> str:
        if not val:
            return "Never"
        if isinstance(val, datetime):
            return val.strftime("%Y-%m-%d")
        if isinstance(val, str):
            try:
                cleaned = val.split("T")[0]
                return cleaned
            except Exception:
                return val
        return str(val)

    def _prepare_identities(self, raw_identities: List[Any]) -> List[Dict[str, Any]]:
        prepared: List[Dict[str, Any]] = []

        for item in raw_identities:
            display_name = self._extract_val(item, "display_name", "Unknown Identity")
            identity_type = self._extract_val(item, "identity_type", "ServicePrincipal")
            risk_level = self._extract_val(item, "risk_level", "None")
            risk_score = int(self._extract_val(item, "risk_score", 0) or 0)

            # Process credentials
            raw_creds = self._extract_val(item, "credentials", []) or []
            creds_list = []
            for c in raw_creds:
                name = (
                    self._extract_val(c, "display_name")
                    or self._extract_val(c, "credential_id")
                    or self._extract_val(c, "key_id")
                    or "Credential"
                )
                exp = self._extract_val(c, "expires")
                days_left = self._extract_val(c, "days_until_expiry")

                if days_left is None:
                    status = "No Expiry"
                    days_display = "N/A"
                elif days_left < 0:
                    status = "Expired"
                    days_display = f"{days_left}d"
                elif days_left <= 14:
                    status = "Expiring Soon"
                    days_display = f"{days_left}d"
                else:
                    status = "Valid"
                    days_display = f"{days_left}d"

                creds_list.append({
                    "name": name,
                    "expires": self._format_date(exp),
                    "days_left": days_display,
                    "status": status,
                })

            # Process permissions
            raw_perms = self._extract_val(item, "permissions", []) or []
            perms_list = []
            for p in raw_perms:
                scope = (
                    self._extract_val(p, "scope_or_role")
                    or self._extract_val(p, "scope")
                    or self._extract_val(p, "role")
                    or "Permission"
                )
                p_type = self._extract_val(p, "permission_type") or self._extract_val(p, "type") or "Delegated"
                is_high = bool(self._extract_val(p, "is_high_risk", False))
                perms_list.append({
                    "scope": scope,
                    "type": p_type,
                    "is_high_risk": is_high,
                })

            # Process findings
            raw_findings = self._extract_val(item, "findings", []) or []
            findings_list = []
            for f in raw_findings:
                rule_id = self._extract_val(f, "rule_id", "RISK")
                rule_name = self._extract_val(f, "rule_name", "Risk Finding")
                sev = str(self._extract_val(f, "severity", "MEDIUM")).upper()
                ev = (
                    self._extract_val(f, "evidence_text")
                    or self._extract_val(f, "description")
                    or ""
                )
                rem = self._extract_val(f, "remediation", "")
                findings_list.append({
                    "rule_id": rule_id,
                    "rule_name": rule_name,
                    "severity": sev,
                    "evidence": ev,
                    "remediation": rem,
                })

            top_finding = ""
            if findings_list:
                top_finding = f"{findings_list[0]['rule_name']} — {findings_list[0]['evidence']}"

            prepared.append({
                "id": self._extract_val(item, "id", ""),
                "display_name": display_name,
                "identity_type": identity_type,
                "risk_level": risk_level,
                "risk_score": risk_score,
                "top_finding": top_finding,
                "credentials": creds_list,
                "permissions": perms_list,
                "findings": findings_list,
            })

        # Sort by score descending
        prepared.sort(key=lambda x: x["risk_score"], reverse=True)
        return prepared

    def render(self, pipeline_result: dict) -> str:
        """Renders the pipeline result dictionary into standalone HTML."""
        run_id = pipeline_result.get("run_id") or "latest"
        timestamp = (
            pipeline_result.get("timestamp")
            or datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        )
        summary = pipeline_result.get("summary") or {}
        raw_identities = pipeline_result.get("identities") or []

        identities = self._prepare_identities(raw_identities)

        template_path = self.template_dir / "report.html.j2"
        if not template_path.exists():
            # Alternative extension check
            template_path = self.template_dir / "report.html.jinja2"

        env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(str(self.template_dir)),
            autoescape=True,
        )
        template = env.get_template(template_path.name)
        return template.render(
            run_id=run_id,
            timestamp=timestamp,
            summary=summary,
            identities=identities,
        )

