"""Synthetic dummy data for Entra Non-Human Identity & OAuth Auditing.
No real Microsoft Entra ID tenants or live credentials are used.
"""

from typing import List, Dict, Any

SYNTHETIC_IDENTITIES: List[Dict[str, Any]] = [
    {
        "id": "sp-001-backup-automation",
        "app_id": "a1b2c3d4-0001-4000-8000-000000000001",
        "name": "Cloud Backup Automation Engine",
        "identity_type": "ServicePrincipal",
        "owner": "devops-team@synthetic.local",
        "created_date": "2023-01-15T08:30:00Z",
        "last_sign_in": "2024-03-20T14:15:00Z",
        "is_active": True,
        "risk_level": "CRITICAL",
        "credentials": [
            {
                "type": "ClientSecret",
                "key_id": "key-sec-01",
                "created_date": "2023-01-15T08:30:00Z",
                "expires_date": "2026-01-15T08:30:00Z",
                "is_expired": False,
                "days_until_expiry": 630,
            }
        ],
        "oauth_permissions": [
            {
                "resource": "Microsoft Graph",
                "permission": "Directory.ReadWrite.All",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": True,
            },
            {
                "resource": "Microsoft Graph",
                "permission": "RoleManagement.ReadWrite.Directory",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": True,
            }
        ],
        "findings_count": 2,
    },
    {
        "id": "sp-002-reporting-bot",
        "app_id": "a1b2c3d4-0002-4000-8000-000000000002",
        "name": "Executive Email Digest Bot",
        "identity_type": "ServicePrincipal",
        "owner": "marketing-it@synthetic.local",
        "created_date": "2023-05-10T10:00:00Z",
        "last_sign_in": "2024-03-21T06:00:00Z",
        "is_active": True,
        "risk_level": "HIGH",
        "credentials": [
            {
                "type": "ClientSecret",
                "key_id": "key-sec-02",
                "created_date": "2023-05-10T10:00:00Z",
                "expires_date": "2024-04-01T10:00:00Z",
                "is_expired": False,
                "days_until_expiry": 11,
            }
        ],
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
                "permission": "Mail.Send",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": True,
            }
        ],
        "findings_count": 2,
    },
    {
        "id": "mi-003-data-pipeline",
        "app_id": "a1b2c3d4-0003-4000-8000-000000000003",
        "name": "Azure Data Factory Ingestion MI",
        "identity_type": "ManagedIdentity",
        "owner": "data-platform@synthetic.local",
        "created_date": "2023-09-01T12:00:00Z",
        "last_sign_in": "2024-03-22T09:45:00Z",
        "is_active": True,
        "risk_level": "LOW",
        "credentials": [
            {
                "type": "ManagedServiceIdentityToken",
                "key_id": "auto-rotated-msi",
                "created_date": "2023-09-01T12:00:00Z",
                "expires_date": "Managed by Azure",
                "is_expired": False,
                "days_until_expiry": 9999,
            }
        ],
        "oauth_permissions": [
            {
                "resource": "Azure Storage",
                "permission": "Storage.Blob.DataContributor",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": False,
            }
        ],
        "findings_count": 0,
    },
    {
        "id": "sp-004-legacy-crm-sync",
        "app_id": "a1b2c3d4-0004-4000-8000-000000000004",
        "name": "Legacy CRM Contact Synchronizer",
        "identity_type": "ServicePrincipal",
        "owner": "unassigned",
        "created_date": "2021-04-18T11:20:00Z",
        "last_sign_in": "2023-08-10T16:00:00Z",
        "is_active": False,
        "risk_level": "HIGH",
        "credentials": [
            {
                "type": "Certificate",
                "key_id": "cert-thumb-99",
                "created_date": "2021-04-18T11:20:00Z",
                "expires_date": "2024-01-01T00:00:00Z",
                "is_expired": True,
                "days_until_expiry": -80,
            }
        ],
        "oauth_permissions": [
            {
                "resource": "Microsoft Graph",
                "permission": "User.ReadWrite.All",
                "type": "Application",
                "admin_consent": True,
                "is_high_privilege": True,
            },
            {
                "resource": "Microsoft Graph",
                "permission": "Contacts.ReadWrite",
                "type": "Delegated",
                "admin_consent": False,
                "is_high_privilege": False,
            }
        ],
        "findings_count": 3,
    },
    {
        "id": "app-005-developer-portal-sso",
        "app_id": "a1b2c3d4-0005-4000-8000-000000000005",
        "name": "Internal Developer Portal SSO",
        "identity_type": "AppRegistration",
        "owner": "developer-experience@synthetic.local",
        "created_date": "2022-11-05T14:10:00Z",
        "last_sign_in": "2024-03-22T08:00:00Z",
        "is_active": True,
        "risk_level": "MEDIUM",
        "credentials": [
            {
                "type": "ClientSecret",
                "key_id": "key-sec-05",
                "created_date": "2023-11-05T14:10:00Z",
                "expires_date": "2025-11-05T14:10:00Z",
                "is_expired": False,
                "days_until_expiry": 590,
            }
        ],
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
            }
        ],
        "findings_count": 1,
    }
]

SYNTHETIC_FINDINGS: List[Dict[str, Any]] = [
    {
        "id": "FINDING-101",
        "identity_id": "sp-001-backup-automation",
        "identity_name": "Cloud Backup Automation Engine",
        "rule_id": "RULE-001",
        "severity": "CRITICAL",
        "title": "Tenant-Wide Directory Modification Grants",
        "description": "Application permission 'Directory.ReadWrite.All' and 'RoleManagement.ReadWrite.Directory' granted without scoping.",
        "remediation": "Replace full directory write permissions with targeted workload application roles.",
        "detected_at": "2024-03-22T04:00:00Z",
    },
    {
        "id": "FINDING-102",
        "identity_id": "sp-002-reporting-bot",
        "identity_name": "Executive Email Digest Bot",
        "rule_id": "RULE-004",
        "severity": "CRITICAL",
        "title": "Mailbox Access Over-Privilege",
        "description": "Identity has 'Mail.ReadWrite' application permission allowing access to all tenant mailboxes.",
        "remediation": "Configure Exchange Application Access Policy to restrict access to the digest mailbox only.",
        "detected_at": "2024-03-22T04:00:00Z",
    },
    {
        "id": "FINDING-103",
        "identity_id": "sp-002-reporting-bot",
        "identity_name": "Executive Email Digest Bot",
        "rule_id": "RULE-002",
        "severity": "HIGH",
        "title": "Client Secret Nearing Expiration",
        "description": "Client secret key-sec-02 expires in less than 14 days.",
        "remediation": "Create and deploy a new secret or transition identity to Azure Key Vault managed secrets.",
        "detected_at": "2024-03-22T04:00:00Z",
    },
    {
        "id": "FINDING-104",
        "identity_id": "sp-004-legacy-crm-sync",
        "identity_name": "Legacy CRM Contact Synchronizer",
        "rule_id": "RULE-003",
        "severity": "HIGH",
        "title": "Stale Inactive Identity with High Privileges",
        "description": "Service principal has not authenticated for >200 days but retains high privileges.",
        "remediation": "Disable account and revoke OAuth consent grants.",
        "detected_at": "2024-03-22T04:00:00Z",
    },
    {
        "id": "FINDING-105",
        "identity_id": "sp-004-legacy-crm-sync",
        "identity_name": "Legacy CRM Contact Synchronizer",
        "rule_id": "RULE-005",
        "severity": "LOW",
        "title": "Orphaned Identity Without Owner",
        "description": "No active owner assigned to this application registration.",
        "remediation": "Assign at least one technical owner or decommission identity.",
        "detected_at": "2024-03-22T04:00:00Z",
    },
    {
        "id": "FINDING-106",
        "identity_id": "app-005-developer-portal-sso",
        "identity_name": "Internal Developer Portal SSO",
        "rule_id": "RULE-002",
        "severity": "MEDIUM",
        "title": "Long-lived Secret Lifetime (>1 year)",
        "description": "Client secret configured with lifetime exceeding organizational 1-year threshold.",
        "remediation": "Set maximum secret duration to 180 or 365 days in accordance with governance policy.",
        "detected_at": "2024-03-22T04:00:00Z",
    }
]

