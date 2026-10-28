import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getIdentities, getAuditStatus, runAudit } from '../services/api';
import { IdentitySummary, AuditStatusResponse } from '../types';
import { ScoreCard } from '../components/ScoreCard';
import { RiskBadge } from '../components/RiskBadge';
import { ExportControls } from '../components/ExportControls';

export interface DashboardProps {
  exportControls?: React.ReactNode;
}

export const Dashboard: React.FC<DashboardProps> = ({ exportControls }) => {
  const [identities, setIdentities] = useState<IdentitySummary[]>([]);
  const [auditStatus, setAuditStatus] = useState<AuditStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionRunning, setActionRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [animateChart, setAnimateChart] = useState<boolean>(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnimateChart(false);
    try {
      const [statusRes, identsRes] = await Promise.all([
        getAuditStatus().catch(() => ({ status: 'no_audit_run' } as AuditStatusResponse)),
        getIdentities().catch(() => [] as IdentitySummary[]),
      ]);

      setAuditStatus(statusRes);
      setIdentities(identsRes);

      // Trigger 600ms CSS animation for distribution bars
      setTimeout(() => {
        setAnimateChart(true);
      }, 50);
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
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
          <div className="space-y-2">
            <div className="h-8 w-44 bg-[#1E293B] rounded"></div>
            <div className="h-4 w-60 bg-[#1E293B] rounded"></div>
          </div>
          <div className="h-9 w-48 bg-[#1E293B] rounded"></div>
        </div>

        {/* 4 Skeleton ScoreCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 space-y-3">
              <div className="h-3 w-28 bg-[#334155] rounded"></div>
              <div className="h-9 w-16 bg-[#334155] rounded"></div>
              <div className="h-3 w-36 bg-[#334155] rounded"></div>
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 space-y-4">
          <div className="h-5 w-48 bg-[#334155] rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-[#0F172A] rounded"></div>
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 space-y-4">
          <div className="h-5 w-56 bg-[#334155] rounded"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-[#0F172A] rounded"></div>
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
      <div className="p-6 bg-[#1E293B] border border-[#EF4444]/40 rounded-xl shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center shrink-0 text-[#EF4444]">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#EF4444]">Failed to load dashboard.</h2>
            <p className="text-sm text-[#F1F5F9] mt-1">{error}</p>
            <button
              onClick={loadDashboardData}
              className="mt-4 px-4 py-2 bg-[#EF4444] hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              Retry
            </button>
          </div>
        </div>
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
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center mx-auto text-[#3B82F6] mb-5">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#F1F5F9]">No audit data yet</h2>
          <p className="text-sm text-[#64748B] mt-2 mb-6">
            Run your first audit to see results
          </p>
          <button
            onClick={handleRunFirstAudit}
            disabled={actionRunning}
            className="w-full py-2.5 px-4 bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm"
          >
            {actionRunning ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Running First Audit...</span>
              </>
            ) : (
              <span>Run Audit</span>
            )}
          </button>
        </div>
      </div>
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

  // Distribution chart rows
  const totalForPct = totalIdentities > 0 ? totalIdentities : 1;
  const distributionData = [
    {
      level: 'Critical',
      count: criticalCount,
      color: '#EF4444',
      bgClass: 'bg-[#EF4444]',
    },
    {
      level: 'High',
      count: highCount,
      color: '#F59E0B',
      bgClass: 'bg-[#F59E0B]',
    },
    {
      level: 'Medium',
      count: mediumCount,
      color: '#EAB308',
      bgClass: 'bg-[#EAB308]',
    },
    {
      level: 'Low',
      count: lowCount,
      color: '#22C55E',
      bgClass: 'bg-[#22C55E]',
    },
    {
      level: 'None',
      count: noneCount,
      color: '#64748B',
      bgClass: 'bg-[#64748B]',
    },
  ];

  // Top 5 riskiest identities sorted descending by score
  const topRiskiest = [...identities]
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9] tracking-tight">Dashboard</h1>
          <p className="text-xs text-[#64748B] mt-1 font-mono">
            Last audit: {formatTimestamp(auditStatus?.timestamp)}
          </p>
        </div>
        {exportControls ?? <ExportControls disabled={isNoAudit} />}
      </div>

      {/* 2. FOUR SCORE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <ScoreCard
          label="Total Identities"
          value={totalIdentities}
          accent="blue"
          sublabel="Service Principals & Managed Identities"
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
          sublabel="Apps with unverified identity publishers"
        />
      </div>

      {/* 3. RISK DISTRIBUTION (Horizontal Bar Chart, Pure CSS) */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-[#F1F5F9]">Risk Distribution</h2>
          <span className="text-xs text-[#64748B] font-mono">
            Total Analyzed: {totalIdentities}
          </span>
        </div>

        <div className="space-y-4">
          {distributionData.map((row) => {
            const pct = Math.round((row.count / totalForPct) * 100);
            return (
              <div key={row.level} className="flex items-center gap-4 text-xs">
                {/* [Badge] */}
                <div className="w-24 shrink-0">
                  <RiskBadge level={row.level} />
                </div>

                {/* [Bar] Animated from 0 to final width in 600ms */}
                <div className="flex-1 h-3 bg-[#0F172A] rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full ${row.bgClass}`}
                    style={{
                      width: animateChart ? `${pct}%` : '0%',
                      transition: 'width 600ms ease-out',
                    }}
                  />
                </div>

                {/* [Count] */}
                <div className="w-12 text-right font-mono font-bold text-[#F1F5F9]">
                  {row.count}
                </div>

                {/* [%] */}
                <div className="w-12 text-right font-mono text-[#64748B]">
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. TOP 5 RISKIEST IDENTITIES (Table) */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#F1F5F9]">
              Top 5 Riskiest Identities
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Prioritized by aggregate calculated risk score
            </p>
          </div>
          <Link
            to="/identities"
            className="text-xs font-semibold text-[#3B82F6] hover:text-blue-400 transition-colors"
          >
            View all identities &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto border border-[#334155] rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0F172A] text-[#64748B] text-xs uppercase tracking-wider font-semibold border-b border-[#334155]">
              <tr>
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Risk Level</th>
                <th className="py-3 px-4 text-right">Score</th>
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
                    className="hover:bg-[#0F172A]/40 transition-colors duration-100"
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 font-mono text-xs text-[#64748B]">
                      #{idx + 1}
                    </td>

                    {/* Name (links to /identities/:id) */}
                    <td className="py-3 px-4 font-medium">
                      <Link
                        to={`/identities/${item.id}`}
                        className="text-[#3B82F6] hover:underline"
                      >
                        {item.display_name || item.name}
                      </Link>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className="text-xs text-[#94A3B8] bg-[#0F172A] px-2 py-0.5 rounded border border-[#334155]">
                        {item.identity_type}
                      </span>
                    </td>

                    {/* Risk Level Badge */}
                    <td className="py-3 px-4 text-center">
                      <RiskBadge level={item.risk_level} />
                    </td>

                    {/* Score (bold, colored by level) */}
                    <td className="py-3 px-4 text-right font-mono font-bold">
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

