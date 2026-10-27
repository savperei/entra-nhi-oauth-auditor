"""Inventory normaliser module for Entra ID Non-Human Identities.
Converts raw tenant records into normalised Pydantic models.
"""

from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from .models import CredentialInfo, NormalisedIdentity, OAuthGrant, Permission

HIGH_RISK_PERMISSIONS = {
    "Directory.ReadWrite.All",
    "Application.ReadWrite.All",
    "RoleManagement.ReadWrite.Directory",
    "Mail.ReadWrite",
    "Files.ReadWrite.All",
    "User.ReadWrite.All",
    "Group.ReadWrite.All",
}


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


def _compute_days_until_expiry(expires_dt: Optional[datetime]) -> Optional[int]:
    """Computes days until expiry from today UTC; returns None if no expiry."""
    if expires_dt is None:
        return None
    now_utc = datetime.utcnow()
    # Number of days between expiration date and today UTC
    return (expires_dt.date() - now_utc.date()).days


def _map_credential(cred: Dict[str, Any]) -> CredentialInfo:
    """Maps a raw credential dictionary to CredentialInfo."""
    cred_id = str(
        cred.get("credential_id")
        or cred.get("key_id")
        or cred.get("keyId")
        or ""
    )
    raw_type = str(cred.get("type", "")).lower()
    cred_type = "certificate" if "cert" in raw_type else "secret"

    display_name = cred.get("display_name") or cred.get("displayName")
    created_dt = _parse_datetime(
        cred.get("created")
        or cred.get("created_date")
        or cred.get("start_date_time")
        or cred.get("startDateTime")
    )
    expires_dt = _parse_datetime(
        cred.get("expires")
        or cred.get("expires_date")
        or cred.get("end_date_time")
        or cred.get("endDateTime")
    )
    days_until_expiry = _compute_days_until_expiry(expires_dt)

    return CredentialInfo(
        credential_id=cred_id,
        type=cred_type,
        display_name=display_name,
        created=created_dt,
        expires=expires_dt,
        days_until_expiry=days_until_expiry,
    )


def _map_permission(p: Any) -> Permission:
    """Maps a raw permission entry to Permission."""
    if isinstance(p, str):
        scope_or_role = p
        perm_type = "Delegated"
        res_name = "Microsoft Graph"
        is_high = scope_or_role in HIGH_RISK_PERMISSIONS
    elif isinstance(p, dict):
        scope_or_role = str(
            p.get("scope_or_role")
            or p.get("permission")
            or p.get("scope")
            or p.get("role")
            or ""
        )
        raw_type = str(p.get("type") or p.get("permission_type") or "Delegated")
        perm_type = "Application" if raw_type.lower() == "application" else "Delegated"
        res_name = p.get("resource_display_name") or p.get("resource") or "Microsoft Graph"
        is_high = bool(p.get("is_high_risk", False) or scope_or_role in HIGH_RISK_PERMISSIONS)
    else:
        scope_or_role = str(
            getattr(p, "scope_or_role", None)
            or getattr(p, "permission", None)
            or getattr(p, "scope", None)
            or ""
        )
        raw_type = str(getattr(p, "type", None) or getattr(p, "permission_type", "Delegated"))
        perm_type = "Application" if raw_type.lower() == "application" else "Delegated"
        res_name = getattr(p, "resource_display_name", None) or getattr(p, "resource", "Microsoft Graph")
        is_high = bool(getattr(p, "is_high_risk", False) or scope_or_role in HIGH_RISK_PERMISSIONS)

    return Permission(
        scope_or_role=scope_or_role,
        permission_type=perm_type,
        resource_display_name=res_name,
        is_high_risk=is_high,
    )


def _map_oauth_grant(g: Dict[str, Any]) -> OAuthGrant:
    """Maps a raw OAuth grant dictionary to OAuthGrant."""
    grant_id = str(g.get("id") or g.get("grant_id") or "")
    consent_type = str(g.get("consentType") or g.get("consent_type") or "Principal")
    scope = str(g.get("scope") or "")
    resource_id = str(g.get("resourceId") or g.get("resource_id") or "")

    return OAuthGrant(
        grant_id=grant_id,
        consent_type=consent_type,
        scope=scope,
        resource_id=resource_id,
    )


def normalise_all(raw: dict) -> List[NormalisedIdentity]:
    """Accepts output of generate_dummy_tenant(), normalises each raw record
    to NormalisedIdentity, cross-references OAuth grants by clientId, computes
    days_until_expiry for each credential, and returns a flat deduplicated list by id.
    """
    if not isinstance(raw, dict):
        return []

    # 1. Index raw OAuth grants by clientId
    raw_grants = raw.get("oauth_grants") or raw.get("oauthGrants") or []
    grants_by_client_id: Dict[str, List[OAuthGrant]] = defaultdict(list)

    for g in raw_grants:
        grant_obj = _map_oauth_grant(g)
        c_id = g.get("clientId") or g.get("client_id")
        if c_id:
            grants_by_client_id[str(c_id)].append(grant_obj)

    # 2. Gather raw identity groups
    categories = [
        (raw.get("service_principals") or raw.get("servicePrincipals") or [], "ServicePrincipal"),
        (raw.get("app_registrations") or raw.get("appRegistrations") or [], "AppRegistration"),
        (raw.get("managed_identities") or raw.get("managedIdentities") or [], "ManagedIdentity"),
    ]

    all_identities: List[NormalisedIdentity] = []

    for records, default_type in categories:
        for rec in records:
            # Identity ID
            ident_id = str(rec.get("id") or rec.get("app_id") or rec.get("appId") or "")
            display_name = str(
                rec.get("display_name")
                or rec.get("displayName")
                or rec.get("name")
                or ""
            )
            raw_id_type = rec.get("identity_type") or default_type
            if raw_id_type not in ("ServicePrincipal", "AppRegistration", "ManagedIdentity"):
                raw_id_type = default_type

            # Publisher info
            publisher_name = (
                rec.get("publisher_name")
                or rec.get("publisherDomain")
                or rec.get("publisher_domain")
            )
            vp = rec.get("verified_publisher") or rec.get("verifiedPublisher")
            if not publisher_name and isinstance(vp, dict):
                publisher_name = vp.get("displayName")

            is_pub_verified = False
            for attr in ("is_publisher_verified", "is_verified_publisher", "is_verified"):
                val = rec.get(attr)
                if val is not None:
                    is_pub_verified = bool(val)
                    break
            else:
                if isinstance(vp, dict):
                    is_pub_verified = bool(vp.get("verifiedPublisherId") or vp.get("displayName"))
                elif vp:
                    is_pub_verified = True

            # Enabled status
            if "is_enabled" in rec:
                is_enabled = bool(rec["is_enabled"])
            elif "account_enabled" in rec:
                is_enabled = bool(rec["account_enabled"])
            elif "accountEnabled" in rec:
                is_enabled = bool(rec["accountEnabled"])
            elif "is_active" in rec:
                is_enabled = bool(rec["is_active"])
            elif "disabled" in rec:
                is_enabled = not bool(rec["disabled"])
            else:
                is_enabled = True

            created_at = _parse_datetime(
                rec.get("created_at")
                or rec.get("created_date")
                or rec.get("startDateTime")
            )

            # Map credentials
            raw_creds = (
                rec.get("credentials")
                or rec.get("password_credentials")
                or rec.get("passwordCredentials")
                or []
            )
            credentials = [_map_credential(c) for c in raw_creds]

            # Map permissions
            raw_perms = (
                rec.get("permissions")
                or rec.get("oauth_permissions")
                or []
            )
            permissions = [_map_permission(p) for p in raw_perms]

            # Cross-reference OAuth grants by clientId
            client_id_keys = [
                rec.get("client_id"),
                rec.get("clientId"),
                rec.get("app_id"),
                rec.get("appId"),
                rec.get("id"),
            ]
            oauth_grants: List[OAuthGrant] = []
            seen_grant_ids = set()

            for key in client_id_keys:
                if key and str(key) in grants_by_client_id:
                    for g in grants_by_client_id[str(key)]:
                        if g.grant_id not in seen_grant_ids:
                            seen_grant_ids.add(g.grant_id)
                            oauth_grants.append(g)

            # Also check if identity has embedded oauth_grants
            if "oauth_grants" in rec and isinstance(rec["oauth_grants"], list):
                for g in rec["oauth_grants"]:
                    grant_obj = _map_oauth_grant(g)
                    if grant_obj.grant_id not in seen_grant_ids:
                        seen_grant_ids.add(grant_obj.grant_id)
                        oauth_grants.append(grant_obj)

            identity = NormalisedIdentity(
                id=ident_id,
                display_name=display_name,
                identity_type=raw_id_type,
                publisher_name=publisher_name,
                is_publisher_verified=is_pub_verified,
                is_enabled=is_enabled,
                created_at=created_at,
                credentials=credentials,
                permissions=permissions,
                oauth_grants=oauth_grants,
            )
            all_identities.append(identity)

    # 3. Deduplicate flat list by id
    seen_ids = set()
    deduped_identities: List[NormalisedIdentity] = []
    for identity in all_identities:
        if identity.id not in seen_ids:
            seen_ids.add(identity.id)
            deduped_identities.append(identity)

    return deduped_identities

