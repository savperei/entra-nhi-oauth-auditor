import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getIdentities, getAuditStatus, runAudit, getConfig } from '../services/api';
import { IdentitySummary, AuditStatusResponse } from '../types';
import { ScoreCard } from '../components/ScoreCard';
import { RiskBadge } from '../components/RiskBadge';
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
  const [appMode, setAppMode] = useState<'synthetic' | 'live'>('synthetic');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionRunning, setActionRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, identsRes, cfgRes] = await Promise.all([
        getAuditStatus().catch(() => ({ status: 'no_audit_run' } as AuditStatusResponse)),
        getIdentities().catch(() => [] as IdentitySummary[]),
        getConfig().catch(() => ({ mode: 'synthetic' })),
      ]);

      setAuditStatus(statusRes);
      setIdentities(identsRes);
      if (cfgRes?.mode) {
        setAppMode(cfgRes.mode === 'live' ? 'live' : 'synthetic');
      }
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
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'text-[#C74444] dark:text-[#E05A5A]';
      case 'high':
        return 'text-[#D77928] dark:text-[#E58B3C]';
      case 'medium':
        return 'text-[#C59A32] dark:text-[#DDB045]';
      case 'low':
        return 'text-[#39856A] dark:text-[#4AA484]';
      default:
        return 'text-[#66736C] dark:text-[#95A69E]';
    }
  };

  // --------------------------------------------------------------------------
  // LOADING SKELETON
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="pb-3 border-b border-[#DCE2DB] dark:border-[#283C35] space-y-1">
          <Skeleton width="220px" height="1.75rem" />
          <Skeleton width="340px" height="0.875rem" />
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-6">
          <Skeleton width="40%" height="1.25rem" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton height="80px" />
            <Skeleton height="80px" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-4 space-y-2">
              <Skeleton width="50%" height="0.75rem" />
              <Skeleton width="35%" height="1.75rem" />
              <Skeleton width="80%" height="0.65rem" />
            </div>
          ))}
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
  // METRICS & CALCULATIONS
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

  // Proportional percentages for stacked bar
  const totalForBar = Math.max(1, totalIdentities);
  const criticalPct = Math.round((criticalCount / totalForBar) * 100);
  const highPct = Math.round((highCount / totalForBar) * 100);
  const mediumPct = Math.round((mediumCount / totalForBar) * 100);
  const lowPct = Math.round((lowCount / totalForBar) * 100);
  const nonePct = Math.max(0, 100 - (criticalPct + highPct + mediumPct + lowPct));

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-12">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION A: PAGE INTRODUCTION                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE2DB] dark:border-[#283C35]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202824] dark:text-[#E8EBE9]">
              Security overview
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wide uppercase bg-[#ECEBE4] dark:bg-[#202F2A] text-[#66736C] dark:text-[#A7C4B5] border border-[#DCE2DB] dark:border-[#2D3E38]">
              {appMode === 'live' ? 'Entra ID Live' : 'Synthetic Benchmark'}
            </span>
          </div>
          <p className="text-xs text-[#66736C] dark:text-[#95A69E] mt-1 leading-relaxed">
            This dashboard summarises identity risk from the latest completed audit across service principals, app registrations, and managed identities.
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#66736C] dark:text-[#95A69E]">
            <span>Last audit completed: <strong className="font-mono text-[#202824] dark:text-[#E8EBE9]">{formatTimestamp(auditStatus?.timestamp)}</strong></span>
            <span>&bull;</span>
            <span>Mode: <strong className="font-mono text-[#202824] dark:text-[#E8EBE9]">{appMode === 'live' ? 'Live Tenant' : 'Synthetic demo data'}</strong></span>
          </div>
        </div>

        {exportControls && <div>{exportControls}</div>}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION B: PRIMARY RISK OVERVIEW (Hero Command Console)              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Side: Major Posture Assessment */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#147D68] animate-pulse" />
              <span className="text-[11px] font-mono tracking-wider uppercase text-[#147D68] dark:text-[#2DD4BF] font-semibold">
                Audit Assessment
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-bold font-mono text-[#202824] dark:text-[#E8EBE9] tracking-tight">
                {totalIdentities}
              </span>
              <span className="text-xs text-[#66736C] dark:text-[#95A69E] leading-tight">
                non-human identities<br />actively assessed
              </span>
            </div>

            <div className="pt-2 border-t border-[#ECEBE4] dark:border-[#20312B] flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C74444]" />
                <span className="font-mono font-bold text-[#C74444] dark:text-[#E05A5A]">{criticalCount}</span>
                <span className="text-[#66736C] dark:text-[#95A69E]">Critical risks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D77928]" />
                <span className="font-mono font-bold text-[#D77928] dark:text-[#E58B3C]">{highCount}</span>
                <span className="text-[#66736C] dark:text-[#95A69E]">High risks</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded font-mono font-medium border bg-[#FDF2F2] dark:bg-[#202F2A] text-[#C74444] dark:text-[#E05A5A] border-[#C74444]/30">
                {criticalCount + highCount > 0 ? 'Action Required' : 'Low Risk Posture'}
              </span>
            </div>
          </div>

          {/* Right Side: Proportional Risk Spectrum Visual */}
          <div className="lg:col-span-7 bg-[#F5F4EF] dark:bg-[#111B18] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9]">
                Directory Risk Spectrum
              </span>
              <span className="text-[10px] font-mono text-[#66736C] dark:text-[#95A69E]">
                Scored by weighted policy rules
              </span>
            </div>

            {/* Segmented Stacked Bar */}
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-[#ECEBE4] dark:bg-[#1E302B] border border-[#DCE2DB] dark:border-[#283C35]">
              {criticalCount > 0 && (
                <div
                  style={{ width: `${criticalPct}%` }}
                  className="bg-[#C74444] h-full transition-all duration-500"
                  title={`Critical: ${criticalCount} (${criticalPct}%)`}
                />
              )}
              {highCount > 0 && (
                <div
                  style={{ width: `${highPct}%` }}
                  className="bg-[#D77928] h-full transition-all duration-500"
                  title={`High: ${highCount} (${highPct}%)`}
                />
              )}
              {mediumCount > 0 && (
                <div
                  style={{ width: `${mediumPct}%` }}
                  className="bg-[#C59A32] h-full transition-all duration-500"
                  title={`Medium: ${mediumCount} (${mediumPct}%)`}
                />
              )}
              {lowCount > 0 && (
                <div
                  style={{ width: `${lowPct}%` }}
                  className="bg-[#39856A] h-full transition-all duration-500"
                  title={`Low: ${lowCount} (${lowPct}%)`}
                />
              )}
              {noneCount > 0 && (
                <div
                  style={{ width: `${nonePct}%` }}
                  className="bg-[#66736C] h-full transition-all duration-500"
                  title={`None: ${noneCount} (${nonePct}%)`}
                />
              )}
            </div>

            {/* Spectrum Legend with Exact Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
              <div className="flex flex-col">
                <span className="text-[#C74444] dark:text-[#E05A5A] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C74444]" /> Critical
                </span>
                <span className="font-mono text-[#202824] dark:text-[#E8EBE9]">{criticalCount} <span className="text-[10px] text-[#66736C]">({criticalPct}%)</span></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#D77928] dark:text-[#E58B3C] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D77928]" /> High
                </span>
                <span className="font-mono text-[#202824] dark:text-[#E8EBE9]">{highCount} <span className="text-[10px] text-[#66736C]">({highPct}%)</span></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#C59A32] dark:text-[#DDB045] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C59A32]" /> Medium
                </span>
                <span className="font-mono text-[#202824] dark:text-[#E8EBE9]">{mediumCount} <span className="text-[10px] text-[#66736C]">({mediumPct}%)</span></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#39856A] dark:text-[#4AA484] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39856A]" /> Low
                </span>
                <span className="font-mono text-[#202824] dark:text-[#E8EBE9]">{lowCount} <span className="text-[10px] text-[#66736C]">({lowPct}%)</span></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#66736C] dark:text-[#95A69E] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#66736C]" /> None
                </span>
                <span className="font-mono text-[#202824] dark:text-[#E8EBE9]">{noneCount} <span className="text-[10px] text-[#66736C]">({nonePct}%)</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION C: STATISTIC SUMMARIES (Differentiated Metric Cards)         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total identities */}
        <ScoreCard
          label="Total identities"
          value={totalIdentities}
          accent="teal"
          sublabel="Apps, services and automation accounts found in this audit."
          tooltip="Total count of all Entra ID service principals, app registrations, and managed identities discovered in this scan."
          className="border-t-3 border-t-[#147D68]"
        />

        {/* Critical risks */}
        <ScoreCard
          label="Critical risks"
          value={criticalCount}
          accent="critical"
          sublabel="Identities scoring 80 or more. Review these first."
          tooltip="Identities with risk score 80 or higher, typically with expiring credentials and tenant-wide high-risk permissions."
          className="border-t-3 border-t-[#C74444]"
        />

        {/* High risks */}
        <ScoreCard
          label="High risks"
          value={highCount}
          accent="high"
          sublabel="Identities scoring 50 to 79. Review these next."
          tooltip="Identities with score 50 to 79 due to org-wide AllPrincipals consent or unverified publisher integrations."
          className="border-t-3 border-t-[#D77928]"
        />

        {/* Unverified publishers */}
        <ScoreCard
          label="Unverified publishers"
          value={unverifiedPublishersCount}
          accent="medium"
          sublabel="Apps from publishers Microsoft has not verified that still hold permissions."
          tooltip="Third-party applications lacking a verified Microsoft Partner Network ID that hold active permissions in your directory."
          className="border-t-3 border-t-[#C59A32]"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION D: RISK DISTRIBUTION ANALYTICAL BREAKDOWN                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-4 pb-3 border-b border-[#ECEBE4] dark:border-[#283C35]">
          <div>
            <h2 className="text-sm font-semibold text-[#202824] dark:text-[#E8EBE9]">
              How your {totalIdentities} identities split across risk levels
            </h2>
            <p className="text-xs text-[#66736C] dark:text-[#95A69E] mt-0.5">
              Each level is determined by the configured scoring thresholds: Critical (&ge;80), High (&ge;50), Medium (&ge;25), Low (&ge;1).{' '}
              <Link to="/how-it-works" className="text-[#147D68] dark:text-[#2DD4BF] hover:underline font-medium">
                How is this calculated?
              </Link>
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#66736C] dark:text-[#95A69E]">
            {totalIdentities} total records
          </span>
        </div>

        <RiskBreakdownChart summary={summaryCounts} total={totalIdentities} />
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION E: TOP FIVE RISKIEST IDENTITIES                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#ECEBE4] dark:border-[#283C35]">
          <div>
            <h2 className="text-sm font-semibold text-[#202824] dark:text-[#E8EBE9]">
              Top 5 riskiest identities
            </h2>
            <p className="text-xs text-[#66736C] dark:text-[#95A69E] mt-0.5">
              Higher scores indicate greater risk. Open an identity to see which rules contributed points.{' '}
              <Link to="/how-it-works" className="text-[#147D68] dark:text-[#2DD4BF] hover:underline font-medium">
                Learn how scoring works &rarr;
              </Link>
            </p>
          </div>
          <Link
            to="/identities"
            className="text-xs font-semibold text-[#147D68] dark:text-[#2DD4BF] hover:underline whitespace-nowrap self-start sm:self-auto flex items-center gap-1"
          >
            <span>View all identities</span> &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto border border-[#DCE2DB] dark:border-[#283C35] rounded-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#ECEBE4] dark:bg-[#111B18] text-[#66736C] dark:text-[#95A69E] text-[11px] font-semibold border-b border-[#DCE2DB] dark:border-[#283C35]">
              <tr>
                <th className="py-2.5 px-3.5 w-12 font-mono">#</th>
                <th className="py-2.5 px-3.5">Identity Name</th>
                <th className="py-2.5 px-3.5">Type</th>
                <th className="py-2.5 px-3.5">Risk Level</th>
                <th className="py-2.5 px-3.5 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEBE4] dark:divide-[#283C35] text-[#202824] dark:text-[#E8EBE9]">
              {topRiskiest.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#66736C] dark:text-[#95A69E]">
                    No identities found. Run an audit to populate records.
                  </td>
                </tr>
              ) : (
                topRiskiest.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#ECEBE4]/50 dark:hover:bg-[#111B18]/60 transition-colors cursor-pointer"
                    onClick={() => {
                      window.location.assign(`/identities/${item.id}`);
                    }}
                  >
                    <td className="py-2.5 px-3.5 font-mono text-[11px] text-[#66736C] dark:text-[#95A69E]">
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-3.5 font-medium">
                      <Link
                        to={`/identities/${item.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#147D68] dark:text-[#2DD4BF] hover:underline font-semibold"
                      >
                        {item.display_name || item.name}
                      </Link>
                      {item.app_id && (
                        <span className="block font-mono text-[10px] text-[#66736C] dark:text-[#95A69E] truncate max-w-[200px] sm:max-w-none">
                          {item.app_id}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="text-[11px] font-mono text-[#66736C] dark:text-[#95A69E]">
                        {item.identity_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <RiskBadge level={item.risk_level} />
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold whitespace-nowrap">
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION F: AUDIT ACTIVITY AND DATA CONTEXT                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#66736C] dark:text-[#A7C4B5]">
              Data Environment &amp; Audit Status
            </h3>
            <p className="text-xs text-[#202824] dark:text-[#E8EBE9]">
              {appMode === 'live' ? (
                <span>Operating against live <strong>Microsoft Entra ID</strong> directory using registered service principal authentication.</span>
              ) : (
                <span>Currently executing on <strong>synthetic benchmark dataset</strong> (15 diverse identities with expiring credentials, unverified publishers, and admin consent grants).</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/setup"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF] dark:bg-[#111B18] text-[#202824] dark:text-[#E8EBE9] hover:bg-[#ECEBE4] dark:hover:bg-[#202F2A] transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-[#66736C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41" />
              </svg>
              <span>Setup live tenant</span>
            </Link>
            <Link
              to="/findings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#147D68] text-white hover:bg-[#0E6150] transition-colors"
            >
              <span>Investigate findings</span> &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
