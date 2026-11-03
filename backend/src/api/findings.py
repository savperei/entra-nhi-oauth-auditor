"""Audit risk findings endpoints."""

from typing import Any, Dict, List, Optional
try:
    from fastapi import APIRouter, Query
    from fastapi.responses import JSONResponse
except ImportError:
    from src.api.compat import APIRouter, Query
    from fastapi.responses import JSONResponse

from src.api.pipeline import get_pipeline_cache

router = APIRouter(prefix="/findings", tags=["Findings"])

_SEVERITY_ORDER = {
    "CRITICAL": 4,
    "HIGH": 3,
    "MEDIUM": 2,
    "LOW": 1,
    "NONE": 0,
}


def _extract_val(obj: Any, key: str, default: Any = None) -> Any:
    """Helper to extract a property whether from object or dict."""
    if hasattr(obj, key):
        return getattr(obj, key)
    if isinstance(obj, dict):
        return obj.get(key, default)
    return default


@router.get("")
@router.get("/")
def list_findings(
    severity: Optional[str] = Query(None, description="Filter by finding severity"),
    rule_id: Optional[str] = Query(None, description="Filter by rule ID"),
) -> List[Any]:
    """Retrieves all findings sorted by severity descending with optional filters.
    If no audit has been run yet (cache is empty or None), returns an empty list [].
    """
    try:
        pipeline_data = get_pipeline_cache()
        if not pipeline_data or not pipeline_data.get("findings"):
            return []

        all_findings = pipeline_data.get("findings", [])
        filtered: List[Any] = []

        for f in all_findings:
            f_severity = str(_extract_val(f, "severity", "")).upper()
            f_rule_id = str(_extract_val(f, "rule_id", "")).upper()

            if severity and f_severity != severity.strip().upper():
                continue

            if rule_id and f_rule_id != rule_id.strip().upper():
                continue

            filtered.append(f)

        # Sort severity descending
        filtered.sort(
            key=lambda item: _SEVERITY_ORDER.get(str(_extract_val(item, "severity", "")).upper(), 0),
            reverse=True,
        )

        return filtered
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal Server Error: {str(exc)}"},
        )
