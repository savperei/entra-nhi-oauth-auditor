import { useState, useEffect, useCallback } from 'react';
import { runAudit as apiRunAudit, getAuditStatus as apiGetAuditStatus } from '../services/api';
import { AuditStatusResponse, AuditSummary } from '../types';

export interface UseAuditReturn {
  result: AuditSummary | AuditStatusResponse | null;
  isLoading: boolean;
  error: string | null;
  runAudit: () => Promise<AuditSummary | null>;
}

/**
 * Hook to manage audit execution state and telemetry.
 * Automatically fetches the last audit status on mount.
 */
export function useAudit(): UseAuditReturn {
  const [result, setResult] = useState<AuditSummary | AuditStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch audit status on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    apiGetAuditStatus()
      .then((statusData) => {
        if (!isMounted) return;
        if (statusData.status === 'completed' && statusData.summary) {
          setResult(statusData);
        } else {
          // If no audit has been run yet, run an initial audit so app has immediate data
          return apiRunAudit().then((freshData) => {
            if (isMounted) setResult(freshData);
          });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.detail || err.message || 'Failed to fetch audit status');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Callable function to manually trigger a fresh audit
  const runAudit = useCallback(async (): Promise<AuditSummary | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const freshData = await apiRunAudit();
      setResult(freshData);
      return freshData;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to execute audit';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    result,
    isLoading,
    error,
    runAudit,
  };
}

export default useAudit;

