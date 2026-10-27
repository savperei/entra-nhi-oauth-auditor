"""Publisher detector module for Entra Non-Human Identities (NHI).
Evaluates publisher verification status and flags risky unverified publishers.
"""

from typing import Any, Dict, Optional
from .permission_analyzer import NormalisedIdentity


class PublisherDetector:
    """Detects whether an identity publisher is verified and assesses related risk."""

    def _is_verified(self, identity: Any) -> bool:
        """Determines if the identity has a verified publisher."""
        # 1. Direct boolean flags
        for attr in ("is_verified", "is_verified_publisher", "verified"):
            val = getattr(identity, attr, None)
            if val is None and isinstance(identity, dict):
                val = identity.get(attr)
            if val is not None:
                return bool(val)

        # 2. Verified publisher object / dictionary
        vp = getattr(identity, "verified_publisher", None) or getattr(identity, "verifiedPublisher", None)
        if vp is None and isinstance(identity, dict):
            vp = identity.get("verified_publisher") or identity.get("verifiedPublisher")

        if isinstance(vp, dict):
            pub_id = vp.get("verifiedPublisherId") or vp.get("verified_publisher_id")
            display_name = vp.get("displayName") or vp.get("display_name")
            return bool(pub_id or display_name)
        elif vp:
            return True

        return False

    def _get_publisher_name(self, identity: Any) -> Optional[str]:
        """Extracts the publisher name or domain if available."""
        for attr in ("publisher_name", "publisherDomain", "publisher_domain"):
            val = getattr(identity, attr, None)
            if val is None and isinstance(identity, dict):
                val = identity.get(attr)
            if val and isinstance(val, str) and val.strip():
                return val.strip()

        # Check verified_publisher subfield
        vp = getattr(identity, "verified_publisher", None) or getattr(identity, "verifiedPublisher", None)
        if vp is None and isinstance(identity, dict):
            vp = identity.get("verified_publisher") or identity.get("verifiedPublisher")

        if isinstance(vp, dict):
            name = vp.get("displayName") or vp.get("display_name")
            if name and isinstance(name, str) and name.strip():
                return name.strip()

        return None

    def _has_permissions(self, identity: Any) -> bool:
        """Checks if the identity possesses any OAuth permissions or grants."""
        for attr in ("permissions", "oauth_permissions", "oauth_grants", "required_resource_access"):
            val = getattr(identity, attr, None)
            if val is None and isinstance(identity, dict):
                val = identity.get(attr)
            if val and len(val) > 0:
                return True
        return False

    def check(self, identity: NormalisedIdentity) -> Dict[str, Any]:
        """Checks publisher verification status, flags unverified publisher risk,
        and generates security findings if applicable.

        Returns:
            dict: {
                "is_verified": bool,
                "publisher_name": str | None,
                "risk_flag": bool (True if not verified AND has permissions),
                "finding": "OAuth consent granted to unverified publisher" or None
            }
        """
        is_verified = self._is_verified(identity)
        publisher_name = self._get_publisher_name(identity)
        has_permissions = self._has_permissions(identity)

        risk_flag = (not is_verified) and has_permissions
        finding = "OAuth consent granted to unverified publisher" if risk_flag else None

        return {
            "is_verified": is_verified,
            "publisher_name": publisher_name,
            "risk_flag": risk_flag,
            "finding": finding,
        }

    # Aliases
    detect = check
    analyse = check
    analyze = check

