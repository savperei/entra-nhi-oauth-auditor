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
        "is_enabled": True,
        "risk_level": "CRITICAL",
        "risk_score": 95,
        "publisher": "Internal Automation",
        "publisher_name": "Internal Automation",
        "publisher_verified": False,
        "is_publisher_verified": False,
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
        "oauth_grants": [
            {
                "grant_id": "grant-001",
                "consent_type": "AllPrincipals",
                "scope": "Directory.ReadWrite.All RoleManagement.ReadWrite.Directory",
                "resource_id": "00000003-0000-0000-c000-000000000000",
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
        "is_enabled": True,
        "risk_level": "HIGH",
        "risk_score": 82,
        "publisher": "Corporate Analytics",
        "publisher_name": "Corporate Analytics",
        "publisher_verified": False,
        "is_publisher_verified": False,
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
        "oauth_grants": [
            {
                "grant_id": "grant-002",
                "consent_type": "AllPrincipals",
                "scope": "Mail.ReadWrite Mail.Send",
                "resource_id": "00000003-0000-0000-c000-000000000000",
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
        "is_enabled": True,
        "risk_level": "LOW",
        "risk_score": 20,
        "publisher": "Microsoft",
        "publisher_name": "Microsoft Corporation",
        "publisher_verified": True,
        "is_publisher_verified": True,
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
        "oauth_grants": [
            {
                "grant_id": "grant-003",
                "consent_type": "AllPrincipals",
                "scope": "Storage.Blob.DataContributor",
                "resource_id": "e406a681-f3d4-42a8-90b6-c2625d4bd1da",
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
        "is_enabled": False,
        "risk_level": "HIGH",
        "risk_score": 88,
        "publisher": "Legacy CRM Vendor",
        "publisher_name": "Legacy CRM Vendor",
        "publisher_verified": False,
        "is_publisher_verified": False,
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
        "oauth_grants": [
            {
                "grant_id": "grant-004",
                "consent_type": "AllPrincipals",
                "scope": "User.ReadWrite.All",
                "resource_id": "00000003-0000-0000-c000-000000000000",
            },
            {
                "grant_id": "grant-005",
                "consent_type": "Principal",
                "scope": "Contacts.ReadWrite",
                "resource_id": "00000003-0000-0000-c000-000000000000",
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
        "is_enabled": True,
        "risk_level": "MEDIUM",
        "risk_score": 55,
        "publisher": "Developer Experience",
        "publisher_name": "Developer Experience",
        "publisher_verified": True,
        "is_publisher_verified": True,
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
        "oauth_grants": [
            {
                "grant_id": "grant-006",
                "consent_type": "Principal",
                "scope": "User.Read",
                "resource_id": "00000003-0000-0000-c000-000000000000",
            },
            {
                "grant_id": "grant-007",
                "consent_type": "AllPrincipals",
                "scope": "GroupMember.Read.All",
                "resource_id": "00000003-0000-0000-c000-000000000000",
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
        "description": "Identity has been granted Directory.ReadWrite.All application permission with tenant-wide administrative scope.",
        "remediation": "Restrict directory read-write scopes. Grant least privilege specific app roles or scoped application permissions.",
        "detected_at": "2024-03-22T10:00:00Z",
    },
    {
        "id": "FINDING-102",
        "identity_id": "sp-001-backup-automation",
        "identity_name": "Cloud Backup Automation Engine",
        "rule_id": "RULE-002",
        "severity": "CRITICAL",
        "title": "Directory Role Management Privileges",
        "description": "RoleManagement.ReadWrite.Directory allows elevating arbitrary credentials to Global Administrator.",
        "remediation": "Revoke RoleManagement write permissions from automated service principals.",
        "detected_at": "2024-03-22T10:00:00Z",
    },
    {
        "id": "FINDING-103",
        "identity_id": "sp-002-reporting-bot",
        "identity_name": "Executive Email Digest Bot",
        "rule_id": "RULE-003",
        "severity": "HIGH",
        "title": "Secret Key Expiring in Less Than 14 Days",
        "description": "Client secret key-sec-02 expires on 2024-04-01 (11 days remaining). Outage risk imminent.",
        "remediation": "Rotate and provision new client secret before 2024-04-01 and update secure vault store.",
        "detected_at": "2024-03-22T10:00:00Z",
    },
    {
        "id": "FINDING-104",
        "identity_id": "sp-002-reporting-bot",
        "identity_name": "Executive Email Digest Bot",
        "rule_id": "RULE-004",
        "severity": "HIGH",
        "title": "Tenant-Wide Mailbox Modification Scope",
        "description": "Service principal holds Mail.ReadWrite without ApplicationAccessPolicy mailbox restrictions.",
        "remediation": "Apply Exchange Online ApplicationAccessPolicy to restrict bot access strictly to dedicated reporting mailboxes.",
        "detected_at": "2024-03-22T10:00:00Z",
    },
    {
        "id": "FINDING-105",
        "identity_id": "sp-004-legacy-crm-sync",
        "identity_name": "Legacy CRM Contact Synchronizer",
        "rule_id": "RULE-005",
        "severity": "HIGH",
        "title": "Expired Authentication Certificate Present",
        "description": "Certificate cert-thumb-99 expired 80 days ago without formal cleanup.",
        "remediation": "Delete expired certificate thumbprints from the Entra ID service principal keyCredentials list.",
        "detected_at": "2024-03-22T10:00:00Z",
    },
    {
        "id": "FINDING-106",
        "identity_id": "sp-004-legacy-crm-sync",
        "identity_name": "Legacy CRM Contact Synchronizer",
        "rule_id": "RULE-006",
        "severity": "HIGH",
        "title": "Dormant High-Privilege Account",
        "description": "Service principal has not performed authentication for over 220 days.",
        "remediation": "Disable or de-provision inactive service principals exceeding 90 days dormancy.",
        "detected_at": "2024-03-22T10:00:00Z",
    },
    {
        "id": "FINDING-107",
        "identity_id": "sp-004-legacy-crm-sync",
        "identity_name": "Legacy CRM Contact Synchronizer",
        "rule_id": "RULE-007",
        "severity": "MEDIUM",
        "title": "Unassigned Identity Ownership",
        "description": "The service principal has no valid owner recorded in directory metadata.",
        "remediation": "Assign at least two designated service owners for regular lifecycle attestation.",
        "detected_at": "2024-03-22T10:00:00Z",
    },
    {
        "id": "FINDING-108",
        "identity_id": "app-005-developer-portal-sso",
        "identity_name": "Internal Developer Portal SSO",
        "rule_id": "RULE-008",
        "severity": "MEDIUM",
        "title": "Excessive Group Enumeration Scope",
        "description": "Delegated GroupMember.Read.All consented without scoped filtering.",
        "remediation": "Verify if Group.Read.All is necessary or migrate to user-context GroupMember.Read.",
        "detected_at": "2024-03-22T10:00:00Z",
    }
]
