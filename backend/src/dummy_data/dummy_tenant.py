"""Dummy tenant data generator for Entra NHI & OAuth Auditor.
Produces realistic synthetic inventory matching Microsoft Entra ID schema:
- service_principals
- app_registrations
- managed_identities
- oauth_grants
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any
import uuid


def _make_uuid(seed: str) -> str:
    """Generate a deterministic, realistic RFC-4122 UUID from a seed string."""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"entra.dummy.{seed}"))


def generate_dummy_tenant() -> Dict[str, List[Dict[str, Any]]]:
    """Returns a dictionary with keys matching the inventory shape:
    {
        "service_principals": [...],
        "app_registrations": [...],
        "managed_identities": [...],
        "oauth_grants": [...]
    }
    """
    now = datetime.utcnow()

    def iso_time(dt: datetime) -> str:
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    # Resource service principal IDs
    graph_resource_id = _make_uuid("resource-microsoft-graph")
    keyvault_resource_id = _make_uuid("resource-azure-keyvault")

    # Users for principal-scoped OAuth grants
    user_alice_id = _make_uuid("user-alice-smith")
    user_bob_id = _make_uuid("user-bob-jones")
    user_carol_id = _make_uuid("user-carol-danvers")
    user_dave_id = _make_uuid("user-dave-miller")

    # =========================================================================
    # SERVICE PRINCIPALS (6 records)
    # =========================================================================

    # SP-001: "Contoso Analytics App"
    # verified publisher, no high-risk perms, 1 secret expiring in 60 days (valid)
    sp_001_id = _make_uuid("sp-001-obj")
    sp_001_client_id = _make_uuid("sp-001-client")
    sp_001 = {
        "id": sp_001_id,
        "app_id": sp_001_client_id,
        "appId": sp_001_client_id,
        "client_id": sp_001_client_id,
        "clientId": sp_001_client_id,
        "name": "Contoso Analytics App",
        "display_name": "Contoso Analytics App",
        "displayName": "Contoso Analytics App",
        "service_principal_type": "Application",
        "servicePrincipalType": "Application",
        "identity_type": "ServicePrincipal",
        "account_enabled": True,
        "accountEnabled": True,
        "is_active": True,
        "disabled": False,
        "publisher_name": "Contoso Ltd.",
        "is_verified_publisher": True,
        "verified_publisher": {
            "displayName": "Contoso Ltd.",
            "verifiedPublisherId": "mpn-1029384",
            "addedDateTime": iso_time(now - timedelta(days=200)),
        },
        "verifiedPublisher": {
            "displayName": "Contoso Ltd.",
            "verifiedPublisherId": "mpn-1029384",
            "addedDateTime": iso_time(now - timedelta(days=200)),
        },
        "credentials": [
            {
                "type": "ClientSecret",
                "key_id": _make_uuid("sp-001-secret-1"),
                "keyId": _make_uuid("sp-001-secret-1"),
                "display_name": "Analytics-API-Secret",
                "displayName": "Analytics-API-Secret",
                "created_date": iso_time(now - timedelta(days=30)),
                "start_date_time": iso_time(now - timedelta(days=30)),
                "startDateTime": iso_time(now - timedelta(days=30)),
                "expires_date": iso_time(now + timedelta(days=60)),
                "end_date_time": iso_time(now + timedelta(days=60)),
                "endDateTime": iso_time(now + timedelta(days=60)),
                "is_expired": False,
                "days_until_expiry": 60,
                "hint": "ana***",
            }
        ],
        "password_credentials": [
            {
                "keyId": _make_uuid("sp-001-secret-1"),
                "displayName": "Analytics-API-Secret",
                "startDateTime": iso_time(now - timedelta(days=30)),
                "endDateTime": iso_time(now + timedelta(days=60)),
                "hint": "ana***",
            }
        ],
        "passwordCredentials": [
            {
                "keyId": _make_uuid("sp-001-secret-1"),
                "displayName": "Analytics-API-Secret",
                "startDateTime": iso_time(now - timedelta(days=30)),
                "endDateTime": iso_time(now + timedelta(days=60)),
                "hint": "ana***",
            }
        ],
        "key_credentials": [],
        "keyCredentials": [],
        "oauth_permissions": [
            {
                "resource": "Microsoft Graph",
                "permission": "User.Read",
                "type": "Delegated",
                "admin_consent": False,
                "is_high_privilege": False,
            },
            {
                "resource": "Microsoft Graph",
                "permission": "Reports.Read.All",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": False,
            },
        ],
        "permissions": ["User.Read", "Reports.Read.All"],
    }

    # SP-002: "Legacy CRM Connector"
    # unverified publisher, has Directory.ReadWrite.All permission, secret expires in 8 days (critical)
    sp_002_id = _make_uuid("sp-002-obj")
    sp_002_client_id = _make_uuid("sp-002-client")
    sp_002 = {
        "id": sp_002_id,
        "app_id": sp_002_client_id,
        "appId": sp_002_client_id,
        "client_id": sp_002_client_id,
        "clientId": sp_002_client_id,
        "name": "Legacy CRM Connector",
        "display_name": "Legacy CRM Connector",
        "displayName": "Legacy CRM Connector",
        "service_principal_type": "Application",
        "servicePrincipalType": "Application",
        "identity_type": "ServicePrincipal",
        "account_enabled": True,
        "accountEnabled": True,
        "is_active": True,
        "disabled": False,
        "publisher_name": "Unverified Third-Party Developer",
        "is_verified_publisher": False,
        "verified_publisher": None,
        "verifiedPublisher": None,
        "credentials": [
            {
                "type": "ClientSecret",
                "key_id": _make_uuid("sp-002-secret-1"),
                "keyId": _make_uuid("sp-002-secret-1"),
                "display_name": "CRM-Sync-Key",
                "displayName": "CRM-Sync-Key",
                "created_date": iso_time(now - timedelta(days=172)),
                "start_date_time": iso_time(now - timedelta(days=172)),
                "startDateTime": iso_time(now - timedelta(days=172)),
                "expires_date": iso_time(now + timedelta(days=8)),
                "end_date_time": iso_time(now + timedelta(days=8)),
                "endDateTime": iso_time(now + timedelta(days=8)),
                "is_expired": False,
                "days_until_expiry": 8,
                "hint": "crm***",
            }
        ],
        "password_credentials": [
            {
                "keyId": _make_uuid("sp-002-secret-1"),
                "displayName": "CRM-Sync-Key",
                "startDateTime": iso_time(now - timedelta(days=172)),
                "endDateTime": iso_time(now + timedelta(days=8)),
                "hint": "crm***",
            }
        ],
        "passwordCredentials": [
            {
                "keyId": _make_uuid("sp-002-secret-1"),
                "displayName": "CRM-Sync-Key",
                "startDateTime": iso_time(now - timedelta(days=172)),
                "endDateTime": iso_time(now + timedelta(days=8)),
                "hint": "crm***",
            }
        ],
        "key_credentials": [],
        "keyCredentials": [],
        "oauth_permissions": [
            {
                "resource": "Microsoft Graph",
                "permission": "Directory.ReadWrite.All",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": True,
            }
        ],
        "permissions": ["Directory.ReadWrite.All"],
    }

    # SP-003: "HR Integration Service"
    # verified publisher, org-wide OAuth grant (AllPrincipals), secret expires in 5 days (critical)
    sp_003_id = _make_uuid("sp-003-obj")
    sp_003_client_id = _make_uuid("sp-003-client")
    sp_003 = {
        "id": sp_003_id,
        "app_id": sp_003_client_id,
        "appId": sp_003_client_id,
        "client_id": sp_003_client_id,
        "clientId": sp_003_client_id,
        "name": "HR Integration Service",
        "display_name": "HR Integration Service",
        "displayName": "HR Integration Service",
        "service_principal_type": "Application",
        "servicePrincipalType": "Application",
        "identity_type": "ServicePrincipal",
        "account_enabled": True,
        "accountEnabled": True,
        "is_active": True,
        "disabled": False,
        "publisher_name": "Workday Inc.",
        "is_verified_publisher": True,
        "verified_publisher": {
            "displayName": "Workday Inc.",
            "verifiedPublisherId": "mpn-5544332",
            "addedDateTime": iso_time(now - timedelta(days=365)),
        },
        "verifiedPublisher": {
            "displayName": "Workday Inc.",
            "verifiedPublisherId": "mpn-5544332",
            "addedDateTime": iso_time(now - timedelta(days=365)),
        },
        "credentials": [
            {
                "type": "ClientSecret",
                "key_id": _make_uuid("sp-003-secret-1"),
                "keyId": _make_uuid("sp-003-secret-1"),
                "display_name": "HRIS-Production-Secret",
                "displayName": "HRIS-Production-Secret",
                "created_date": iso_time(now - timedelta(days=175)),
                "start_date_time": iso_time(now - timedelta(days=175)),
                "startDateTime": iso_time(now - timedelta(days=175)),
                "expires_date": iso_time(now + timedelta(days=5)),
                "end_date_time": iso_time(now + timedelta(days=5)),
                "endDateTime": iso_time(now + timedelta(days=5)),
                "is_expired": False,
                "days_until_expiry": 5,
                "hint": "hrp***",
            }
        ],
        "password_credentials": [
            {
                "keyId": _make_uuid("sp-003-secret-1"),
                "displayName": "HRIS-Production-Secret",
                "startDateTime": iso_time(now - timedelta(days=175)),
                "endDateTime": iso_time(now + timedelta(days=5)),
                "hint": "hrp***",
            }
        ],
        "passwordCredentials": [
            {
                "keyId": _make_uuid("sp-003-secret-1"),
                "displayName": "HRIS-Production-Secret",
                "startDateTime": iso_time(now - timedelta(days=175)),
                "endDateTime": iso_time(now + timedelta(days=5)),
                "hint": "hrp***",
            }
        ],
        "key_credentials": [],
        "keyCredentials": [],
        "oauth_permissions": [
            {
                "resource": "Microsoft Graph",
                "permission": "User.Read.All",
                "type": "Delegated",
                "admin_consent": True,
                "is_high_privilege": False,
            }
        ],
        "permissions": ["User.Read.All"],
    }

    # SP-004: "Old Reporting Bot" (disabled=True)
    # has 2 active oauth grants despite being disabled, no credentials
    sp_004_id = _make_uuid("sp-004-obj")
    sp_004_client_id = _make_uuid("sp-004-client")
    sp_004 = {
        "id": sp_004_id,
        "app_id": sp_004_client_id,
        "appId": sp_004_client_id,
        "client_id": sp_004_client_id,
        "clientId": sp_004_client_id,
        "name": "Old Reporting Bot",
        "display_name": "Old Reporting Bot",
        "displayName": "Old Reporting Bot",
        "service_principal_type": "Application",
        "servicePrincipalType": "Application",
        "identity_type": "ServicePrincipal",
        "account_enabled": False,
        "accountEnabled": False,
        "is_active": False,
        "disabled": True,
        "publisher_name": "Internal Contoso IT",
        "is_verified_publisher": False,
        "verified_publisher": None,
        "verifiedPublisher": None,
        "credentials": [],
        "password_credentials": [],
        "passwordCredentials": [],
        "key_credentials": [],
        "keyCredentials": [],
        "oauth_permissions": [
            {
                "resource": "Microsoft Graph",
                "permission": "Reports.Read",
                "type": "Delegated",
                "admin_consent": False,
                "is_high_privilege": False,
            },
            {
                "resource": "Microsoft Graph",
                "permission": "User.Read",
                "type": "Delegated",
                "admin_consent": False,
                "is_high_privilege": False,
            },
        ],
        "permissions": ["Reports.Read", "User.Read"],
    }

    # SP-005: "DevOps Pipeline Agent"
    # verified publisher, Application.ReadWrite.All permission, secret: no expiry set (long-lived)
    sp_005_id = _make_uuid("sp-005-obj")
    sp_005_client_id = _make_uuid("sp-005-client")
    sp_005 = {
        "id": sp_005_id,
        "app_id": sp_005_client_id,
        "appId": sp_005_client_id,
        "client_id": sp_005_client_id,
        "clientId": sp_005_client_id,
        "name": "DevOps Pipeline Agent",
        "display_name": "DevOps Pipeline Agent",
        "displayName": "DevOps Pipeline Agent",
        "service_principal_type": "Application",
        "servicePrincipalType": "Application",
        "identity_type": "ServicePrincipal",
        "account_enabled": True,
        "accountEnabled": True,
        "is_active": True,
        "disabled": False,
        "publisher_name": "Microsoft Corporation",
        "is_verified_publisher": True,
        "verified_publisher": {
            "displayName": "Microsoft Corporation",
            "verifiedPublisherId": "mpn-0000001",
            "addedDateTime": iso_time(now - timedelta(days=700)),
        },
        "verifiedPublisher": {
            "displayName": "Microsoft Corporation",
            "verifiedPublisherId": "mpn-0000001",
            "addedDateTime": iso_time(now - timedelta(days=700)),
        },
        "credentials": [
            {
                "type": "ClientSecret",
                "key_id": _make_uuid("sp-005-secret-1"),
                "keyId": _make_uuid("sp-005-secret-1"),
                "display_name": "Pipeline-Deploy-Token",
                "displayName": "Pipeline-Deploy-Token",
                "created_date": iso_time(now - timedelta(days=400)),
                "start_date_time": iso_time(now - timedelta(days=400)),
                "startDateTime": iso_time(now - timedelta(days=400)),
                "expires_date": None,
                "end_date_time": None,
                "endDateTime": None,
                "is_expired": False,
                "days_until_expiry": None,
                "hint": "pip***",
            }
        ],
        "password_credentials": [
            {
                "keyId": _make_uuid("sp-005-secret-1"),
                "displayName": "Pipeline-Deploy-Token",
                "startDateTime": iso_time(now - timedelta(days=400)),
                "endDateTime": None,
                "hint": "pip***",
            }
        ],
        "passwordCredentials": [
            {
                "keyId": _make_uuid("sp-005-secret-1"),
                "displayName": "Pipeline-Deploy-Token",
                "startDateTime": iso_time(now - timedelta(days=400)),
                "endDateTime": None,
                "hint": "pip***",
            }
        ],
        "key_credentials": [],
        "keyCredentials": [],
        "oauth_permissions": [
            {
                "resource": "Microsoft Graph",
                "permission": "Application.ReadWrite.All",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": True,
            }
        ],
        "permissions": ["Application.ReadWrite.All"],
    }

    # SP-006: "Clean Monitor App"
    # verified, no high-risk perms, secret valid 45 days
    sp_006_id = _make_uuid("sp-006-obj")
    sp_006_client_id = _make_uuid("sp-006-client")
    sp_006 = {
        "id": sp_006_id,
        "app_id": sp_006_client_id,
        "appId": sp_006_client_id,
        "client_id": sp_006_client_id,
        "clientId": sp_006_client_id,
        "name": "Clean Monitor App",
        "display_name": "Clean Monitor App",
        "displayName": "Clean Monitor App",
        "service_principal_type": "Application",
        "servicePrincipalType": "Application",
        "identity_type": "ServicePrincipal",
        "account_enabled": True,
        "accountEnabled": True,
        "is_active": True,
        "disabled": False,
        "publisher_name": "Datadog Inc.",
        "is_verified_publisher": True,
        "verified_publisher": {
            "displayName": "Datadog Inc.",
            "verifiedPublisherId": "mpn-4422110",
            "addedDateTime": iso_time(now - timedelta(days=150)),
        },
        "verifiedPublisher": {
            "displayName": "Datadog Inc.",
            "verifiedPublisherId": "mpn-4422110",
            "addedDateTime": iso_time(now - timedelta(days=150)),
        },
        "credentials": [
            {
                "type": "ClientSecret",
                "key_id": _make_uuid("sp-006-secret-1"),
                "keyId": _make_uuid("sp-006-secret-1"),
                "display_name": "Telemetry-Collector-Secret",
                "displayName": "Telemetry-Collector-Secret",
                "created_date": iso_time(now - timedelta(days=45)),
                "start_date_time": iso_time(now - timedelta(days=45)),
                "startDateTime": iso_time(now - timedelta(days=45)),
                "expires_date": iso_time(now + timedelta(days=45)),
                "end_date_time": iso_time(now + timedelta(days=45)),
                "endDateTime": iso_time(now + timedelta(days=45)),
                "is_expired": False,
                "days_until_expiry": 45,
                "hint": "tel***",
            }
        ],
        "password_credentials": [
            {
                "keyId": _make_uuid("sp-006-secret-1"),
                "displayName": "Telemetry-Collector-Secret",
                "startDateTime": iso_time(now - timedelta(days=45)),
                "endDateTime": iso_time(now + timedelta(days=45)),
                "hint": "tel***",
            }
        ],
        "passwordCredentials": [
            {
                "keyId": _make_uuid("sp-006-secret-1"),
                "displayName": "Telemetry-Collector-Secret",
                "startDateTime": iso_time(now - timedelta(days=45)),
                "endDateTime": iso_time(now + timedelta(days=45)),
                "hint": "tel***",
            }
        ],
        "key_credentials": [],
        "keyCredentials": [],
        "oauth_permissions": [
            {
                "resource": "Microsoft Graph",
                "permission": "AuditLog.Read.All",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": False,
            }
        ],
        "permissions": ["AuditLog.Read.All"],
    }

    service_principals = [sp_001, sp_002, sp_003, sp_004, sp_005, sp_006]

    # =========================================================================
    # APP REGISTRATIONS (3 records)
    # =========================================================================

    # APP-001: "Finance Dashboard"
    # Mail.ReadWrite + Files.ReadWrite.All (high risk), secret expires in 3 days
    app_001_id = _make_uuid("app-001-obj")
    app_001_client_id = _make_uuid("app-001-client")
    app_001 = {
        "id": app_001_id,
        "app_id": app_001_client_id,
        "appId": app_001_client_id,
        "client_id": app_001_client_id,
        "clientId": app_001_client_id,
        "name": "Finance Dashboard",
        "display_name": "Finance Dashboard",
        "displayName": "Finance Dashboard",
        "identity_type": "AppRegistration",
        "publisher_domain": "finance.contoso.com",
        "publisherDomain": "finance.contoso.com",
        "publisher_name": "Contoso Financial Services",
        "is_verified_publisher": True,
        "verified_publisher": {
            "displayName": "Contoso Financial Services",
            "verifiedPublisherId": "mpn-7711223",
            "addedDateTime": iso_time(now - timedelta(days=180)),
        },
        "verifiedPublisher": {
            "displayName": "Contoso Financial Services",
            "verifiedPublisherId": "mpn-7711223",
            "addedDateTime": iso_time(now - timedelta(days=180)),
        },
        "credentials": [
            {
                "type": "ClientSecret",
                "key_id": _make_uuid("app-001-secret-1"),
                "keyId": _make_uuid("app-001-secret-1"),
                "display_name": "Finance-Dashboard-Secret",
                "displayName": "Finance-Dashboard-Secret",
                "created_date": iso_time(now - timedelta(days=177)),
                "start_date_time": iso_time(now - timedelta(days=177)),
                "startDateTime": iso_time(now - timedelta(days=177)),
                "expires_date": iso_time(now + timedelta(days=3)),
                "end_date_time": iso_time(now + timedelta(days=3)),
                "endDateTime": iso_time(now + timedelta(days=3)),
                "is_expired": False,
                "days_until_expiry": 3,
                "hint": "fin***",
            }
        ],
        "password_credentials": [
            {
                "keyId": _make_uuid("app-001-secret-1"),
                "displayName": "Finance-Dashboard-Secret",
                "startDateTime": iso_time(now - timedelta(days=177)),
                "endDateTime": iso_time(now + timedelta(days=3)),
                "hint": "fin***",
            }
        ],
        "passwordCredentials": [
            {
                "keyId": _make_uuid("app-001-secret-1"),
                "displayName": "Finance-Dashboard-Secret",
                "startDateTime": iso_time(now - timedelta(days=177)),
                "endDateTime": iso_time(now + timedelta(days=3)),
                "hint": "fin***",
            }
        ],
        "key_credentials": [],
        "keyCredentials": [],
        "oauth_permissions": [
            {
                "resource": "Microsoft Graph",
                "permission": "Mail.ReadWrite",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": True,
            },
            {
                "resource": "Microsoft Graph",
                "permission": "Files.ReadWrite.All",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": True,
            },
        ],
        "permissions": ["Mail.ReadWrite", "Files.ReadWrite.All"],
    }

    # APP-002: "Internal Tools App"
    # no high-risk perms, secret expires in 200 days
    app_002_id = _make_uuid("app-002-obj")
    app_002_client_id = _make_uuid("app-002-client")
    app_002 = {
        "id": app_002_id,
        "app_id": app_002_client_id,
        "appId": app_002_client_id,
        "client_id": app_002_client_id,
        "clientId": app_002_client_id,
        "name": "Internal Tools App",
        "display_name": "Internal Tools App",
        "displayName": "Internal Tools App",
        "identity_type": "AppRegistration",
        "publisher_domain": "internal.contoso.com",
        "publisherDomain": "internal.contoso.com",
        "publisher_name": "Contoso Internal IT",
        "is_verified_publisher": True,
        "verified_publisher": {
            "displayName": "Contoso Internal IT",
            "verifiedPublisherId": "mpn-9988776",
            "addedDateTime": iso_time(now - timedelta(days=100)),
        },
        "verifiedPublisher": {
            "displayName": "Contoso Internal IT",
            "verifiedPublisherId": "mpn-9988776",
            "addedDateTime": iso_time(now - timedelta(days=100)),
        },
        "credentials": [
            {
                "type": "ClientSecret",
                "key_id": _make_uuid("app-002-secret-1"),
                "keyId": _make_uuid("app-002-secret-1"),
                "display_name": "Tools-Secret-2024",
                "displayName": "Tools-Secret-2024",
                "created_date": iso_time(now - timedelta(days=165)),
                "start_date_time": iso_time(now - timedelta(days=165)),
                "startDateTime": iso_time(now - timedelta(days=165)),
                "expires_date": iso_time(now + timedelta(days=200)),
                "end_date_time": iso_time(now + timedelta(days=200)),
                "endDateTime": iso_time(now + timedelta(days=200)),
                "is_expired": False,
                "days_until_expiry": 200,
                "hint": "too***",
            }
        ],
        "password_credentials": [
            {
                "keyId": _make_uuid("app-002-secret-1"),
                "displayName": "Tools-Secret-2024",
                "startDateTime": iso_time(now - timedelta(days=165)),
                "endDateTime": iso_time(now + timedelta(days=200)),
                "hint": "too***",
            }
        ],
        "passwordCredentials": [
            {
                "keyId": _make_uuid("app-002-secret-1"),
                "displayName": "Tools-Secret-2024",
                "startDateTime": iso_time(now - timedelta(days=165)),
                "endDateTime": iso_time(now + timedelta(days=200)),
                "hint": "too***",
            }
        ],
        "key_credentials": [],
        "keyCredentials": [],
        "oauth_permissions": [
            {
                "resource": "Microsoft Graph",
                "permission": "User.Read",
                "type": "Delegated",
                "admin_consent": False,
                "is_high_privilege": False,
            },
            {
                "resource": "Microsoft Graph",
                "permission": "GroupMember.Read.All",
                "type": "Delegated",
                "admin_consent": True,
                "is_high_privilege": False,
            },
        ],
        "permissions": ["User.Read", "GroupMember.Read.All"],
    }

    # APP-003: "Backup Sync App"
    # unverified publisher, User.ReadWrite.All
    app_003_id = _make_uuid("app-003-obj")
    app_003_client_id = _make_uuid("app-003-client")
    app_003 = {
        "id": app_003_id,
        "app_id": app_003_client_id,
        "appId": app_003_client_id,
        "client_id": app_003_client_id,
        "clientId": app_003_client_id,
        "name": "Backup Sync App",
        "display_name": "Backup Sync App",
        "displayName": "Backup Sync App",
        "identity_type": "AppRegistration",
        "publisher_domain": "unknown-cloud-backups.net",
        "publisherDomain": "unknown-cloud-backups.net",
        "publisher_name": "Unverified Backup Developer",
        "is_verified_publisher": False,
        "verified_publisher": None,
        "verifiedPublisher": None,
        "credentials": [
            {
                "type": "ClientSecret",
                "key_id": _make_uuid("app-003-secret-1"),
                "keyId": _make_uuid("app-003-secret-1"),
                "display_name": "BackupSync-Key",
                "displayName": "BackupSync-Key",
                "created_date": iso_time(now - timedelta(days=90)),
                "start_date_time": iso_time(now - timedelta(days=90)),
                "startDateTime": iso_time(now - timedelta(days=90)),
                "expires_date": iso_time(now + timedelta(days=90)),
                "end_date_time": iso_time(now + timedelta(days=90)),
                "endDateTime": iso_time(now + timedelta(days=90)),
                "is_expired": False,
                "days_until_expiry": 90,
                "hint": "syn***",
            }
        ],
        "password_credentials": [
            {
                "keyId": _make_uuid("app-003-secret-1"),
                "displayName": "BackupSync-Key",
                "startDateTime": iso_time(now - timedelta(days=90)),
                "endDateTime": iso_time(now + timedelta(days=90)),
                "hint": "syn***",
            }
        ],
        "passwordCredentials": [
            {
                "keyId": _make_uuid("app-003-secret-1"),
                "displayName": "BackupSync-Key",
                "startDateTime": iso_time(now - timedelta(days=90)),
                "endDateTime": iso_time(now + timedelta(days=90)),
                "hint": "syn***",
            }
        ],
        "key_credentials": [],
        "keyCredentials": [],
        "oauth_permissions": [
            {
                "resource": "Microsoft Graph",
                "permission": "User.ReadWrite.All",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": True,
            }
        ],
        "permissions": ["User.ReadWrite.All"],
    }

    app_registrations = [app_001, app_002, app_003]

    # =========================================================================
    # MANAGED IDENTITIES (2 records)
    # =========================================================================

    # MI-001: "VM-Production-Identity"
    # org-wide OAuth grant
    mi_001_id = _make_uuid("mi-001-obj")
    mi_001_client_id = _make_uuid("mi-001-client")
    mi_001 = {
        "id": mi_001_id,
        "app_id": mi_001_client_id,
        "appId": mi_001_client_id,
        "client_id": mi_001_client_id,
        "clientId": mi_001_client_id,
        "name": "VM-Production-Identity",
        "display_name": "VM-Production-Identity",
        "displayName": "VM-Production-Identity",
        "identity_type": "ManagedIdentity",
        "service_principal_type": "ManagedIdentity",
        "servicePrincipalType": "ManagedIdentity",
        "account_enabled": True,
        "accountEnabled": True,
        "is_active": True,
        "disabled": False,
        "resource_id": "/subscriptions/7b8c9d0e-1234-4567-89ab-cdef01234567/resourceGroups/rg-prod-compute/providers/Microsoft.Compute/virtualMachines/vm-prod-core-01",
        "resourceId": "/subscriptions/7b8c9d0e-1234-4567-89ab-cdef01234567/resourceGroups/rg-prod-compute/providers/Microsoft.Compute/virtualMachines/vm-prod-core-01",
        "publisher_name": "Microsoft Azure Managed Identity",
        "is_verified_publisher": True,
        "verified_publisher": {
            "displayName": "Microsoft Azure",
            "verifiedPublisherId": "mpn-0000001",
            "addedDateTime": iso_time(now - timedelta(days=300)),
        },
        "verifiedPublisher": {
            "displayName": "Microsoft Azure",
            "verifiedPublisherId": "mpn-0000001",
            "addedDateTime": iso_time(now - timedelta(days=300)),
        },
        "credentials": [],
        "password_credentials": [],
        "passwordCredentials": [],
        "key_credentials": [],
        "keyCredentials": [],
        "oauth_permissions": [
            {
                "resource": "Microsoft Graph",
                "permission": "Directory.Read.All",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": False,
            }
        ],
        "permissions": ["Directory.Read.All"],
    }

    # MI-002: "Function-App-Identity"
    # clean, no risky grants
    mi_002_id = _make_uuid("mi-002-obj")
    mi_002_client_id = _make_uuid("mi-002-client")
    mi_002 = {
        "id": mi_002_id,
        "app_id": mi_002_client_id,
        "appId": mi_002_client_id,
        "client_id": mi_002_client_id,
        "clientId": mi_002_client_id,
        "name": "Function-App-Identity",
        "display_name": "Function-App-Identity",
        "displayName": "Function-App-Identity",
        "identity_type": "ManagedIdentity",
        "service_principal_type": "ManagedIdentity",
        "servicePrincipalType": "ManagedIdentity",
        "account_enabled": True,
        "accountEnabled": True,
        "is_active": True,
        "disabled": False,
        "resource_id": "/subscriptions/7b8c9d0e-1234-4567-89ab-cdef01234567/resourceGroups/rg-prod-serverless/providers/Microsoft.Web/sites/func-payment-events",
        "resourceId": "/subscriptions/7b8c9d0e-1234-4567-89ab-cdef01234567/resourceGroups/rg-prod-serverless/providers/Microsoft.Web/sites/func-payment-events",
        "publisher_name": "Microsoft Azure Managed Identity",
        "is_verified_publisher": True,
        "verified_publisher": {
            "displayName": "Microsoft Azure",
            "verifiedPublisherId": "mpn-0000001",
            "addedDateTime": iso_time(now - timedelta(days=200)),
        },
        "verifiedPublisher": {
            "displayName": "Microsoft Azure",
            "verifiedPublisherId": "mpn-0000001",
            "addedDateTime": iso_time(now - timedelta(days=200)),
        },
        "credentials": [],
        "password_credentials": [],
        "passwordCredentials": [],
        "key_credentials": [],
        "keyCredentials": [],
        "oauth_permissions": [
            {
                "resource": "Azure Key Vault",
                "permission": "KeyVault.Secrets.Get",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": False,
            }
        ],
        "permissions": ["KeyVault.Secrets.Get"],
    }

    managed_identities = [mi_001, mi_002]

    # =========================================================================
    # OAUTH GRANTS (match the above identities by clientId):
    # - AllPrincipals grant for SP-003, MI-001
    # - Principal-scoped grants for SP-001, SP-006
    # - SP-004 has 2 active oauth grants despite being disabled
    # =========================================================================
    oauth_grants = [
        # AllPrincipals grant for SP-003
        {
            "id": _make_uuid("grant-sp-003-allprincipals"),
            "clientId": sp_003_client_id,
            "client_id": sp_003_client_id,
            "consentType": "AllPrincipals",
            "consent_type": "AllPrincipals",
            "principalId": None,
            "principal_id": None,
            "resourceId": graph_resource_id,
            "resource_id": graph_resource_id,
            "scope": "User.Read.All Directory.Read.All",
            "startTime": iso_time(now - timedelta(days=175)),
            "start_time": iso_time(now - timedelta(days=175)),
            "expiryTime": iso_time(now + timedelta(days=365)),
            "expiry_time": iso_time(now + timedelta(days=365)),
        },
        # AllPrincipals grant for MI-001
        {
            "id": _make_uuid("grant-mi-001-allprincipals"),
            "clientId": mi_001_client_id,
            "client_id": mi_001_client_id,
            "consentType": "AllPrincipals",
            "consent_type": "AllPrincipals",
            "principalId": None,
            "principal_id": None,
            "resourceId": graph_resource_id,
            "resource_id": graph_resource_id,
            "scope": "Directory.Read.All Files.Read.All",
            "startTime": iso_time(now - timedelta(days=300)),
            "start_time": iso_time(now - timedelta(days=300)),
            "expiryTime": iso_time(now + timedelta(days=365)),
            "expiry_time": iso_time(now + timedelta(days=365)),
        },
        # Principal-scoped grant for SP-001
        {
            "id": _make_uuid("grant-sp-001-principal"),
            "clientId": sp_001_client_id,
            "client_id": sp_001_client_id,
            "consentType": "Principal",
            "consent_type": "Principal",
            "principalId": user_alice_id,
            "principal_id": user_alice_id,
            "resourceId": graph_resource_id,
            "resource_id": graph_resource_id,
            "scope": "User.Read Reports.Read",
            "startTime": iso_time(now - timedelta(days=30)),
            "start_time": iso_time(now - timedelta(days=30)),
            "expiryTime": iso_time(now + timedelta(days=365)),
            "expiry_time": iso_time(now + timedelta(days=365)),
        },
        # Principal-scoped grant for SP-006
        {
            "id": _make_uuid("grant-sp-006-principal"),
            "clientId": sp_006_client_id,
            "client_id": sp_006_client_id,
            "consentType": "Principal",
            "consent_type": "Principal",
            "principalId": user_bob_id,
            "principal_id": user_bob_id,
            "resourceId": graph_resource_id,
            "resource_id": graph_resource_id,
            "scope": "AuditLog.Read.All",
            "startTime": iso_time(now - timedelta(days=45)),
            "start_time": iso_time(now - timedelta(days=45)),
            "expiryTime": iso_time(now + timedelta(days=365)),
            "expiry_time": iso_time(now + timedelta(days=365)),
        },
        # SP-004 Active OAuth Grant 1 (active despite SP being disabled)
        {
            "id": _make_uuid("grant-sp-004-active-1"),
            "clientId": sp_004_client_id,
            "client_id": sp_004_client_id,
            "consentType": "Principal",
            "consent_type": "Principal",
            "principalId": user_carol_id,
            "principal_id": user_carol_id,
            "resourceId": graph_resource_id,
            "resource_id": graph_resource_id,
            "scope": "Reports.Read",
            "startTime": iso_time(now - timedelta(days=250)),
            "start_time": iso_time(now - timedelta(days=250)),
            "expiryTime": iso_time(now + timedelta(days=180)),
            "expiry_time": iso_time(now + timedelta(days=180)),
        },
        # SP-004 Active OAuth Grant 2 (active despite SP being disabled)
        {
            "id": _make_uuid("grant-sp-004-active-2"),
            "clientId": sp_004_client_id,
            "client_id": sp_004_client_id,
            "consentType": "Principal",
            "consent_type": "Principal",
            "principalId": user_dave_id,
            "principal_id": user_dave_id,
            "resourceId": graph_resource_id,
            "resource_id": graph_resource_id,
            "scope": "User.Read",
            "startTime": iso_time(now - timedelta(days=200)),
            "start_time": iso_time(now - timedelta(days=200)),
            "expiryTime": iso_time(now + timedelta(days=180)),
            "expiry_time": iso_time(now + timedelta(days=180)),
        },
    ]

    return {
        "service_principals": service_principals,
        "app_registrations": app_registrations,
        "managed_identities": managed_identities,
        "oauth_grants": oauth_grants,
    }

