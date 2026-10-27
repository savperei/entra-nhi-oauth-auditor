"""Analyzer for evaluating OAuth permissions, scopes, and consent grants."""

from typing import List, Dict, Any

HIGH_PRIVILEGE_SCOPES = {
    "Directory.ReadWrite.All",
    "RoleManagement.ReadWrite.Directory",
    "Mail.ReadWrite",
    "Mail.Send",
    "User.ReadWrite.All",
    "Application.ReadWrite.All",
    "AppRoleAssignment.ReadWrite.All"
}

class OAuthAnalyzer:
    @staticmethod
    def inspect_permissions(permissions: List[Dict[str, Any]]) -> Dict[str, Any]:
        high_priv = []
        app_perms = []
        delegated_perms = []

        for p in permissions:
            perm_name = p.get("permission", "")
            perm_type = p.get("type", "Delegated")

            if perm_type == "Application":
                app_perms.append(perm_name)
            else:
                delegated_perms.append(perm_name)

            if perm_name in HIGH_PRIVILEGE_SCOPES or p.get("is_high_privilege"):
                high_priv.append(perm_name)

        return {
            "total_permissions": len(permissions),
            "high_privilege_count": len(high_priv),
            "high_privilege_scopes": high_priv,
            "application_permissions": app_perms,
            "delegated_permissions": delegated_perms
        }

oauth_analyzer = OAuthAnalyzer()

