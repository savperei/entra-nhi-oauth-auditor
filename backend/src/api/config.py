"""Config and rules API endpoints for the NHI OAuth Auditor."""

import os
from fastapi import APIRouter, HTTPException
from src.risk_engine.rule_loader import RuleLoader
from src.risk_engine.scorer import HIGH_RISK_PERMISSIONS
from src.api.pipeline import get_pipeline_cache

router = APIRouter()

HIGH_RISK_PERMISSIONS_LIST = sorted(list(HIGH_RISK_PERMISSIONS))

THRESHOLDS = {
    "critical": 80,
    "high": 50,
    "medium": 25,
    "low": 1,
}


@router.get("/rules")
def list_rules():
    """Returns all risk rules loaded from default_rules.yaml."""
    try:
        rules = RuleLoader.load()
        return [
            {
                "id": r.id,
                "name": r.name,
                "severity": r.severity,
                "score": r.score,
                "remediation": r.remediation,
            }
            for r in rules
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load rules: {str(e)}")


@router.get("/config")
def get_config():
    """Returns system configuration: mode, version, thresholds, high-risk permissions.
    Does NOT return any secrets or credentials.
    """
    cache = get_pipeline_cache()
    last_audit_at = None
    if cache:
        last_audit_at = cache.get("timestamp")

    use_synthetic = os.getenv("USE_SYNTHETIC_DATA", "true").lower() == "true"
    mode = "synthetic" if use_synthetic else "live"

    return {
        "mode": mode,
        "version": "1.0.0",
        "thresholds": THRESHOLDS,
        "high_risk_permissions": HIGH_RISK_PERMISSIONS_LIST,
        "rules_file": "rules/default_rules.yaml",
        "last_audit_at": last_audit_at,
    }
