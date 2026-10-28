import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ExportControls } from '../components/ExportControls';
import { RiskBadge } from '../components/RiskBadge';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { apiClient, runAudit } from '../services/api';
import { Finding, RiskLevel } from '../types';

type SeverityType = 'Critical' | 'High' | 'Medium' | 'Low';

const SEVERITIES: SeverityType[] = ['Critical', 'High', 'Medium', 'Low'];

const SEVERITY_COLORS: Record<SeverityType, { border: string; chevron: string; chipBg: string; chipText: string; chipBorder: string }> = {
  Critical: {
    border: '#DC2626',
    chevron: 'text-[#DC2626]',
    chipBg: 'bg-[#DC2626]',
    chipText: 'text-white',
    chipBorder: 'border-[#DC2626]',
  },
  High: {
    border: '#D97706',
    chevron: 'text-[#D97706]',
    chipBg: 'bg-[#D97706]',
    chipText: 'text-white',
    chipBorder: 'border-[#D97706]',
  },
  Medium: {
    border: '#CA8A04',
    chevron: 'text-[#CA8A04]',
    chipBg: 'bg-[#CA8A04]',
    chipText: 'text-white',
    chipBorder: 'border-[#CA8A04]',
  },
  Low: {
    border: '#16A34A',
    chevron: 'text-[#16A34A]',
    chipBg: 'bg-[#16A34A]',
    chipText: 'text-white',
    chipBorder: 'border-[#16A34A]',
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
    ['RULE-001', 'RULE-002', 'RULE-003', 'CRED_001', 'PERM_001'].forEach((r) => set.add(r));
    return Array.from(set).sort();
  }, [findings]);

  // Summary counts per severity
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

  // Filter findings client-side
  const filteredFindings = useMemo(() => {
    return findings
      .map(normalizeFinding)
      .filter((item) => {
        if (selectedSeverity !== 'ALL') {
          if (item.severity.toLowerCase() !== selectedSeverity.toLowerCase()) return false;
        }

        if (selectedRule !== 'ALL') {
          if (item.rule_id.toUpperCase() !== selectedRule.toUpperCase()) return false;
        }

        if (debouncedSearch.trim()) {
          const q = debouncedSearch.toLowerCase().trim();
          const matchesName = item.identity_name.toLowerCase().includes(q);
          const matchesId = item.identity_id.toLowerCase().includes(q);
          if (!matchesName && !matchesId) return false;
        }

        return true;
      });
  }, [findings, selectedSeverity, selectedRule, debouncedSearch]);

  const isFilterActive =
    selectedSeverity !== 'ALL' ||
    selectedRule !== 'ALL' ||
    searchIdentity.trim() !== '';

  const handleClearFilters = () => {
    setSelectedSeverity('ALL');
    setSelectedRule('ALL');
    setSearchIdentity('');
  };

  const handleChipClick = (sev: SeverityType) => {
    if (selectedSeverity.toLowerCase() === sev.toLowerCase()) {
      setSelectedSeverity('ALL');
    } else {
      setSelectedSeverity(sev);
    }
  };

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
      {/* HEADER: Page title + total count badge + ExportControls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-[#F1F5F9] tracking-tight">Risk Findings</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3B82F6]/20 text-[#38BDF8] border border-[#3B82F6]/30">
            {totalFilteredCount}
          </span>
        </div>

        {/* ExportControls component */}
        <div>
          <ExportControls />
        </div>
      </div>

      {/* FILTER BAR & SUMMARY CHIPS CARD */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 shadow-sm space-y-4">
        {/* Horizontal Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Severity dropdown */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Severity
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-1.5 text-xs sm:text-sm border border-[#334155] rounded-lg text-[#F1F5F9] bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Rule ID
            </label>
            <select
              value={selectedRule}
              onChange={(e) => setSelectedRule(e.target.value)}
              className="w-full px-3 py-1.5 text-xs sm:text-sm border border-[#334155] rounded-lg text-[#F1F5F9] bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
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
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Identity Name
            </label>
            <input
              type="text"
              placeholder="Filter by identity name..."
              value={searchIdentity}
              onChange={(e) => setSearchIdentity(e.target.value)}
              className="w-full px-3 py-1.5 text-xs sm:text-sm border border-[#334155] rounded-lg placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#0F172A] text-[#F1F5F9]"
            />
          </div>

          {/* Sort Option */}
          <div className="min-w-[160px]">
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'severity' | 'identity_name')}
              className="w-full px-3 py-1.5 text-xs sm:text-sm border border-[#334155] rounded-lg text-[#F1F5F9] bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="text-xs font-semibold text-[#3B82F6] hover:text-blue-400 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* SUMMARY CHIPS */}
        <div className="pt-3 border-t border-[#334155] flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#64748B] font-medium mr-1">Filter by Severity:</span>

          {SEVERITIES.map((sev) => {
            const count = summaryCounts[sev];
            const isSelected = selectedSeverity.toLowerCase() === sev.toLowerCase();
            const colors = SEVERITY_COLORS[sev];

            return (
              <button
                key={sev}
                type="button"
                onClick={() => handleChipClick(sev)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelected
                    ? `${colors.chipBg} ${colors.chipText} ${colors.chipBorder} shadow-sm`
                    : 'bg-[#0F172A] text-[#94A3B8] border-[#334155] hover:bg-[#334155]/40'
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
        <ErrorMessage message={error} onRetry={fetchFindings} />
      )}

      {/* LOADING STATE: 3 skeleton cards */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={`skeleton-${n}`}
              className="bg-[#1E293B] border border-[#334155] border-l-[3px] border-l-[#475569] rounded-xl p-3.5 sm:p-5 shadow-sm space-y-3"
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
      )}

      {/* EMPTY STATE: NO AUDIT */}
      {!loading && !error && isOverallEmpty && (
        <EmptyState
          title="No findings yet"
          message="Run an audit first to scan non-human identities for excessive permissions, expired credentials, and OAuth risks."
          action={{
            label: isAuditing ? 'Running Audit Scan...' : 'Run Audit Scan',
            onClick: handleRunAudit,
            disabled: isAuditing,
            loading: isAuditing,
          }}
        />
      )}

      {/* EMPTY STATE: FILTERED NO RESULTS */}
      {!loading && !error && !isOverallEmpty && totalFilteredCount === 0 && (
        <EmptyState
          title="No findings match filters"
          message="Try selecting different severity or rule filters, or clearing your search term."
          action={{
            label: 'Clear Filters',
            onClick: handleClearFilters,
          }}
        />
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
                {/* Collapsible Section Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(sev)}
                  className="w-full flex items-center justify-between p-3.5 bg-[#1E293B] border border-[#334155] rounded-xl shadow-sm hover:bg-[#334155]/40 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{ backgroundColor: colors.border }}
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                    />
                    <span className="font-bold text-xs sm:text-sm text-[#F1F5F9]">
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
                  <div className="space-y-4 pl-0 sm:pl-1">
                    {groupItems.map((finding, idx) => (
                      <div
                        key={`${finding.rule_id}-${finding.identity_id}-${idx}`}
                        style={{ borderLeftColor: colors.border, borderLeftWidth: '3px' }}
                        className="bg-[#1E293B] border border-[#334155] border-l-[3px] rounded-xl p-3.5 sm:p-5 shadow-sm space-y-3.5 hover:border-[#475569] transition-all w-full"
                      >
                        {/* TOP OF CARD: Identity name (bold, clickable -> /identities/:id) + identity_type chip */}
                        <div className="flex items-center gap-2 pb-2.5 border-b border-[#334155] flex-wrap">
                          <Link
                            to={`/identities/${finding.identity_id}`}
                            className="font-bold text-xs sm:text-sm text-[#38BDF8] hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                          >
                            {finding.identity_name}
                          </Link>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#0F172A] text-[#CBD5E1] border border-[#334155]">
                            {formatIdentityType(finding.identity_type)}
                          </span>
                        </div>

                        {/* SEVERITY ROW: RiskBadge + rule_name (bold) + rule_id (muted monospace, right-aligned) */}
                        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <RiskBadge level={finding.severity as RiskLevel} />
                            <span className="font-bold text-[#F1F5F9] text-xs sm:text-sm truncate">
                              {finding.rule_name}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-[#64748B] shrink-0">
                            {finding.rule_id}
                          </span>
                        </div>

                        {/* MIDDLE: "Evidence" label (tiny caps, muted) + evidence_text in dark code-style box */}
                        <div>
                          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                            Evidence
                          </span>
                          <div className="bg-[#0F172A] text-[#E2E8F0] font-mono text-xs p-3.5 rounded-lg whitespace-pre-wrap break-words leading-relaxed border border-[#334155] shadow-inner">
                            {finding.evidence_text || 'No detailed evidence recorded.'}
                          </div>
                        </div>

                        {/* BOTTOM: "Remediation" label (tiny caps, muted) + remediation text in green-tinted box */}
                        <div>
                          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                            Remediation
                          </span>
                          <div className="bg-[#22C55E]/10 text-[#4ADE80] text-xs font-medium p-3.5 rounded-lg border border-[#22C55E]/30 leading-relaxed">
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
