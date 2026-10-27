"""JSON report serializer for Entra NHI & OAuth Auditor pipeline results."""

from datetime import date, datetime
import json
from typing import Any, Dict, List
import uuid


class JSONSerialiser:
    """Serialises pipeline audit results into a standardized JSON report."""

    @staticmethod
    def _serial_default(obj: Any) -> Any:
        """JSON serialiser fallback for datetime, UUID, set, and object models."""
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, uuid.UUID):
            return str(obj)
        if isinstance(obj, set):
            return list(obj)
        if hasattr(obj, "model_dump"):
            return obj.model_dump()
        if hasattr(obj, "dict") and callable(obj.dict):
            return obj.dict()
        if hasattr(obj, "__dict__"):
            return {k: v for k, v in obj.__dict__.items() if not k.startswith("_")}
        return str(obj)

    @classmethod
    def _clean_identity(cls, identity: Any) -> Any:
        """Recursively cleans identity structure for serialization."""
        if hasattr(identity, "model_dump"):
            return identity.model_dump()
        if hasattr(identity, "dict") and callable(identity.dict):
            return identity.dict()
        if hasattr(identity, "__dict__"):
            return {
                k: cls._clean_identity(v)
                for k, v in identity.__dict__.items()
                if not k.startswith("_")
            }
        if isinstance(identity, dict):
            return {k: cls._clean_identity(v) for k, v in identity.items()}
        if isinstance(identity, (list, tuple)):
            return [cls._clean_identity(v) for v in identity]
        return identity

    def serialise(self, pipeline_result: dict, indent: int = 2) -> str:
        """Serialises the audit pipeline result into the standardized JSON schema:
        {
            "meta": {
                "run_id": str,
                "timestamp": str,
                "mode": "synthetic",
                "version": "1.0"
            },
            "summary": dict,
            "identities": list
        }
        """
        run_id = pipeline_result.get("run_id") or "latest"
        timestamp = (
            pipeline_result.get("timestamp")
            or datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        )
        summary = pipeline_result.get("summary") or {}
        raw_identities = pipeline_result.get("identities") or []

        identities: List[Any] = [
            self._clean_identity(ident) for ident in raw_identities
        ]

        payload: Dict[str, Any] = {
            "meta": {
                "run_id": run_id,
                "timestamp": timestamp,
                "mode": "synthetic",
                "version": "1.0",
            },
            "summary": summary,
            "identities": identities,
        }

        return json.dumps(payload, default=self._serial_default, indent=indent)

