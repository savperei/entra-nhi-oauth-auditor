"""Risk engine and scoring service for Entra Non-Human Identities."""

from typing import List, Dict, Any
from src.dummy_data.synthetic_identities import SYNTHETIC_FINDINGS

class RiskEngine:
    @staticmethod
    def list_findings(identity_id: str = None) -> List[Dict[str, Any]]:
        if identity_id:
            return [f for f in SYNTHETIC_FINDINGS if f["identity_id"] == identity_id]
        return SYNTHETIC_FINDINGS

    @staticmethod
    def get_summary_metrics(identities: List[Dict[str, Any]], findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_identities = len(identities)
        critical_count = sum(1 for i in identities if i.get("risk_level") == "CRITICAL")
        high_count = sum(1 for i in identities if i.get("risk_level") == "HIGH")
        medium_count = sum(1 for i in identities if i.get("risk_level") == "MEDIUM")
        low_count = sum(1 for i in identities if i.get("risk_level") == "LOW")
        total_findings = len(findings)

        return {
            "total_identities": total_identities,
            "total_findings": total_findings,
            "critical_risk_count": critical_count,
            "high_risk_count": high_count,
            "medium_risk_count": medium_count,
            "low_risk_count": low_count,
        }

risk_engine = RiskEngine()

