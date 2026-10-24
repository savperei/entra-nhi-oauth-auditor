import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFindings } from '../hooks/useApi';
import { RiskBadge } from '../components/RiskBadge';
import { RiskLevel } from '../types';

export const FindingsPage: React.FC = () => {
  const { findings, loading, error } = useFindings();
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600 font-medium">Loading audit findings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  const filtered = findings.filter(
    (f) => severityFilter === 'ALL' || f.severity === severityFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Security Audit Findings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Prioritized security findings based on synthetic Entra NHI OAuth risk analysis.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Severity:
          </label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <RiskBadge level={item.severity as RiskLevel} />
                <span className="font-mono text-xs text-slate-400 font-semibold">{item.id}</span>
                <span className="font-mono text-xs text-slate-400 font-semibold">[{item.rule_id}]</span>
              </div>
              <Link
                to={`/identities/${item.identity_id}`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Target: {item.identity_name} &rarr;
              </Link>
            </div>

            <div className="mt-3">
              <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
              <p className="text-sm text-slate-600 mt-1">{item.description}</p>
            </div>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="font-bold text-slate-700">Remediation Guidance:</span>
              <p className="text-slate-600 mt-0.5">{item.remediation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

