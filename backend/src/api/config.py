"""Config and rules API endpoints for the NHI OAuth Auditor."""

from fastapi import APIRouter
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
    "none": 0,
}


@router.get("/rules")
def list_rules():
    """Returns all risk rules loaded from default_rules.yaml."""
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


@router.get("/config")
def get_config():
    """Returns system configuration: mode, version, thresholds, high-risk permissions.
    Does NOT return any secrets or credentials.
    """
    cache = get_pipeline_cache()
    last_audit_at = None
    if cache:
        last_audit_at = cache.get("timestamp")

    return {
        "mode": "synthetic",
        "version": "1.0.0",
        "rules_file": "rules/default_rules.yaml",
        "last_audit_at": last_audit_at,
        "thresholds": THRESHOLDS,
        "high_risk_permissions": HIGH_RISK_PERMISSIONS_LIST,
    }

