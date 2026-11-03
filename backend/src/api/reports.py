"""Audit report generation and download endpoints."""

try:
    from fastapi import APIRouter
    from fastapi.responses import Response, JSONResponse
except ImportError:
    from src.api.compat import APIRouter, Response
    from fastapi.responses import JSONResponse

from src.api.pipeline import get_pipeline_cache
from src.reporting import HTMLRenderer, JSONSerialiser

router = APIRouter(prefix="/reports", tags=["Reports"])

html_renderer = HTMLRenderer()
json_serialiser = JSONSerialiser()


@router.get("/json")
def get_json_report() -> Response:
    """Generates and returns the full audit result as a downloadable JSON file."""
    try:
        pipeline_data = get_pipeline_cache()
        if not pipeline_data:
            pipeline_data = {
                "meta": {"run_id": "no-audit", "timestamp": "", "mode": "synthetic", "version": "1.0"},
                "summary": {"critical": 0, "high": 0, "medium": 0, "low": 0, "none": 0},
                "identities": [],
                "findings": [],
                "run_id": "no-audit",
                "timestamp": "",
                "total_identities": 0,
            }
        run_id = pipeline_data.get("run_id", "latest")
        json_str = json_serialiser.serialise(pipeline_data)

        headers = {
            "Content-Disposition": f'attachment; filename="audit_report_{run_id}.json"',
        }
        return Response(content=json_str, media_type="application/json", headers=headers)
    except Exception as exc:
        return JSONResponse(status_code=500, content={"detail": str(exc)})


@router.get("/html")
def get_html_report() -> Response:
    """Renders and returns the audit report as a downloadable HTML file."""
    try:
        pipeline_data = get_pipeline_cache()
        if not pipeline_data:
            pipeline_data = {
                "meta": {"run_id": "no-audit", "timestamp": "", "mode": "synthetic", "version": "1.0"},
                "summary": {"critical": 0, "high": 0, "medium": 0, "low": 0, "none": 0},
                "identities": [],
                "findings": [],
                "run_id": "no-audit",
                "timestamp": "",
                "total_identities": 0,
            }
        run_id = pipeline_data.get("run_id", "latest")
        html_str = html_renderer.render(pipeline_data)

        headers = {
            "Content-Disposition": f'attachment; filename="audit_report_{run_id}.html"',
        }
        return Response(content=html_str, media_type="text/html", headers=headers)
    except Exception as exc:
        return JSONResponse(status_code=500, content={"detail": str(exc)})
