import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdentities } from '../hooks/useApi';
import { RiskBadge } from '../components/RiskBadge';
import { RiskLevel } from '../types';

export const IdentitiesPage: React.FC = () => {
  const { identities, loading, error } = useIdentities();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600 font-medium">Loading identities...</span>
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

  const filtered = identities.filter((item) => {
    const matchesType = filterType === 'ALL' || item.identity_type === filterType;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.app_id.toLowerCase().includes(search.toLowerCase()) ||
      item.owner.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Non-Human Identities</h1>
          <p className="text-sm text-slate-500 mt-1">
            Auditing service principals, managed identities, and OAuth registered applications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, ID, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">All Types</option>
            <option value="ServicePrincipal">Service Principal</option>
            <option value="ManagedIdentity">Managed Identity</option>
            <option value="AppRegistration">App Registration</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Identity / Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Findings
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-sm text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{item.app_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <span className="px-2 py-0.5 text-xs bg-slate-100 rounded text-slate-700">
                      {item.identity_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {item.owner}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <RiskBadge level={item.risk_level as RiskLevel} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {item.findings_count > 0 ? (
                      <span className="font-semibold text-red-600">{item.findings_count} issue(s)</span>
                    ) : (
                      <span className="text-green-600">Clean</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link
                      to={`/identities/${item.id}`}
                      className="text-blue-600 hover:text-blue-900 font-semibold text-xs"
                    >
                      Audit Details &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

