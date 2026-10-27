/**
 * Type definitions matching Microsoft Entra NHI & OAuth Auditor backend models.
 */

export type RiskLevel =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low'
  | 'None'
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'NONE';

export interface AuditSummaryCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  none: number;
}

export interface AuditSummary {
  run_id: string;
  timestamp: string;
  total_identities: number;
  summary: AuditSummaryCounts;
}

export interface AuditStatusResponse {
  status: 'completed' | 'no_audit_run' | string;
  run_id?: string;
  timestamp?: string;
  total_identities?: number;
  summary?: AuditSummaryCounts;
}

export interface CredentialInfo {
  credential_id?: string;
  key_id?: string;
  type: 'secret' | 'certificate' | string;
  display_name?: string | null;
  displayName?: string | null;
  created?: string | null;
  created_date?: string | null;
  expires?: string | null;
  expires_date?: string | null;
  days_until_expiry?: number | null;
  is_expired?: boolean;
}

export interface Permission {
  scope_or_role: string;
  permission_type: 'Application' | 'Delegated' | string;
  resource_display_name?: string | null;
  is_high_risk: boolean;
}

export interface OAuthGrant {
  grant_id: string;
  consent_type: string; // 'AllPrincipals' | 'Principal'
  scope: string;
  resource_id: string;
}

export interface Finding {
  id?: string;
  rule_id: string;
  rule_name?: string;
  title?: string;
  severity: RiskLevel | string;
  evidence_text?: string;
  description?: string;
  remediation: string;
  identity_id?: string;
  identity_name?: string;
  detected_at?: string;
}

export interface IdentitySummary {
  id: string;
  display_name: string;
  name?: string; // backwards compatibility alias
  app_id?: string; // backwards compatibility alias
  identity_type: 'ServicePrincipal' | 'AppRegistration' | 'ManagedIdentity' | string;
  publisher_name?: string | null;
  is_publisher_verified: boolean;
  is_enabled?: boolean;
  risk_level: RiskLevel | string;
  risk_score: number;
  credential_count: number;
  high_risk_permission_count: number;
  owner?: string; // backwards compatibility alias
}

export interface IdentityDetail extends IdentitySummary {
  created_at?: string | null;
  credentials: CredentialInfo[];
  permissions: Permission[];
  oauth_permissions?: OAuthPermission[]; // backwards compatibility alias
  oauth_grants: OAuthGrant[];
  findings: Finding[];
  remediation: string[];
  remediations?: string[];
}

export interface IdentityFilters {
  type?: string;
  risk_level?: string;
  search?: string;
}

export interface FindingFilters {
  severity?: string;
  rule_id?: string;
}

// Backwards compatibility types for existing pages
export interface OAuthPermission {
  resource: string;
  permission: string;
  type: 'Application' | 'Delegated';
  admin_consent: boolean;
  is_high_privilege: boolean;
}

export type NonHumanIdentity = IdentitySummary & {
  credentials?: CredentialInfo[];
  oauth_permissions?: OAuthPermission[];
  findings_count?: number;
  last_sign_in?: string;
  is_active?: boolean;
};

export interface DashboardMetrics {
  total_identities: number;
  total_findings: number;
  critical_risk_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

export interface DashboardStatsResponse {
  metrics: DashboardMetrics;
  environment: string;
  total_rules_active: number;
}
