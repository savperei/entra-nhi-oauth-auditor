"""Credential health analysis module for inspecting secret and certificate expiration."""

from datetime import datetime
from typing import Any, Dict, List, Optional


def _parse_datetime(val: Any) -> Optional[datetime]:
    """Safely converts string or datetime value to a timezone-naive datetime in UTC."""
    if not val:
        return None
    if isinstance(val, datetime):
        return val.replace(tzinfo=None)
    if isinstance(val, str):
        cleaned = val.strip().rstrip("Z")
        try:
            return datetime.fromisoformat(cleaned)
        except Exception:
            for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
                try:
                    return datetime.strptime(cleaned, fmt)
                except Exception:
                    pass
    return None


def check_credential_health(identity: Any) -> List[Dict[str, Any]]:
    """Checks each credential of an identity for expiration health:
    - expired (days < 0) -> rule CRED_003
    - expiring < 14 days -> rule CRED_002
    - expiring < 30 days -> rule CRED_004
    - no expiry set (None) -> rule CRED_001
    """
    raw_creds = []
    if isinstance(identity, dict):
        raw_creds = (
            identity.get("credentials")
            or identity.get("password_credentials")
            or identity.get("passwordCredentials")
            or []
        )
    else:
        raw_creds = (
            getattr(identity, "credentials", None)
            or getattr(identity, "password_credentials", None)
            or getattr(identity, "passwordCredentials", None)
            or []
        )

    now_utc = datetime.utcnow()
    results: List[Dict[str, Any]] = []

    for cred in raw_creds:
        cred_id = str(
            getattr(cred, "credential_id", None)
            or getattr(cred, "key_id", None)
            or getattr(cred, "keyId", None)
            or (cred.get("credential_id") if isinstance(cred, dict) else None)
            or (cred.get("key_id") if isinstance(cred, dict) else None)
            or (cred.get("keyId") if isinstance(cred, dict) else None)
            or ""
        )
        display_name = (
            getattr(cred, "display_name", None)
            or getattr(cred, "displayName", None)
            or (cred.get("display_name") if isinstance(cred, dict) else None)
            or (cred.get("displayName") if isinstance(cred, dict) else None)
        )
        raw_type = (
            getattr(cred, "type", None)
            or (cred.get("type") if isinstance(cred, dict) else None)
            or "secret"
        )
        cred_type = "certificate" if "cert" in str(raw_type).lower() else "secret"

        expires_val = (
            getattr(cred, "expires", None)
            or getattr(cred, "expires_date", None)
            or getattr(cred, "end_date_time", None)
            or getattr(cred, "endDateTime", None)
            or (cred.get("expires") if isinstance(cred, dict) else None)
            or (cred.get("expires_date") if isinstance(cred, dict) else None)
            or (cred.get("end_date_time") if isinstance(cred, dict) else None)
            or (cred.get("endDateTime") if isinstance(cred, dict) else None)
        )
        expires_dt = _parse_datetime(expires_val)

        # Retrieve or compute days_until_expiry
        days_until_expiry = getattr(cred, "days_until_expiry", None)
        if days_until_expiry is None and isinstance(cred, dict):
            days_until_expiry = cred.get("days_until_expiry")

        if days_until_expiry is None and expires_dt is not None:
            days_until_expiry = (expires_dt.date() - now_utc.date()).days

        # Risk evaluations
        is_expired = False
        is_expiring_14d = False
        is_expiring_30d = False
        has_no_expiry = False
        triggered_rule_ids = []

        if expires_dt is None and days_until_expiry is None:
            has_no_expiry = True
            triggered_rule_ids.append("CRED_001")
        elif days_until_expiry is not None:
            if days_until_expiry < 0:
                is_expired = True
                triggered_rule_ids.append("CRED_003")
            elif days_until_expiry < 14:
                is_expiring_14d = True
                is_expiring_30d = True
                triggered_rule_ids.append("CRED_002")
            elif days_until_expiry < 30:
                is_expiring_30d = True
                triggered_rule_ids.append("CRED_004")

        results.append({
            "credential_id": cred_id,
            "display_name": display_name,
            "type": cred_type,
            "expires": expires_dt,
            "days_until_expiry": days_until_expiry,
            "is_expired": is_expired,
            "is_expiring_14d": is_expiring_14d,
            "is_expiring_30d": is_expiring_30d,
            "has_no_expiry": has_no_expiry,
            "triggered_rule_ids": triggered_rule_ids,
        })

    return results

