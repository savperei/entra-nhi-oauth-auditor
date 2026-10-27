"""Audit report generation and download endpoints."""

from datetime import datetime
import json
from pathlib import Path
from typing import Any
try:
    from fastapi import APIRouter
    from fastapi.responses import Response
except ImportError:
    from src.api.compat import APIRouter, Response
from jinja2 import Environment, FileSystemLoader

from src.api.pipeline import run_pipeline

router = APIRouter(prefix="/reports", tags=["Reports"])


def _json_serial(obj: Any) -> Any:
    """JSON serializer for objects not serializable by default json code."""
    if isinstance(obj, datetime):
        return obj.strftime("%Y-%m-%dT%H:%M:%SZ")
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if hasattr(obj, "dict"):
        return obj.dict()
    if hasattr(obj, "__dict__"):
        return {k: v for k, v in obj.__dict__.items() if not k.startswith("_")}
    return str(obj)


@router.get("/json")
def get_json_report() -> Response:
    """Generates and returns the full audit result as a downloadable JSON file."""
    pipeline_data = run_pipeline()
    run_id = pipeline_data.get("run_id", "latest")

    json_str = json.dumps(pipeline_data, default=_json_serial, indent=2)

    headers = {
        "Content-Disposition": f'attachment; filename="audit_report_{run_id}.json"',
    }
    return Response(content=json_str, media_type="application/json", headers=headers)


@router.get("/html")
def get_html_report() -> Response:
    """Renders and returns the audit report as a downloadable HTML file."""
    pipeline_data = run_pipeline()
    run_id = pipeline_data.get("run_id", "latest")
    timestamp = pipeline_data.get("timestamp", datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"))
    identities = pipeline_data.get("identities", [])
    raw_findings = pipeline_data.get("findings", [])
    summary = pipeline_data.get("summary", {})

    # Normalize findings for HTML template
    formatted_findings = []
    for f in raw_findings:
        sev = getattr(f, "severity", None) or (f.get("severity") if isinstance(f, dict) else "MEDIUM")
        rule_name = getattr(f, "rule_name", None) or (f.get("rule_name") if isinstance(f, dict) else "")
        ident_name = getattr(f, "identity_name", None) or (f.get("identity_name") if isinstance(f, dict) else "")
        ev_text = (
            getattr(f, "evidence_text", None)
            or (f.get("evidence_text") if isinstance(f, dict) else None)
            or getattr(f, "description", None)
            or (f.get("description") if isinstance(f, dict) else "")
        )
        rem = getattr(f, "remediation", None) or (f.get("remediation") if isinstance(f, dict) else "")

        formatted_findings.append({
            "severity": str(sev).upper(),
            "rule_name": rule_name,
            "identity_name": ident_name or "Target Identity",
            "description": ev_text,
            "evidence_text": ev_text,
            "remediation": rem,
        })

    # Render via Jinja2
    template_dir = Path(__file__).resolve().parent.parent.parent / "templates"
    rendered_html = ""

    if (template_dir / "audit_report.html.jinja2").exists():
        env = Environment(loader=FileSystemLoader(str(template_dir)), autoescape=True)
        template = env.get_template("audit_report.html.jinja2")
        rendered_html = template.render(
            environment="Synthetic Safe Local Mode",
            generated_at=timestamp,
            run_id=run_id,
            summary=summary,
            identities=identities,
            findings=formatted_findings,
        )
    else:
        # Fallback inline HTML template
        rows = "".join(
            f"<tr><td><b>{f['severity']}</b></td><td>{f['identity_name']}</td>"
            f"<td>{f['description']}</td><td>{f['remediation']}</td></tr>"
            for f in formatted_findings
        )
        rendered_html = f"""<!DOCTYPE html>
<html>
<head><title>Audit Report - {run_id}</title></head>
<body>
<h1>Entra Non-Human Identity &amp; OAuth Audit Report</h1>
<p>Generated At: {timestamp} (Run ID: {run_id})</p>
<table border="1" cellpadding="8" cellspacing="0">
<thead><tr><th>Severity</th><th>Identity</th><th>Finding</th><th>Remediation</th></tr></thead>
<tbody>{rows}</tbody>
</table>
</body>
</html>"""

    headers = {
        "Content-Disposition": f'attachment; filename="audit_report_{run_id}.html"',
    }
    return Response(content=rendered_html, media_type="text/html; charset=utf-8", headers=headers)
