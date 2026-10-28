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
        second: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  const getScoreColorClass = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return 'text-[#EF4444]';
      case 'high':
        return 'text-[#F59E0B]';
      case 'medium':
        return 'text-[#EAB308]';
      case 'low':
        return 'text-[#22C55E]';
      default:
        return 'text-[#64748B]';
    }
  };

  // --------------------------------------------------------------------------
  // LOADING STATE (Skeleton ScoreCards + Skeleton Table)
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#334155] gap-3">
          <div className="space-y-2">
            <Skeleton width="180px" height="2rem" />
            <Skeleton width="240px" height="1rem" />
          </div>
          <Skeleton width="220px" height="2.25rem" rounded="lg" />
        </div>

        {/* 4 Skeleton ScoreCards: 2-column mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#1E293B] border border-[#334155] rounded-xl p-3.5 sm:p-5 space-y-3">
              <Skeleton width="60%" height="0.75rem" />
              <Skeleton width="40%" height="1.75rem" />
              <Skeleton width="80%" height="0.75rem" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 sm:p-6 space-y-4">
          <Skeleton width="160px" height="1.25rem" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height="1.25rem" rounded="full" />
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 sm:p-6 space-y-4">
          <Skeleton width="200px" height="1.25rem" />
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height="2.5rem" rounded="md" />
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
  // EMPTY STATE (If no audit run)
  // --------------------------------------------------------------------------
  const isNoAudit =
    auditStatus?.status === 'no_audit_run' ||
    (!auditStatus?.summary && identities.length === 0);

  if (isNoAudit) {
    return (
      <EmptyState
        title="No audit data yet"
        message="Run your first audit to see results"
        action={{
          label: actionRunning ? 'Running First Audit...' : 'Run Audit',
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

  // Risk summary counts for breakdown chart
  const summaryCounts = {
    critical: criticalCount,
    high: highCount,
    medium: mediumCount,
    low: lowCount,
    none: noneCount,
  };

  // Top 5 riskiest identities sorted descending by score
  const topRiskiest = [...identities]
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F1F5F9] tracking-tight">Dashboard</h1>
          <p className="text-xs text-[#64748B] mt-1 font-mono">
            Last audit: {formatTimestamp(auditStatus?.timestamp)}
          </p>
        </div>
        {exportControls ?? <ExportControls disabled={isNoAudit} />}
      </div>

      {/* 2. FOUR SCORE CARDS: 2-column mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <ScoreCard
          label="Total Identities"
          value={totalIdentities}
          accent="blue"
          sublabel="Service Principals & Managed IDs"
        />
        <ScoreCard
          label="Critical Risks"
          value={criticalCount}
          accent="critical"
          sublabel="Immediate credential or grant risk"
        />
        <ScoreCard
          label="High Risks"
          value={highCount}
          accent="high"
          sublabel="Requires urgent remediation"
        />
        <ScoreCard
          label="Unverified Publishers"
          value={unverifiedPublishersCount}
          accent="high"
          sublabel="Apps with unverified publishers"
        />
      </div>

      {/* 3. RISK DISTRIBUTION (Horizontal Bar Chart Component) */}
      <RiskBreakdownChart summary={summaryCounts} total={totalIdentities} />

      {/* 4. TOP 5 RISKIEST IDENTITIES (Table) */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-[#F1F5F9]">
              Top 5 Riskiest Identities
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Prioritized by aggregate calculated risk score
            </p>
          </div>
          <Link
            to="/identities"
            className="text-xs font-semibold text-[#3B82F6] hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            View all identities &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto border border-[#334155] rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0F172A] text-[#64748B] text-xs uppercase tracking-wider font-semibold border-b border-[#334155]">
              <tr>
                <th className="py-3 px-3 sm:px-4 w-12 sm:w-16">Rank</th>
                <th className="py-3 px-3 sm:px-4">Name</th>
                <th className="py-3 px-3 sm:px-4">Type</th>
                <th className="py-3 px-3 sm:px-4 text-center">Risk Level</th>
                <th className="py-3 px-3 sm:px-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155] text-[#F1F5F9]">
              {topRiskiest.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#64748B] text-xs">
                    No identities found.
                  </td>
                </tr>
              ) : (
                topRiskiest.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer hover:bg-[#0F172A]/70 transition-colors duration-100"
                  >
                    {/* Rank */}
                    <td className="py-3 px-3 sm:px-4 font-mono text-xs text-[#64748B]">
                      #{idx + 1}
                    </td>

                    {/* Name (links to /identities/:id) */}
                    <td className="py-3 px-3 sm:px-4 font-medium">
                      <Link
                        to={`/identities/${item.id}`}
                        className="text-[#38BDF8] hover:underline text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      >
                        {item.display_name || item.name}
                      </Link>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <span className="text-xs text-[#94A3B8] bg-[#0F172A] px-2 py-0.5 rounded border border-[#334155]">
                        {item.identity_type}
                      </span>
                    </td>

                    {/* Risk Level Badge */}
                    <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                      <RiskBadge level={item.risk_level} />
                    </td>

                    {/* Score (bold, colored by level) */}
                    <td className="py-3 px-3 sm:px-4 text-right font-mono font-bold whitespace-nowrap">
                      <span className={`text-xs sm:text-sm ${getScoreColorClass(item.risk_level)}`}>
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
