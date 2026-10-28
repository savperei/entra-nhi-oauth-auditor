export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface CredentialInfo {
  type: string;
  key_id: string;
  created_date: string;
  expires_date: string;
  is_expired: boolean;
  days_until_expiry: number;
}

export interface OAuthPermission {
  resource: string;
  permission: string;
  type: 'Application' | 'Delegated';
  admin_consent: boolean;
  is_high_privilege: boolean;
}

export interface NonHumanIdentity {
  id: string;
  app_id: string;
  name: string;
  identity_type: 'ServicePrincipal' | 'ManagedIdentity' | 'AppRegistration';
  owner: string;
  created_date: string;
  last_sign_in: string;
  is_active: boolean;
  risk_level: RiskLevel;
  credentials: CredentialInfo[];
  oauth_permissions: OAuthPermission[];
  findings_count: number;
  risk_score?: number;
  score?: number;
  publisher?: string | { name: string; is_verified?: boolean; verified?: boolean };
  publisher_verified?: boolean;
  is_publisher_verified?: boolean;
}

export interface Finding {
  id: string;
  identity_id: string;
  identity_name: string;
  rule_id: string;
  severity: RiskLevel;
  title: string;
  description: string;
  remediation: string;
  detected_at: string;
}

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

