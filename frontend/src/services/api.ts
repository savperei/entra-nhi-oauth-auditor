import axios from 'axios';
import {
  AuditStatusResponse,
  AuditSummary,
  DashboardStatsResponse,
  Finding,
  FindingFilters,
  IdentityDetail,
  IdentityFilters,
  IdentitySummary,
  Permission,
} from '../types';

const BASE_URL =
  ((import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ||
  'http://localhost:8000/api/v1';

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

export interface GetIdentitiesParams {
  type?: string;
  risk_level?: string;
  search?: string;
}

export const getIdentities = async (params?: GetIdentitiesParams) => {
  const response = await apiClient.get('/identities', { params });
  return response.data;
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

export const runAudit = async () => {
  const response = await apiClient.post('/audit/run');
  return response.data;
};

export default apiClient;
