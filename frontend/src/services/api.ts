import axios from 'axios';
import {
  AuditStatusResponse,
  AuditSummary,
  DashboardStatsResponse,
  Finding,
  FindingFilters,
  IdentityDetail,
  IdentityFilters,
  NonHumanIdentity,
  Permission,
} from '../types';

export type GetIdentitiesParams = IdentityFilters;

const BASE_URL =
  ((import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ||
  'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Triggers a fresh audit pipeline execution.
 * Calls POST /audit/run
 */
export const runAudit = async (): Promise<AuditSummary> => {
  const response = await apiClient.post<AuditSummary>('/audit/run');
  return response.data;
};

/**
 * Retrieves the status and summary of the last audit run.
 * Calls GET /audit/status
 */
export const getAuditStatus = async (): Promise<AuditStatusResponse> => {
  const response = await apiClient.get<AuditStatusResponse>('/audit/status');
  return response.data;
};

/**
 * Lists non-human identities with optional filters (type, risk_level, search).
 * Calls GET /identities
 */
export const getIdentities = async (
  filters?: IdentityFilters
): Promise<NonHumanIdentity[]> => {
  const response = await apiClient.get<any[]>('/identities', {
    params: filters,
  });
  return (response.data || []).map((item: any) => ({
    ...item,
    name: item.display_name || item.name || '',
    app_id: item.id || item.app_id || '',
    owner:
      item.owner ||
      item.publisher_name ||
      (item.is_publisher_verified ? 'Verified Publisher' : 'Unverified Publisher'),
    credentials: item.credentials || [],
    oauth_permissions: item.oauth_permissions || [],
  }));
};

/**
 * Retrieves comprehensive details for a specific identity by ID, App ID, or tag.
 * Calls GET /identities/{id}
 */
export const getIdentity = async (id: string): Promise<NonHumanIdentity & IdentityDetail> => {
  const response = await apiClient.get<any>(`/identities/${id}`);
  const data = response.data;
  return {
    ...data,
    name: data.display_name || data.name || '',
    app_id: data.id || data.app_id || '',
    owner:
      data.owner ||
      data.publisher_name ||
      (data.is_publisher_verified ? 'Verified Publisher' : 'Unverified Publisher'),
    credentials: data.credentials || [],
    oauth_permissions: data.oauth_permissions || (data.permissions || []).map((p: Permission) => ({
      resource: p.resource_display_name || 'Microsoft Graph',
      permission: p.scope_or_role,
      type: (p.permission_type as 'Application' | 'Delegated') || 'Delegated',
      admin_consent: true,
      is_high_privilege: p.is_high_risk,
    })),
    oauth_grants: data.oauth_grants || [],
    permissions: data.permissions || [],
    findings: data.findings || [],
    remediation: data.remediation || [],
  };
};

/**
 * Backwards-compatible alias for getIdentity
 */
export const getIdentityById = getIdentity;

/**
 * Lists audit findings sorted by severity descending, with optional filters.
 * Calls GET /findings
 */
export const getFindings = async (
  filters?: FindingFilters
): Promise<Finding[]> => {
  const response = await apiClient.get<Finding[]>('/findings', {
    params: filters,
  });
  return response.data.map((f: Finding, idx: number) => ({
    ...f,
    id: f.id || `${f.rule_id}-${idx + 1}`,
    title: f.title || f.rule_name || 'Risk Finding',
    description: f.description || f.evidence_text || '',
    evidence_text: f.evidence_text || f.description || '',
    identity_id: f.identity_id || '',
    identity_name: f.identity_name || 'Identity',
  }));
};

/**
 * Health check endpoint indicating synthetic mode operation.
 * Calls GET /health
 */
export const getHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

/**
 * Dashboard stats endpoint.
 * Calls GET /dashboard/stats
 */
export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const response = await apiClient.get<DashboardStatsResponse>('/dashboard/stats');
  return response.data;
};

/**
 * Lists all risk rules loaded from the backend YAML configuration.
 * Calls GET /rules
 */
export const getRules = async (): Promise<{
  id: string;
  name: string;
  severity: string;
  score: number;
  remediation: string;
}[]> => {
  const response = await apiClient.get('/rules');
  return response.data;
};

/**
 * Returns system configuration: mode, thresholds, high-risk permissions.
 * Calls GET /config
 */
export const getConfig = async (): Promise<{
  mode: string;
  version: string;
  rules_file: string;
  last_audit_at: string | null;
  thresholds: { critical: number; high: number; medium: number; low: number; none: number };
  high_risk_permissions: string[];
}> => {
  const response = await apiClient.get('/config');
  return response.data;
};

export default apiClient;
