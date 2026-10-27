"""Audit execution and status endpoints."""

from typing import Any, Dict
try:
    from fastapi import APIRouter
except ImportError:
    from src.api.compat import APIRouter
from src.api.pipeline import run_pipeline, get_pipeline_cache

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.post("/run")
def run_audit() -> Dict[str, Any]:
    """Forces execution of the full audit pipeline and returns the AuditSummary."""
    result = run_pipeline(force=True)
    return {
        "run_id": result["run_id"],
        "timestamp": result["timestamp"],
        "total_identities": result["total_identities"],
        "summary": result["summary"],
    }


@router.get("/status")
def get_audit_status() -> Dict[str, Any]:
    """Returns the status and summary of the last audit run,
    or {"status": "no_audit_run"} if no audit has been executed.
    """
    cache = get_pipeline_cache()
    if not cache:
        return {"status": "no_audit_run"}

    return {
        "status": "completed",
        "run_id": cache["run_id"],
        "timestamp": cache["timestamp"],
        "total_identities": cache["total_identities"],
        "summary": cache["summary"],
    }
