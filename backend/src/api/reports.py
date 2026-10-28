"""Audit report generation and download endpoints."""

try:
    from fastapi import APIRouter
    from fastapi.responses import Response
except ImportError:
    from src.api.compat import APIRouter, Response

from src.api.pipeline import run_pipeline
from src.reporting import HTMLRenderer, JSONSerialiser

router = APIRouter(prefix="/reports", tags=["Reports"])

html_renderer = HTMLRenderer()
json_serialiser = JSONSerialiser()


@router.get("/json")
def get_json_report() -> Response:
    """Generates and returns the full audit result as a downloadable JSON file."""
    pipeline_data = run_pipeline()
    run_id = pipeline_data.get("run_id", "latest")
    json_str = json_serialiser.serialise(pipeline_data)

    headers = {
        "Content-Disposition": f'attachment; filename="audit_report_{run_id}.json"',
    }
    return Response(content=json_str, media_type="application/json", headers=headers)


@router.get("/html")
def get_html_report() -> Response:
    """Renders and returns the audit report as a downloadable HTML file."""
    pipeline_data = run_pipeline()
    run_id = pipeline_data.get("run_id", "latest")
    html_str = html_renderer.render(pipeline_data)

    headers = {
        "Content-Disposition": f'attachment; filename="audit_report_{run_id}.html"',
    }
    return Response(content=html_str, media_type="text/html", headers=headers)
