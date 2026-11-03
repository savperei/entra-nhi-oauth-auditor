"""Audit pipeline orchestrator module.
Runs data extraction, normalisation, analysis, risk scoring, evidence building, and caching.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from src.dummy_data import generate_dummy_tenant
from src.inventory import normalise_all
from src.analyzers import run_all_analyzers
from src.risk_engine import RuleLoader, RiskScorer, EvidenceBuilder

# In-memory module-level cache initialised as empty dict
_PIPELINE_CACHE: Dict[str, Any] = {}


def get_pipeline_cache() -> Dict[str, Any]:
    """Returns the cached pipeline result dictionary (empty dict if no audit has been run)."""
    global _PIPELINE_CACHE
    if _PIPELINE_CACHE is None:
        _PIPELINE_CACHE = {}
    return _PIPELINE_CACHE


def clear_pipeline_cache() -> None:
    """Resets the pipeline cache to empty dict."""
    global _PIPELINE_CACHE
    _PIPELINE_CACHE = {}


def run_pipeline(force: bool = False) -> Dict[str, Any]:
    """Orchestrates the end-to-end security audit pipeline:
    1. Extracts raw tenant inventory from dummy data generator.
    2. Normalises raw records into Pydantic models.
    3. Runs permission and publisher analyzers.
    4. Loads risk assessment rules.
    5. Scores each identity using the risk engine.
    6. Constructs specific finding evidence.
    7. Computes aggregate summary metrics.
    8. Caches and returns the full audit result.
    """
    global _PIPELINE_CACHE

    if _PIPELINE_CACHE and not force:
        return _PIPELINE_CACHE

    # 1. Generate dummy tenant data
    raw = generate_dummy_tenant()

    # 2. Normalise raw records
    identities = normalise_all(raw)

    # 3. Run analyzers (permissions, publishers)
    identities = run_all_analyzers(identities)

    # 4. Load rules
    rules = RuleLoader().load("rules/default_rules.yaml")

    # 5. Initialize scorer
    scorer = RiskScorer(rules)

    # 6. Initialize evidence builder
    builder = EvidenceBuilder(rules)

    # 7. For each identity: compute RiskScore + build Findings
    all_findings = []
    summary = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "none": 0,
    }

    for identity in identities:
        risk_score = scorer.score(identity)
        findings = builder.build(identity, risk_score.triggered_rule_ids)

        # Enrich identity with risk score and findings
        if hasattr(identity, "__setattr__"):
            identity.risk_score = risk_score.total_score
            identity.risk_level = risk_score.level
            identity.findings = findings
            identity.remediation = [f.remediation for f in findings if getattr(f, "remediation", None)]
        if isinstance(identity, dict):
            identity["risk_score"] = risk_score.total_score
            identity["risk_level"] = risk_score.level
            identity["findings"] = findings
            identity["remediation"] = [
                getattr(f, "remediation", None) or f.get("remediation")
                for f in findings
                if (getattr(f, "remediation", None) or (f.get("remediation") if isinstance(f, dict) else None))
            ]

        # Accumulate findings
        id_type = (
            getattr(identity, "identity_type", None)
            or (identity.get("identity_type") if isinstance(identity, dict) else None)
            or "ServicePrincipal"
        )
        for f in findings:
            if isinstance(f, dict):
                f_item = {
                    **f,
                    "identity_id": getattr(identity, "id", None) or identity.get("id"),
                    "identity_name": (
                        getattr(identity, "display_name", None)
                        or identity.get("display_name")
                        or getattr(identity, "name", None)
                        or identity.get("name")
                    ),
                    "identity_type": id_type,
                }
            else:
                f_item = f
                if hasattr(f, "__setattr__"):
                    f.identity_id = getattr(identity, "id", None) or identity.get("id")
                    f.identity_name = (
                        getattr(identity, "display_name", None)
                        or identity.get("display_name")
                        or getattr(identity, "name", None)
                        or identity.get("name")
                    )
                    f.identity_type = id_type
            all_findings.append(f_item)

        # Accumulate severity summary counts
        level_key = str(risk_score.level).lower()
        if level_key in summary:
            summary[level_key] += 1
        else:
            summary["none"] += 1

    run_id = f"run-{uuid.uuid4().hex[:8]}"
    timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    result = {
        "identities": identities,
        "findings": all_findings,
        "summary": summary,
        "run_id": run_id,
        "timestamp": timestamp,
        "total_identities": len(identities),
    }

    _PIPELINE_CACHE = result
    return result
