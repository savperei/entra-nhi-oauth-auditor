import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ExportControls } from '../components/ExportControls';
import { RiskBadge } from '../components/RiskBadge';
import { apiClient, runAudit } from '../services/api';
import { Finding, RiskLevel } from '../types';

type SeverityType = 'Critical' | 'High' | 'Medium' | 'Low';

const SEVERITIES: SeverityType[] = ['Critical', 'High', 'Medium', 'Low'];

const SEVERITY_COLORS: Record<SeverityType, { border: string; chevron: string; chipBg: string; chipText: string; chipBorder: string }> = {
  Critical: {
    border: '#DC2626',
    chevron: 'text-[#DC2626]',
    chipBg: 'bg-red-50',
    chipText: 'text-red-700',
    chipBorder: 'border-red-200',
  },
  High: {
    border: '#D97706',
    chevron: 'text-[#D97706]',
    chipBg: 'bg-amber-50',
    chipText: 'text-amber-700',
    chipBorder: 'border-amber-200',
  },
  Medium: {
    border: '#CA8A04',
    chevron: 'text-[#CA8A04]',
    chipBg: 'bg-yellow-50',
    chipText: 'text-yellow-700',
    chipBorder: 'border-yellow-200',
  },
  Low: {
    border: '#16A34A',
    chevron: 'text-[#16A34A]',
    chipBg: 'bg-green-50',
    chipText: 'text-green-700',
    chipBorder: 'border-green-200',
  },
};

export const Findings: React.FC = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedRule, setSelectedRule] = useState<string>('ALL');
  const [searchIdentity, setSearchIdentity] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Sorting: severity desc (default) or identity name
  const [sortBy, setSortBy] = useState<'severity' | 'identity_name'>('severity');

  // Collapsible groups - all expanded by default
  const [expandedGroups, setExpandedGroups] = useState<Record<SeverityType, boolean>>({
    Critical: true,
    High: true,
    Medium: true,
    Low: true,
  });

  // Debounce identity search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchIdentity);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchIdentity]);

  // Fetch findings from API: GET /api/v1/findings?severity=&rule_id=
  const fetchFindings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (selectedSeverity && selectedSeverity !== 'ALL') {
        params.severity = selectedSeverity;
      }
      if (selectedRule && selectedRule !== 'ALL') {
        params.rule_id = selectedRule;
      }

      const response = await apiClient.get<Finding[]>('/findings', { params });
      setFindings(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch findings:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to load audit findings.');
    } finally {
      setLoading(false);
    }
  }, [selectedSeverity, selectedRule]);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings]);

  // CTA Run Audit
  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      await runAudit();
    } catch (err) {
      console.warn('Audit scan trigger error:', err);
    } finally {
      await fetchFindings();
      setIsAuditing(false);
    }
  };

  // Helper for formatting identity type chip
  const formatIdentityType = (type?: string): string => {
    switch (type) {
      case 'ServicePrincipal':
        return 'Service Principal';
      case 'AppRegistration':
        return 'App Registration';
      case 'ManagedIdentity':
        return 'Managed Identity';
      default:
        return type || 'Service Principal';
    }
  };

  // Normalize single finding
  const normalizeFinding = (f: any) => {
    const rawSev = (f.severity || 'Low').toString().trim();
    const severity: SeverityType =
      rawSev.toUpperCase() === 'CRITICAL'
        ? 'Critical'
        : rawSev.toUpperCase() === 'HIGH'
        ? 'High'
        : rawSev.toUpperCase() === 'MEDIUM'
        ? 'Medium'
        : 'Low';

    const identity_name = f.identity_name || f.display_name || 'Unnamed Identity';
    const identity_id = f.identity_id || f.id || '';
    const identity_type = f.identity_type || (identity_id.startsWith('mi-') ? 'ManagedIdentity' : identity_id.startsWith('app-') ? 'AppRegistration' : 'ServicePrincipal');

    return {
      ...f,
      rule_id: f.rule_id || '',
      rule_name: f.rule_name || f.title || 'Risk Finding',
      severity,
      evidence_text: f.evidence_text || f.description || '',
      remediation: f.remediation || '',
      identity_id,
      identity_name,
      identity_type,
    };
  };

  // Extract unique rule IDs for dropdown
  const uniqueRuleIds = useMemo(() => {
    const set = new Set<string>();
    findings.forEach((f) => {
      if (f.rule_id) set.add(f.rule_id);
    });
    // Add standard known rules if not present for completeness
    ['RULE-001', 'RULE-002', 'RULE-003', 'CRED_001', 'PERM_001'].forEach((r) => set.add(r));
    return Array.from(set).sort();
  }, [findings]);

  // Summary counts per severity (calculated from unfiltered findings list)
  const summaryCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    findings.forEach((f) => {
      const s = (f.severity || '').toString().trim().toUpperCase();
      if (s === 'CRITICAL') counts.Critical++;
      else if (s === 'HIGH') counts.High++;
      else if (s === 'MEDIUM') counts.Medium++;
      else if (s === 'LOW') counts.Low++;
    });
    return counts;
  }, [findings]);

  // Filter findings client-side (applies identity search and guarantees strict dropdown match)
  const filteredFindings = useMemo(() => {
    return findings
      .map(normalizeFinding)
      .filter((item) => {
        // Severity filter
        if (selectedSeverity !== 'ALL') {
          if (item.severity.toLowerCase() !== selectedSeverity.toLowerCase()) return false;
        }

        // Rule ID filter
        if (selectedRule !== 'ALL') {
          if (item.rule_id.toUpperCase() !== selectedRule.toUpperCase()) return false;
        }

        // Search by identity name
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.toLowerCase().trim();
          const matchesName = item.identity_name.toLowerCase().includes(q);
          const matchesId = item.identity_id.toLowerCase().includes(q);
          if (!matchesName && !matchesId) return false;
        }

        return true;
      });
  }, [findings, selectedSeverity, selectedRule, debouncedSearch]);

  // Check if any filter is active
  const isFilterActive =
    selectedSeverity !== 'ALL' ||
    selectedRule !== 'ALL' ||
    searchIdentity.trim() !== '';

  const handleClearFilters = () => {
    setSelectedSeverity('ALL');
    setSelectedRule('ALL');
    setSearchIdentity('');
  };

  // Summary chip click handler (toggles severity filter)
  const handleChipClick = (sev: SeverityType) => {
    if (selectedSeverity.toLowerCase() === sev.toLowerCase()) {
      setSelectedSeverity('ALL');
    } else {
      setSelectedSeverity(sev);
    }
  };

  // Toggle group expansion
  const toggleGroup = (sev: SeverityType) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [sev]: !prev[sev],
    }));
  };

  // Group findings by severity
  const groupedFindings = useMemo(() => {
    const groups: Record<SeverityType, any[]> = {
      Critical: [],
      High: [],
      Medium: [],
      Low: [],
    };

    filteredFindings.forEach((f) => {
      if (groups[f.severity as SeverityType]) {
        groups[f.severity as SeverityType].push(f);
      } else {
        groups.Low.push(f);
      }
    });

    // Sort items within each group if requested
    SEVERITIES.forEach((sev) => {
      if (sortBy === 'identity_name') {
        groups[sev].sort((a, b) => a.identity_name.localeCompare(b.identity_name));
      } else {
        groups[sev].sort((a, b) => a.rule_name.localeCompare(b.rule_name));
      }
    });

    return groups;
  }, [filteredFindings, sortBy]);

  const totalFilteredCount = filteredFindings.length;
  const isOverallEmpty = findings.length === 0 && !loading;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER: Page title "Risk Findings" + total count badge + ExportControls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Risk Findings</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            {totalFilteredCount}
          </span>
        </div>

        {/* ExportControls component (top right) */}
        <div>
          <ExportControls />
        </div>
      </div>

      {/* FILTER BAR & SUMMARY CHIPS CARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        {/* Horizontal Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Severity dropdown: All | Critical | High | Medium | Low */}
          <div className="min-w-[140px]">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Severity
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Rule ID dropdown */}
          <div className="min-w-[150px]">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Rule ID
            </label>
            <select
              value={selectedRule}
              onChange={(e) => setSelectedRule(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            >
              <option value="ALL">All Rules</option>
              {uniqueRuleIds.map((rId) => (
                <option key={rId} value={rId}>
                  {rId}
                </option>
              ))}
            </select>
          </div>

          {/* Search: filter by identity name */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Identity Name
            </label>
            <input
              type="text"
              placeholder="Filter by identity name..."
              value={searchIdentity}
              onChange={(e) => setSearchIdentity(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            </input>
          </div>

          {/* Sort Option */}
          <div className="min-w-[160px]">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'severity' | 'identity_name')}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            >
              <option value="severity">Severity (High &rarr; Low)</option>
              <option value="identity_name">Identity Name (A &rarr; Z)</option>
            </select>
          </div>

          {/* Clear filters link */}
          {isFilterActive && (
            <div className="self-end pb-1.5">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* SUMMARY CHIPS (same as EvidencePanel): Critical: N | High: N | Medium: N | Low: N */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium mr-1">Filter by Severity:</span>

          {SEVERITIES.map((sev) => {
            const count = summaryCounts[sev];
            const isSelected = selectedSeverity.toLowerCase() === sev.toLowerCase();
            const colors = SEVERITY_COLORS[sev];

            return (
              <button
                key={sev}
                type="button"
                onClick={() => handleChipClick(sev)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? `${colors.chipBg} ${colors.chipText} ${colors.chipBorder} ring-2 ring-blue-500/30 shadow-sm`
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{sev}:</span>
                <span className="font-bold">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-red-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={() => fetchFindings()}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING STATE: 4 skeleton cards */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={`skeleton-${n}`}
              className="bg-white border border-slate-200 border-l-[3px] border-l-slate-300 rounded-xl p-5 shadow-sm space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="h-4 bg-slate-200 rounded w-44"></div>
                <div className="h-4 bg-slate-100 rounded w-24"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-5 bg-slate-200 rounded-full w-24"></div>
                <div className="h-3 bg-slate-200 rounded w-16"></div>
              </div>
              <div className="h-16 bg-slate-100 rounded-lg"></div>
              <div className="h-12 bg-slate-50 rounded-lg"></div>
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE: NO AUDIT (shield icon) */}
      {!loading && !error && isOverallEmpty && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600 mb-4 shadow-sm">
            <svg
              className="w-8 h-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            No findings yet. Run an audit first.
          </h2>
          <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
            Scan your non-human identities to identify excessive permissions, expired credentials, and OAuth risks.
          </p>
          <button
            type="button"
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            {isAuditing ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Running Audit Scan...</span>
              </>
            ) : (
              <span>Run Audit Scan</span>
            )}
          </button>
        </div>
      )}

      {/* EMPTY STATE: FILTERED NO RESULTS */}
      {!loading && !error && !isOverallEmpty && totalFilteredCount === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-700 mb-2">
            No findings match filters.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* FINDINGS LIST (grouped by severity with collapsible section header) */}
      {!loading && !error && totalFilteredCount > 0 && (
        <div className="space-y-6">
          {SEVERITIES.map((sev) => {
            const groupItems = groupedFindings[sev];
            if (groupItems.length === 0) return null;

            const isExpanded = expandedGroups[sev] !== false;
            const colors = SEVERITY_COLORS[sev];

            return (
              <div key={sev} className="space-y-3">
                {/* Collapsible Section Header: "Critical (N)" with red chevron */}
                <button
                  type="button"
                  onClick={() => toggleGroup(sev)}
                  className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{ backgroundColor: colors.border }}
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                    />
                    <span className="font-bold text-sm text-slate-900">
                      {sev} ({groupItems.length})
                    </span>
                  </div>

                  {/* Colored Chevron */}
                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg
                      className={`w-5 h-5 ${colors.chevron}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </button>

                {/* Collapsible finding cards */}
                {isExpanded && (
                  <div className="space-y-4 pl-1">
                    {groupItems.map((finding, idx) => (
                      <div
                        key={`${finding.rule_id}-${finding.identity_id}-${idx}`}
                        style={{ borderLeftColor: colors.border, borderLeftWidth: '3px' }}
                        className="bg-white border border-slate-200 border-l-[3px] rounded-xl p-5 shadow-sm space-y-3.5 hover:shadow-md transition-shadow"
                      >
                        {/* TOP OF CARD: Identity name (bold, clickable -> /identities/:id) + identity_type chip */}
                        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 flex-wrap">
                          <Link
                            to={`/identities/${finding.identity_id}`}
                            className="font-bold text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {finding.identity_name}
                          </Link>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {formatIdentityType(finding.identity_type)}
                          </span>
                        </div>

                        {/* SEVERITY ROW: RiskBadge + rule_name (bold) + rule_id (muted monospace, right-aligned) */}
                        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <RiskBadge level={finding.severity as RiskLevel} />
                            <span className="font-bold text-slate-900 text-sm truncate">
                              {finding.rule_name}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-slate-400 shrink-0">
                            {finding.rule_id}
                          </span>
                        </div>

                        {/* MIDDLE: "Evidence" label (tiny caps, muted) + evidence_text in dark code-style box */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Evidence
                          </span>
                          <div className="bg-[#1E293B] text-[#E2E8F0] font-mono text-xs p-3.5 rounded-lg whitespace-pre-wrap break-words leading-relaxed border border-slate-800 shadow-inner">
                            {finding.evidence_text || 'No detailed evidence recorded.'}
                          </div>
                        </div>

                        {/* BOTTOM: "Remediation" label (tiny caps, muted) + remediation text in green-tinted box */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Remediation
                          </span>
                          <div className="bg-[#F0FDF4] text-[#166534] text-xs font-medium p-3.5 rounded-lg border border-green-200 leading-relaxed">
                            {finding.remediation || 'No remediation action defined.'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Findings;

