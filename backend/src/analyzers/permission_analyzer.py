"""Permission analyzer module for Entra Non-Human Identities (NHI).
Evaluates permissions against high-risk scopes and detects org-wide consent grants.
"""

from typing import Any, Dict, List, Optional, Set

try:
    from src.inventory.models import NormalisedIdentity, Permission
except ImportError:
    class NormalisedIdentity(dict):
        """Represents a normalised identity supporting both attribute and dict-like access."""

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            if "permissions" not in self and "oauth_permissions" in self:
                self["permissions"] = self["oauth_permissions"]

        def __getattr__(self, name: str) -> Any:
            try:
                return self[name]
            except KeyError:
                raise AttributeError(f"'NormalisedIdentity' object has no attribute '{name}'")

        def __setattr__(self, name: str, value: Any) -> None:
            self[name] = value

        def to_dict(self) -> Dict[str, Any]:
            return dict(self)

    class Permission(dict):
        """Represents a single OAuth permission / scope / role."""

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

        def __getattr__(self, name: str) -> Any:
            try:
                return self[name]
            except KeyError:
                raise AttributeError(f"'Permission' object has no attribute '{name}'")

        def __setattr__(self, name: str, value: Any) -> None:
            self[name] = value

# Alias for alternative spelling
NormalizedIdentity = NormalisedIdentity


HIGH_RISK_PERMISSIONS: Set[str] = {
    "Directory.ReadWrite.All",
    "Application.ReadWrite.All",
    "RoleManagement.ReadWrite.Directory",
    "Mail.ReadWrite",
    "Files.ReadWrite.All",
    "User.ReadWrite.All",
    "Group.ReadWrite.All",
}


class PermissionAnalyzer:
    """Analyzer for inspecting identity permissions and detecting high-risk scopes."""

    def _extract_scope_or_role(self, perm: Any) -> Optional[str]:
        """Extracts the permission scope or role identifier from a permission entry."""
        if isinstance(perm, str):
            return perm
        if isinstance(perm, dict):
            return (
                perm.get("scope_or_role")
                or perm.get("permission")
                or perm.get("scope")
                or perm.get("role")
                or perm.get("name")
            )
        return (
            getattr(perm, "scope_or_role", None)
            or getattr(perm, "permission", None)
            or getattr(perm, "scope", None)
            or getattr(perm, "role", None)
            or getattr(perm, "name", None)
        )

    def _get_permissions_list(self, identity: Any) -> List[Any]:
        """Retrieves all permissions associated with the identity."""
        perms = []
        if isinstance(identity, dict):
            perms = identity.get("permissions") or identity.get("oauth_permissions") or []
        else:
            perms = (
                getattr(identity, "permissions", None)
                or getattr(identity, "oauth_permissions", None)
                or []
            )
        return list(perms)

    def _get_oauth_grants_list(self, identity: Any) -> List[Any]:
        """Retrieves all OAuth grants associated with the identity."""
        grants = []
        if isinstance(identity, dict):
            grants = (
                identity.get("oauth_grants")
                or identity.get("oauth_grant")
                or identity.get("grants")
                or []
            )
        else:
            grants = (
                getattr(identity, "oauth_grants", None)
                or getattr(identity, "oauth_grant", None)
                or getattr(identity, "grants", None)
                or []
            )
        return list(grants)

    def analyse(self, identity: NormalisedIdentity) -> NormalisedIdentity:
        """Enriches identity permissions with high-risk classification
        and flags org-wide AllPrincipals grants.
        """
        # 1. Inspect each permission and set is_high_risk=True if scope_or_role in HIGH_RISK_PERMISSIONS
        perms = self._get_permissions_list(identity)
        enriched_perms = []

        for p in perms:
            scope = self._extract_scope_or_role(p)
            is_high = scope in HIGH_RISK_PERMISSIONS if scope else False

            if isinstance(p, str):
                p_item = Permission(scope_or_role=p, is_high_risk=is_high)
            elif isinstance(p, dict):
                p["is_high_risk"] = is_high
                if "scope_or_role" not in p and scope:
                    p["scope_or_role"] = scope
                p_item = p
            else:
                setattr(p, "is_high_risk", is_high)
                if not hasattr(p, "scope_or_role") and scope:
                    setattr(p, "scope_or_role", scope)
                p_item = p

            enriched_perms.append(p_item)

        # Update permissions on identity
        if isinstance(identity, dict):
            identity["permissions"] = enriched_perms
            if "oauth_permissions" in identity:
                identity["oauth_permissions"] = enriched_perms
        if hasattr(identity, "__dict__"):
            setattr(identity, "permissions", enriched_perms)
            if hasattr(identity, "oauth_permissions"):
                setattr(identity, "oauth_permissions", enriched_perms)

        # 2. Flag if any oauth_grant has consent_type == "AllPrincipals"
        grants = self._get_oauth_grants_list(identity)
        has_all_principals = False

        for g in grants:
            consent_type = None
            if isinstance(g, dict):
                consent_type = g.get("consent_type") or g.get("consentType")
            else:
                consent_type = getattr(g, "consent_type", None) or getattr(g, "consentType", None)

            if consent_type == "AllPrincipals":
                has_all_principals = True
                break

        # Set AllPrincipals flag on identity
        if isinstance(identity, dict):
            identity["has_all_principals_grant"] = has_all_principals
            identity["has_all_principals"] = has_all_principals
            identity["all_principals_flag"] = has_all_principals
        if hasattr(identity, "__dict__"):
            setattr(identity, "has_all_principals_grant", has_all_principals)
            setattr(identity, "has_all_principals", has_all_principals)
            setattr(identity, "all_principals_flag", has_all_principals)

        return identity

    # Alias for American spelling
    analyze = analyse

    def get_high_risk_permissions(self, identity: Any) -> List[Any]:
        """Returns list of permissions where is_high_risk=True."""
        high_risk_list = []
        perms = self._get_permissions_list(identity)

        for p in perms:
            is_high = None
            if isinstance(p, dict):
                is_high = p.get("is_high_risk")
            else:
                is_high = getattr(p, "is_high_risk", None)

            # Fallback if analyse() has not yet run
            if is_high is None:
                scope = self._extract_scope_or_role(p)
                is_high = scope in HIGH_RISK_PERMISSIONS if scope else False

            if is_high is True:
                high_risk_list.append(p)

        return high_risk_list

