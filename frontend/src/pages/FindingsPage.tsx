import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFindings } from '../hooks/useApi';
import { RiskBadge } from '../components/RiskBadge';
import { ExportControls } from '../components/ExportControls';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { RiskLevel } from '../types';

export interface FindingsPageProps {
  exportControls?: React.ReactNode;
}

export const FindingsPage: React.FC<FindingsPageProps> = ({ exportControls }) => {
  const { findings, loading, error } = useFindings();
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
          <div className="space-y-2">
            <Skeleton width="220px" height="2rem" />
            <Skeleton width="300px" height="1rem" />
          </div>
          <Skeleton width="180px" height="2rem" rounded="lg" />
        </div>

        {/* 3 Skeleton Cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={`skeleton-${n}`}
              className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
                <div className="flex items-center gap-2">
                  <Skeleton width="80px" height="1.25rem" rounded="full" />
                  <Skeleton width="120px" height="1rem" />
                </div>
                <Skeleton width="140px" height="1rem" />
              </div>
              <Skeleton width="45%" height="1.25rem" />
              <Skeleton width="90%" height="1rem" />
              <div className="p-3 bg-[#0F172A] border border-[#334155] rounded-lg">
                <Skeleton width="100%" height="2rem" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-8">
        <ErrorMessage
          message={`Failed to load findings. ${error}`}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const filtered = findings.filter(
    (f) => severityFilter === 'ALL' || f.severity.toUpperCase() === severityFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#334155]">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9] tracking-tight">Security Audit Findings</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Prioritized security findings based on synthetic Entra NHI OAuth risk analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Severity:
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium border border-[#334155] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#1E293B] text-[#F1F5F9]"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Export Controls rendered in top-right of page header area */}
          {exportControls ?? <ExportControls disabled={findings.length === 0} />}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="my-8">
            <EmptyState
              title="No findings found"
              message={
                findings.length === 0
                  ? "No findings yet. Run an audit first to scan for security risks."
                  : "No risk findings match the selected severity filter."
              }
              action={
                findings.length === 0
                  ? {
                      label: "Run Audit",
                      onClick: () => window.location.assign('/dashboard'),
                    }
                  : {
                      label: "Reset Filter",
                      onClick: () => setSeverityFilter('ALL'),
                    }
              }
            />
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-sm hover:border-[#475569] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#334155]">
                <div className="flex items-center space-x-3">
                  <RiskBadge level={item.severity as RiskLevel} />
                  <span className="font-mono text-xs text-[#64748B] font-semibold">{item.id}</span>
                  <span className="font-mono text-xs text-[#64748B] font-semibold">[{item.rule_id}]</span>
                </div>
                {item.identity_id && (
                  <Link
                    to={`/identities/${item.identity_id}`}
                    className="text-xs font-semibold text-[#3B82F6] hover:text-blue-400 transition-colors"
                  >
                    Target: {item.identity_name || 'Identity'} &rarr;
                  </Link>
                )}
              </div>

              <div className="mt-3">
                <h2 className="text-base font-bold text-[#F1F5F9]">{item.title}</h2>
                <p className="text-sm text-[#94A3B8] mt-1">{item.description}</p>
              </div>

              <div className="mt-4 p-3 bg-[#0F172A] border border-[#334155] rounded-lg text-xs">
                <span className="font-bold text-[#38BDF8]">Remediation Guidance:</span>
                <p className="text-[#94A3B8] mt-0.5">{item.remediation}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FindingsPage;
