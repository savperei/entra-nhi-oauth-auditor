import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getIdentities, getAuditStatus, runAudit } from '../services/api';
import { IdentitySummary, AuditStatusResponse } from '../types';
import { ScoreCard } from '../components/ScoreCard';
import { RiskBadge } from '../components/RiskBadge';
import { ExportControls } from '../components/ExportControls';
import { RiskBreakdownChart } from '../components/RiskBreakdownChart';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';

export interface DashboardProps {
  exportControls?: React.ReactNode;
}

export const Dashboard: React.FC<DashboardProps> = ({ exportControls }) => {
  const [identities, setIdentities] = useState<IdentitySummary[]>([]);
  const [auditStatus, setAuditStatus] = useState<AuditStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionRunning, setActionRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, identsRes] = await Promise.all([
        getAuditStatus().catch(() => ({ status: 'no_audit_run' } as AuditStatusResponse)),
        getIdentities().catch(() => [] as IdentitySummary[]),
      ]);

      setAuditStatus(statusRes);
      setIdentities(identsRes);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRunFirstAudit = async () => {
    setActionRunning(true);
    setError(null);
    try {
      await runAudit();
      await loadDashboardData();
    } catch (err: any) {
      setError(err?.message || 'Failed to execute audit run.');
    } finally {
      setActionRunning(false);
    }
  };

  const formatTimestamp = (ts?: string | null): string => {
    if (!ts) return 'Never';
    try {
      const date = new Date(ts);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  const getScoreColorClass = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return 'text-[#DC2626]';
      case 'high':
        return 'text-[#D97706]';
      case 'medium':
        return 'text-[#CA8A04]';
      case 'low':
        return 'text-[#16A34A]';
      default:
        return 'text-[#71717A] dark:text-[#94A3B8]';
    }
  };

  // --------------------------------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E4E4E7] dark:border-[#334155] gap-3">
          <div className="space-y-1">
            <Skeleton width="180px" height="1.75rem" />
            <Skeleton width="220px" height="0.875rem" />
          </div>
          <Skeleton width="160px" height="2rem" rounded="md" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-4 space-y-2">
              <Skeleton width="50%" height="0.75rem" />
              <Skeleton width="30%" height="1.5rem" />
              <Skeleton width="80%" height="0.65rem" />
            </div>
          ))}
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-5 space-y-3">
          <Skeleton width="160px" height="1rem" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height="1rem" rounded="full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------------------------------
  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-8">
        <ErrorMessage
          message={`Failed to load dashboard. ${error}`}
          onRetry={loadDashboardData}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // EMPTY STATE
  // --------------------------------------------------------------------------
  const isNoAudit =
    auditStatus?.status === 'no_audit_run' ||
    (!auditStatus?.summary && identities.length === 0);

  if (isNoAudit) {
    return (
      <EmptyState
        title="No audit data yet"
        message="Run your first scan to discover all non-human identities, evaluate credential health, and flag high-privilege OAuth permissions."
        action={{
          label: actionRunning ? 'Auditing…' : 'Run First Audit',
          onClick: handleRunFirstAudit,
          disabled: actionRunning,
          loading: actionRunning,
        }}
      />
    );
  }

  // --------------------------------------------------------------------------
  // CALCULATIONS & METRICS
  // --------------------------------------------------------------------------
  const totalIdentities = identities.length;

  const criticalCount =
    auditStatus?.summary?.critical ??
    identities.filter((i) => i.risk_level?.toLowerCase() === 'critical').length;

  const highCount =
    auditStatus?.summary?.high ??
    identities.filter((i) => i.risk_level?.toLowerCase() === 'high').length;

  const mediumCount =
    auditStatus?.summary?.medium ??
    identities.filter((i) => i.risk_level?.toLowerCase() === 'medium').length;

  const lowCount =
    auditStatus?.summary?.low ??
    identities.filter((i) => i.risk_level?.toLowerCase() === 'low').length;

  const noneCount =
    auditStatus?.summary?.none ??
    identities.filter(
      (i) =>
        !i.risk_level ||
        i.risk_level.toLowerCase() === 'none' ||
        (i.risk_level.toLowerCase() !== 'critical' &&
          i.risk_level.toLowerCase() !== 'high' &&
          i.risk_level.toLowerCase() !== 'medium' &&
          i.risk_level.toLowerCase() !== 'low')
    ).length;

  const unverifiedPublishersCount = identities.filter(
    (i) => !i.is_publisher_verified
  ).length;

  const summaryCounts = {
    critical: criticalCount,
    high: highCount,
    medium: mediumCount,
    low: lowCount,
    none: noneCount,
  };

  const topRiskiest = [...identities]
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E4E7] dark:border-[#334155]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#F1F5F9]">
            Dashboard
          </h1>
          <p className="text-xs text-[#71717A] dark:text-[#94A3B8] mt-0.5">
            Last audit scan completed {formatTimestamp(auditStatus?.timestamp)}
          </p>
        </div>
        {exportControls ?? <ExportControls disabled={isNoAudit} />}
      </div>

      {/* 2. STAT CARDS WITH EXPLANATORY DEFINITIONS & TOOLTIPS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <ScoreCard
          label="Total identities"
          value={totalIdentities}
          accent="blue"
          sublabel="Apps, services and automation accounts found in this audit."
          tooltip="Total count of all Entra ID service principals, app registrations, and managed identities discovered in this scan."
        />
        <ScoreCard
          label="Critical risks"
          value={criticalCount}
          accent="critical"
          sublabel="Identities scoring 80 or more. Fix these first."
          tooltip="Identities with risk score 80 or higher, typically with expiring credentials and tenant-wide high-risk permissions."
        />
        <ScoreCard
          label="High risks"
          value={highCount}
          accent="high"
          sublabel="Identities scoring 50 to 79. Fix these next."
          tooltip="Identities with score 50 to 79 due to org-wide AllPrincipals consent or unverified publisher integrations."
        />
        <ScoreCard
          label="Unverified publishers"
          value={unverifiedPublishersCount}
          accent="high"
          sublabel="Apps from publishers Microsoft has not verified that still hold permissions."
          tooltip="Third-party applications lacking a verified Microsoft Partner Network ID that hold active permissions in your directory."
        />
      </div>

      {/* 3. RISK DISTRIBUTION WITH CLEAR HEADING */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#F1F5F9]">
            How your {totalIdentities} identities split across risk levels
          </h2>
          <p className="text-xs text-[#71717A] dark:text-[#94A3B8] mt-0.5">
            The assigned risk level comes from each identity's calculated point total.{' '}
            <Link to="/how-it-works" className="text-[#2563EB] hover:underline font-medium">
              How is this calculated?
            </Link>
          </p>
        </div>

        <RiskBreakdownChart summary={summaryCounts} total={totalIdentities} />
      </div>

      {/* 4. TOP 5 RISKIEST IDENTITIES TABLE */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#F1F5F9]">
              Top 5 riskiest identities
            </h2>
            <p className="text-xs text-[#71717A] dark:text-[#94A3B8] mt-0.5">
              Higher is riskier. Click an identity to see which rules added points.{' '}
              <Link to="/how-it-works" className="text-[#2563EB] hover:underline font-medium">
                Learn how scoring works &rarr;
              </Link>
            </p>
          </div>
          <Link
            to="/identities"
            className="text-xs font-medium text-[#2563EB] hover:underline whitespace-nowrap self-start sm:self-auto"
          >
            View all identities &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto border border-[#E4E4E7] dark:border-[#334155] rounded">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F4F5] dark:bg-[#0F172A] text-[#71717A] dark:text-[#94A3B8] text-[11px] font-semibold border-b border-[#E4E4E7] dark:border-[#334155]">
              <tr>
                <th className="py-2.5 px-3 w-12">#</th>
                <th className="py-2.5 px-3">Identity Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] dark:divide-[#334155] text-[#18181B] dark:text-[#F1F5F9]">
              {topRiskiest.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#71717A] dark:text-[#94A3B8]">
                    No identities found.
                  </td>
                </tr>
              ) : (
                topRiskiest.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F4F4F5]/50 dark:hover:bg-[#0F172A]/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#71717A] dark:text-[#94A3B8]">
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      <Link
                        to={`/identities/${item.id}`}
                        className="text-[#2563EB] hover:underline"
                      >
                        {item.display_name || item.name}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-mono text-[#71717A] dark:text-[#94A3B8]">
                        {item.identity_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <RiskBadge level={item.risk_level} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                      <span className={getScoreColorClass(item.risk_level)}>
                        {item.risk_score}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
