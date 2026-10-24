import { useState, useEffect } from 'react';
import { getDashboardStats, getIdentities, getFindings, getIdentityById } from '../services/api';
import { DashboardStatsResponse, NonHumanIdentity, Finding } from '../types';

export function useDashboardStats() {
  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to fetch dashboard metrics'))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useIdentities() {
  const [identities, setIdentities] = useState<NonHumanIdentity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getIdentities()
      .then(setIdentities)
      .catch((err) => setError(err.message || 'Failed to fetch identities'))
      .finally(() => setLoading(false));
  }, []);

  return { identities, loading, error };
}

export function useIdentity(id?: string) {
  const [identity, setIdentity] = useState<NonHumanIdentity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getIdentityById(id)
      .then(setIdentity)
      .catch((err) => setError(err.message || 'Failed to fetch identity details'))
      .finally(() => setLoading(false));
  }, [id]);

  return { identity, loading, error };
}

export function useFindings() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFindings()
      .then(setFindings)
      .catch((err) => setError(err.message || 'Failed to fetch findings'))
      .finally(() => setLoading(false));
  }, []);

  return { findings, loading, error };
}

