import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useApi';

export const DashboardPage: React.FC = () => {
  const { data, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600 font-medium">Loading synthetic audit telemetry...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <h3 className="text-lg font-semibold mb-2">Backend Connection Notice</h3>
        <p className="text-sm">
          {error || 'Unable to fetch audit statistics.'} Ensure the FastAPI backend is running at{' '}
          <code className="bg-red-100 px-1 py-0.5 rounded font-mono text-xs">http://localhost:8000</code>.
        </p>
      </div>
    );
  }

  const { metrics } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security Audit Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Synthetic Non-Human Identity (NHI) telemetry and OAuth integration risk posture.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total NHI Inventory
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.total_identities}</span>
            <Link to="/identities" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              View all &rarr;
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-2">Service Principals &amp; App Registrations</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm">
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
            Critical Risk Findings
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-red-600">{metrics.critical_risk_count}</span>
            <Link to="/findings" className="text-xs font-semibold text-red-700 hover:text-red-900">
              Review &rarr;
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-2">Immediate remediation recommended</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-orange-200 shadow-sm">
          <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
            High Risk Findings
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-orange-600">{metrics.high_risk_count}</span>
            <Link to="/findings" className="text-xs font-semibold text-orange-700 hover:text-orange-900">
              Review &rarr;
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-2">Expiring secrets &amp; excessive permissions</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Flagged Issues
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.total_findings}</span>
            <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
              {data.total_rules_active} Rules Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Across medium and low categories</p>
        </div>
      </div>

      {/* Quick Action Guidance */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-6 text-white shadow-md">
        <h2 className="text-lg font-bold">Non-Human Identity &amp; OAuth Risk Overview</h2>
        <p className="text-sm text-blue-100 mt-1 max-w-3xl">
          Non-Human Identities (Service Principals, Managed Identities, and OAuth Apps) represent
          high-value targets because they often hold persistent, tenant-wide administrative permissions.
          Use this auditor to discover unrotated credentials, high-privilege scopes, and orphaned apps.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/identities"
            className="px-4 py-2 bg-white text-blue-900 font-semibold text-xs rounded-lg shadow hover:bg-blue-50 transition"
          >
            Inspect Identities
          </Link>
          <Link
            to="/findings"
            className="px-4 py-2 bg-blue-700 text-white font-semibold text-xs rounded-lg hover:bg-blue-600 transition"
          >
            Audit Risk Findings
          </Link>
        </div>
      </div>
    </div>
  );
};

