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

const SEVERITY_COLORS: Record<SeverityType, { border: string; chevron: string; chipBg: string; chipText: string }> = {
  Critical: {
    border: '#C74444',
    chevron: 'text-[#C74444]',
    chipBg: 'bg-[#C74444]',
    chipText: 'text-white',
  },
  High: {
    border: '#D77928',
    chevron: 'text-[#D77928]',
    chipBg: 'bg-[#D77928]',
    chipText: 'text-white',
  },
  Medium: {
    border: '#C59A32',
    chevron: 'text-[#C59A32]',
    chipBg: 'bg-[#C59A32]',
    chipText: 'text-white',
  },
  Low: {
    border: '#39856A',
    chevron: 'text-[#39856A]',
    chipBg: 'bg-[#39856A]',
    chipText: 'text-white',
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

  // Sorting
  const [sortBy, setSortBy] = useState<'severity' | 'identity_name'>('severity');

  // Collapsible groups
  const [expandedGroups, setExpandedGroups] = useState<Record<SeverityType, boolean>>({
    Critical: true,
    High: true,
    Medium: true,
    Low: true,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchIdentity);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchIdentity]);

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

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      await runAudit();
      await fetchFindings();
    } catch (err) {
      console.warn('Audit error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const toggleGroup = (sev: SeverityType) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [sev]: !prev[sev],
    }));
  };

  const uniqueRuleIds = useMemo(() => {
    const ids = new Set<string>();
    findings.forEach((f) => {
      if (f.rule_id) ids.add(f.rule_id);
    });
    return Array.from(ids).sort();
  }, [findings]);

  const countsBySeverity = useMemo(() => {
    const counts: Record<SeverityType, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };
    findings.forEach((f) => {
      const sev = (f.severity?.charAt(0).toUpperCase() + f.severity?.slice(1).toLowerCase()) as SeverityType;
      if (counts[sev] !== undefined) {
        counts[sev]++;
      }
    });
    return counts;
  }, [findings]);

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (selectedSeverity !== 'ALL') {
        const itemSev = f.severity?.toLowerCase();
        if (itemSev !== selectedSeverity.toLowerCase()) return false;
      }

      if (selectedRule !== 'ALL') {
        if (f.rule_id !== selectedRule) return false;
      }

      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchesName = f.identity_name?.toLowerCase().includes(q);
        const matchesRule = f.rule_name?.toLowerCase().includes(q) || f.rule_id?.toLowerCase().includes(q);
        if (!matchesName && !matchesRule) return false;
      }

      return true;
    });
  }, [findings, selectedSeverity, selectedRule, debouncedSearch]);

  const groupedFindings = useMemo(() => {
    const groups: Record<SeverityType, Finding[]> = {
      Critical: [],
      High: [],
      Medium: [],
      Low: [],
    };

    filteredFindings.forEach((f) => {
      const sev = (f.severity?.charAt(0).toUpperCase() + f.severity?.slice(1).toLowerCase()) as SeverityType;
      if (groups[sev]) {
        groups[sev].push(f);
      } else {
        groups.Medium.push(f);
      }
    });

    SEVERITIES.forEach((sev) => {
      if (sortBy === 'identity_name') {
        groups[sev].sort((a, b) => (a.identity_name || '').localeCompare(b.identity_name || ''));
      } else {
        groups[sev].sort((a, b) => (a.rule_name || a.rule_id).localeCompare(b.rule_name || b.rule_id));
      }
    });

    return groups;
  }, [filteredFindings, sortBy]);

  const totalFilteredCount = filteredFindings.length;
  const isOverallEmpty = findings.length === 0 && !loading;

  const isFilterActive =
    selectedSeverity !== 'ALL' || selectedRule !== 'ALL' || searchIdentity.trim() !== '';

  const handleClearFilters = () => {
    setSelectedSeverity('ALL');
    setSelectedRule('ALL');
    setSearchIdentity('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#DCE2DB] dark:border-[#283C35]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202824] dark:text-[#E8EBE9]">
              Risk Findings
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-[#ECEBE4] dark:bg-[#1E302B] text-[#147D68] dark:text-[#2DD4BF] border border-[#DCE2DB] dark:border-[#283C35]">
              {totalFilteredCount} {totalFilteredCount === 1 ? 'Finding' : 'Findings'}
            </span>
          </div>
          <p className="text-xs text-[#66736C] dark:text-[#95A69E] mt-1 leading-relaxed">
            A finding represents an identified risk pattern where an identity violates one of our detection rules.
            Each card details the <strong className="text-[#202824] dark:text-[#E8EBE9]">Evidence</strong> (specific attributes detected) and the <strong className="text-[#202824] dark:text-[#E8EBE9]">Remediation</strong> (how to fix or remove the exposure).{' '}
            <Link to="/how-it-works" className="text-[#147D68] dark:text-[#2DD4BF] hover:underline font-semibold">
              How is this calculated? &rarr;
            </Link>
          </p>
        </div>

        <div>
          <ExportControls />
        </div>
      </div>

      {/* FILTER BAR & SUMMARY CHIPS */}
      <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-3.5 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Severity dropdown */}
          <div className="min-w-[130px]">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-[#DCE2DB] dark:border-[#283C35] rounded bg-[#F5F4EF] dark:bg-[#111B18] text-[#202824] dark:text-[#E8EBE9] focus:outline-none focus:ring-1 focus:ring-[#147D68]"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Rule ID dropdown */}
          <div className="min-w-[140px]">
            <select
              value={selectedRule}
              onChange={(e) => setSelectedRule(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-[#DCE2DB] dark:border-[#283C35] rounded bg-[#F5F4EF] dark:bg-[#111B18] text-[#202824] dark:text-[#E8EBE9] font-mono focus:outline-none focus:ring-1 focus:ring-[#147D68]"
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
          <div className="flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Filter by identity or rule name..."
              value={searchIdentity}
              onChange={(e) => setSearchIdentity(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-[#DCE2DB] dark:border-[#283C35] rounded bg-[#F5F4EF] dark:bg-[#111B18] text-[#202824] dark:text-[#E8EBE9] placeholder-[#97A8A0] focus:outline-none focus:ring-1 focus:ring-[#147D68]"
            />
          </div>

          {/* Sort Option */}
          <div className="min-w-[150px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'severity' | 'identity_name')}
              className="w-full px-2.5 py-1.5 text-xs border border-[#DCE2DB] dark:border-[#283C35] rounded bg-[#F5F4EF] dark:bg-[#111B18] text-[#202824] dark:text-[#E8EBE9] focus:outline-none focus:ring-1 focus:ring-[#147D68]"
            >
              <option value="severity">Sort: Severity (High &rarr; Low)</option>
              <option value="identity_name">Sort: Identity Name (A &rarr; Z)</option>
            </select>
          </div>

          {isFilterActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-[#147D68] dark:text-[#2DD4BF] hover:underline font-semibold px-2 py-1"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Severity Count Summary Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#ECEBE4] dark:border-[#20312B]">
          <span className="text-[11px] text-[#66736C] dark:text-[#95A69E] font-medium mr-1">
            Filter by severity:
          </span>
          {SEVERITIES.map((sev) => {
            const count = countsBySeverity[sev];
            const isSelected = selectedSeverity === sev;
            const colors = SEVERITY_COLORS[sev];

            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSelectedSeverity(isSelected ? 'ALL' : sev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                  isSelected
                    ? `${colors.chipBg} ${colors.chipText} font-semibold shadow-2xs`
                    : 'bg-[#F5F4EF] dark:bg-[#111B18] border border-[#DCE2DB] dark:border-[#283C35] text-[#66736C] dark:text-[#95A69E] hover:text-[#202824] dark:hover:text-[#E8EBE9]'
                }`}
              >
                <span
                  style={{ backgroundColor: colors.border }}
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                />
                <span>{sev}:</span>
                <span className="font-mono font-semibold">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div>
          <ErrorMessage message={error} onRetry={fetchFindings} />
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] space-y-2 shadow-xs"
            >
              <Skeleton width="40%" height="1rem" />
              <Skeleton width="80%" height="0.875rem" />
              <Skeleton width="60%" height="0.875rem" />
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATES */}
      {!loading && !error && isOverallEmpty && (
        <EmptyState
          title="No findings yet"
          message="Run an audit first to scan non-human identities for excessive permissions, expired credentials, and OAuth risks."
          action={{
            label: isAuditing ? 'Auditing…' : 'Run Audit Scan',
            onClick: handleRunAudit,
            disabled: isAuditing,
            loading: isAuditing,
          }}
        />
      )}

      {!loading && !error && !isOverallEmpty && totalFilteredCount === 0 && (
        <EmptyState
          title="No findings match filters"
          message="No findings matched your current filters. Try selecting another severity level or clearing filters."
          action={{
            label: 'Clear Filters',
            onClick: handleClearFilters,
          }}
        />
      )}

      {/* GROUPED FINDINGS LIST */}
      {!loading && !error && totalFilteredCount > 0 && (
        <div className="space-y-5">
          {SEVERITIES.map((sev) => {
            const groupItems = groupedFindings[sev];
            if (groupItems.length === 0) return null;

            const isExpanded = expandedGroups[sev] !== false;
            const colors = SEVERITY_COLORS[sev];

            return (
              <div key={sev} className="space-y-2.5">
                {/* Collapsible Section Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(sev)}
                  className="w-full flex items-center justify-between p-2.5 px-3.5 bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg text-left hover:bg-[#ECEBE4]/50 dark:hover:bg-[#111B18]/60 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: colors.border }}
                      className="w-2 h-2 rounded-full shrink-0"
                    />
                    <span className="font-semibold text-xs text-[#202824] dark:text-[#E8EBE9]">
                      {sev} Priority Findings ({groupItems.length})
                    </span>
                  </div>

                  <span className="text-xs text-[#66736C] dark:text-[#95A69E]">
                    {isExpanded ? '− Collapse' : '+ Expand'}
                  </span>
                </button>

                {/* Cards in group */}
                {isExpanded && (
                  <div className="space-y-3 pl-1">
                    {groupItems.map((finding, idx) => (
                      <div
                        key={finding.id || `${finding.rule_id}-${idx}`}
                        style={{ borderLeftColor: colors.border }}
                        className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] border-l-4 rounded-r-lg p-4 sm:p-5 space-y-3 shadow-xs"
                      >
                        {/* Top: Identity Link */}
                        <div className="flex items-center justify-between gap-2 border-b border-[#ECEBE4] dark:border-[#283C35] pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#66736C] dark:text-[#95A69E]">Target Identity:</span>
                            <Link
                              to={`/identities/${finding.identity_id || ''}`}
                              className="font-semibold text-xs text-[#147D68] dark:text-[#2DD4BF] hover:underline"
                            >
                              {finding.identity_name || 'Identity'}
                            </Link>
                          </div>
                          <span className="font-mono text-[11px] text-[#66736C] dark:text-[#A7C4B5] bg-[#ECEBE4] dark:bg-[#111B18] px-2 py-0.5 rounded border border-[#DCE2DB] dark:border-[#283C35]">
                            {finding.rule_id}
                          </span>
                        </div>

                        {/* Title and Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-[#202824] dark:text-[#E8EBE9]">
                            {finding.rule_name || finding.title || finding.rule_id}
                          </span>
                          <RiskBadge level={finding.severity as RiskLevel} />
                        </div>

                        {/* Evidence Box */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#66736C] dark:text-[#95A69E]">
                            Evidence
                          </span>
                          <div className="p-2.5 rounded bg-[#172622] text-[#E8EBE9] border border-[#283C35] font-mono text-[11px] leading-relaxed break-words">
                            {finding.evidence_text || finding.description || 'Risk trigger conditions detected in directory metadata.'}
                          </div>
                        </div>

                        {/* Remediation Box */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#66736C] dark:text-[#95A69E]">
                            Remediation Guidance
                          </span>
                          <div className="p-2.5 rounded bg-[#F0FDF4] dark:bg-[#142A22] border border-[#A7C4B5]/40 dark:border-[#283C35] text-[11px] text-[#147D68] dark:text-[#2DD4BF] leading-relaxed">
                            {finding.remediation || 'Review permissions and rotate credentials as recommended by security guidelines.'}
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
