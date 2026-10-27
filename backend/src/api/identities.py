"""Identities catalog and detail endpoints."""

from typing import Any, Dict, List, Optional
try:
    from fastapi import APIRouter, HTTPException, Query
except ImportError:
    from src.api.compat import APIRouter, HTTPException, Query
from src.api.pipeline import run_pipeline

router = APIRouter(prefix="/identities", tags=["Identities"])


def _extract_val(obj: Any, key: str, default: Any = None) -> Any:
    """Helper to extract a property whether from object or dict."""
    if hasattr(obj, key):
        return getattr(obj, key)
    if isinstance(obj, dict):
        return obj.get(key, default)
    return default


@router.get("")
@router.get("/")
def list_identities(
    type: Optional[str] = Query(None, description="Filter by identity type"),
    risk_level: Optional[str] = Query(None, description="Filter by risk severity level"),
    search: Optional[str] = Query(None, description="Search term for display name or ID"),
) -> List[Dict[str, Any]]:
    """Lists summarised non-human identities with optional filtering."""
    pipeline_data = run_pipeline()
    identities = pipeline_data.get("identities", [])
    summaries: List[Dict[str, Any]] = []

    for item in identities:
        ident_id = _extract_val(item, "id", "")
        display_name = _extract_val(item, "display_name", "")
        ident_type = _extract_val(item, "identity_type", "ServicePrincipal")
        level = _extract_val(item, "risk_level", "None")
        score = _extract_val(item, "risk_score", 0)
        is_pub_verified = bool(_extract_val(item, "is_publisher_verified", False))

        raw_creds = _extract_val(item, "credentials", [])
        raw_perms = _extract_val(item, "permissions", [])

        cred_count = len(raw_creds)
        high_risk_count = sum(
            1 for p in raw_perms if bool(_extract_val(p, "is_high_risk", False))
        )

        # Filters
        if type and str(ident_type).lower() != type.strip().lower():
            continue

        if risk_level and str(level).lower() != risk_level.strip().lower():
            continue

        if search:
            query = search.strip().lower()
            if query not in str(display_name).lower() and query not in str(ident_id).lower():
                continue

        summary = {
            "id": ident_id,
            "display_name": display_name,
            "identity_type": ident_type,
            "risk_level": level,
            "risk_score": score,
            "is_publisher_verified": is_pub_verified,
            "credential_count": cred_count,
            "high_risk_permission_count": high_risk_count,
        }
        summaries.append(summary)

    return summaries


@router.get("/{id}")
def get_identity_detail(id: str) -> Dict[str, Any]:
    """Retrieves full details for a specific non-human identity.
    Supports matching by id UUID, client_id/app_id, reference alias (e.g. SP-002, APP-001),
    or display name.
    """
    pipeline_data = run_pipeline()
    identities = pipeline_data.get("identities", [])

    target = id.strip().lower()
    matched = None

    # 1. Exact match by id or app_id/client_id
    for item in identities:
        ident_id = str(_extract_val(item, "id", "")).lower()
        app_id = str(
            _extract_val(item, "app_id", "") or _extract_val(item, "client_id", "")
        ).lower()
        if target in (ident_id, app_id):
            matched = item
            break

    # 2. Check reference code mappings (e.g. SP-001..SP-006, APP-001..APP-003, MI-001..MI-002)
    if not matched and (
        target.startswith("sp-")
        or target.startswith("app-")
        or target.startswith("mi-")
    ):
        code_map = {
            "sp-001": "contoso analytics app",
            "sp-002": "legacy crm connector",
            "sp-003": "hr integration service",
            "sp-004": "old reporting bot",
            "sp-005": "devops pipeline agent",
            "sp-006": "clean monitor app",
            "app-001": "finance dashboard",
            "app-002": "internal tools app",
            "app-003": "backup sync app",
            "mi-001": "vm-production-identity",
            "mi-002": "function-app-identity",
        }
        target_name = code_map.get(target)
        if target_name:
            for item in identities:
                disp_name = str(_extract_val(item, "display_name", "")).lower()
                if disp_name == target_name:
                    matched = item
                    break

    # 3. Fallback match by display name substring
    if not matched:
        for item in identities:
            disp_name = str(_extract_val(item, "display_name", "")).lower()
            if target == disp_name or target in disp_name:
                matched = item
                break

    if not matched:
        raise HTTPException(status_code=404, detail=f"Identity '{id}' not found.")

    raw_perms = _extract_val(matched, "permissions", [])
    raw_creds = _extract_val(matched, "credentials", [])
    raw_grants = _extract_val(matched, "oauth_grants", [])
    raw_findings = _extract_val(matched, "findings", [])
    remediation_list = _extract_val(matched, "remediation", [])

    # Deduplicate remediations
    deduped_remediations = list(dict.fromkeys(r for r in remediation_list if r))

    return {
        "id": _extract_val(matched, "id"),
        "display_name": _extract_val(matched, "display_name"),
        "identity_type": _extract_val(matched, "identity_type"),
        "publisher_name": _extract_val(matched, "publisher_name"),
        "is_publisher_verified": bool(_extract_val(matched, "is_publisher_verified", False)),
        "is_enabled": bool(_extract_val(matched, "is_enabled", True)),
        "created_at": _extract_val(matched, "created_at"),
        "risk_level": _extract_val(matched, "risk_level", "None"),
        "risk_score": _extract_val(matched, "risk_score", 0),
        "credential_count": len(raw_creds),
        "high_risk_permission_count": sum(
            1 for p in raw_perms if bool(_extract_val(p, "is_high_risk", False))
        ),
        "permissions": raw_perms,
        "credentials": raw_creds,
        "oauth_grants": raw_grants,
        "findings": raw_findings,
        "remediation": deduped_remediations,
        "remediations": deduped_remediations,
    }
