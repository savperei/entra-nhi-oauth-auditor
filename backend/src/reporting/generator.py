"""Report generator for Entra NHI & OAuth Auditor."""

from datetime import datetime, timezone
from typing import Dict, Any

class ReportGenerator:
    @staticmethod
    def generate_summary(identities: list, findings: list) -> Dict[str, Any]:
        return {
            "title": "Entra NHI & OAuth Audit Summary",
            "environment": "Synthetic Demonstration Mode",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_identities": len(identities),
            "total_findings": len(findings),
        }

report_generator = ReportGenerator()

