import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const getHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await apiClient.get('/dashboard/stats');
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

export const getIdentityById = async (id: string) => {
  const response = await apiClient.get(`/identities/${id}`);
  return response.data;
};

export const getFindings = async () => {
  const response = await apiClient.get('/findings');
  return response.data;
};

export const runAudit = async () => {
  const response = await apiClient.post('/audit/run');
  return response.data;
};

export default apiClient;
