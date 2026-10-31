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
    border: '#DC2626',
    chevron: 'text-[#DC2626]',
    chipBg: 'bg-[#DC2626]',
    chipText: 'text-white',
  },
  High: {
    border: '#D97706',
    chevron: 'text-[#D97706]',
    chipBg: 'bg-[#D97706]',
    chipText: 'text-white',
  },
  Medium: {
    border: '#CA8A04',
    chevron: 'text-[#CA8A04]',
    chipBg: 'bg-[#CA8A04]',
    chipText: 'text-white',
  },
  Low: {
    border: '#16A34A',
    chevron: 'text-[#16A34A]',
    chipBg: 'bg-[#16A34A]',
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
    } catch (err: any) {
      setError(err?.message || 'Failed to run audit.');
    } finally {
      setIsAuditing(false);
    }
  };

  const uniqueRuleIds = useMemo(() => {
    const ids = new Set<string>();
    findings.forEach((f) => {
      if (f.rule_id) ids.add(f.rule_id);
    });
    return Array.from(ids).sort();
  }, [findings]);

  const normalizeSeverity = (sev?: string): SeverityType => {
    const upper = (sev || '').toUpperCase();
    if (upper === 'CRITICAL') return 'Critical';
    if (upper === 'HIGH') return 'High';
    if (upper === 'MEDIUM') return 'Medium';
    return 'Low';
  };

  const severityCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    findings.forEach((f) => {
      const s = normalizeSeverity(f.severity as string);
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [findings]);

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (selectedSeverity !== 'ALL') {
        const norm = normalizeSeverity(f.severity as string);
        if (norm.toLowerCase() !== selectedSeverity.toLowerCase()) return false;
      }
      if (selectedRule !== 'ALL' && f.rule_id !== selectedRule) {
        return false;
      }
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase().trim();
        const identName = (f.identity_name || '').toLowerCase();
        const identId = (f.identity_id || '').toLowerCase();
        if (!identName.includes(query) && !identId.includes(query)) return false;
      }
      return true;
    });
  }, [findings, selectedSeverity, selectedRule, debouncedSearch]);

  const isFilterActive =
    selectedSeverity !== 'ALL' || selectedRule !== 'ALL' || searchIdentity.trim() !== '';

  const handleClearFilters = () => {
    setSelectedSeverity('ALL');
    setSelectedRule('ALL');
    setSearchIdentity('');
  };

  const handleChipClick = (sev: SeverityType) => {
    if (selectedSeverity === sev) {
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

  const groupedFindings = useMemo(() => {
    const groups: Record<SeverityType, any[]> = {
      Critical: [],
      High: [],
      Medium: [],
      Low: [],
    };

    filteredFindings.forEach((f) => {
      const s = normalizeSeverity(f.severity as string);
      groups[s].push(f);
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E4E4E7] dark:border-[#334155]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#F1F5F9]">
              Risk Findings
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
              {totalFilteredCount} {totalFilteredCount === 1 ? 'Finding' : 'Findings'}
            </span>
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#94A3B8] mt-1 leading-relaxed">
            A finding represents an identified risk pattern where an identity violates one of our detection rules.
            Each card details the <strong className="text-[#18181B] dark:text-[#F1F5F9]">Evidence</strong> (specific attributes detected) and the <strong className="text-[#18181B] dark:text-[#F1F5F9]">Remediation</strong> (how to fix or remove the exposure).{' '}
            <Link to="/how-it-works" className="text-[#2563EB] hover:underline font-medium">
              How is this calculated? &rarr;
            </Link>
          </p>
        </div>

        <div>
          <ExportControls />
        </div>
      </div>

      {/* FILTER BAR & SUMMARY CHIPS */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-3.5 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Severity dropdown */}
          <div className="min-w-[130px]">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-[#E4E4E7] dark:border-[#334155] rounded bg-[#FAFAF9] dark:bg-[#0F172A] text-[#18181B] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
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
              className="w-full px-2.5 py-1.5 text-xs border border-[#E4E4E7] dark:border-[#334155] rounded bg-[#FAFAF9] dark:bg-[#0F172A] text-[#18181B] dark:text-[#F1F5F9] font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
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
              placeholder="Filter by identity name..."
              value={searchIdentity}
              onChange={(e) => setSearchIdentity(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-[#E4E4E7] dark:border-[#334155] rounded bg-[#FAFAF9] dark:bg-[#0F172A] text-[#18181B] dark:text-[#F1F5F9] placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          {/* Sort Option */}
          <div className="min-w-[150px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'severity' | 'identity_name')}
              className="w-full px-2.5 py-1.5 text-xs border border-[#E4E4E7] dark:border-[#334155] rounded bg-[#FAFAF9] dark:bg-[#0F172A] text-[#18181B] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="severity">Sort: Severity (High &rarr; Low)</option>
              <option value="identity_name">Sort: Identity Name (A &rarr; Z)</option>
            </select>
          </div>

          {isFilterActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-[#2563EB] hover:underline px-2 py-1"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* SUMMARY CHIPS */}
        <div className="pt-2 border-t border-[#F4F4F5] dark:border-[#334155] flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-[#71717A] dark:text-[#94A3B8] mr-1">
            Filter by severity:
          </span>
          {SEVERITIES.map((sev) => {
            const count = severityCounts[sev];
            const isSelected = selectedSeverity === sev;
            return (
              <button
                key={sev}
                type="button"
                onClick={() => handleChipClick(sev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                  isSelected
                    ? `${SEVERITY_COLORS[sev].chipBg} ${SEVERITY_COLORS[sev].chipText} font-semibold`
                    : 'bg-[#F4F4F5] dark:bg-[#0F172A] border border-[#E4E4E7] dark:border-[#334155] text-[#71717A] dark:text-[#94A3B8] hover:text-[#18181B] dark:hover:text-[#F1F5F9]'
                }`}
              >
                <span
                  style={{ backgroundColor: SEVERITY_COLORS[sev].border }}
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
        <div className="my-3">
          <ErrorMessage message={error} onRetry={fetchFindings} />
        </div>
      )}

      {/* SKELETON LOADING */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] space-y-2"
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
                  className="w-full flex items-center justify-between p-2.5 px-3 bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg text-left hover:bg-[#F4F4F5]/50 dark:hover:bg-[#0F172A]/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: colors.border }}
                      className="w-2 h-2 rounded-full shrink-0"
                    />
                    <span className="font-semibold text-xs text-[#18181B] dark:text-[#F1F5F9]">
                      {sev} ({groupItems.length})
                    </span>
                  </div>

                  <span className="text-xs text-[#71717A] dark:text-[#94A3B8]">
                    {isExpanded ? '− Collapse' : '+ Expand'}
                  </span>
                </button>

                {/* Cards in group */}
                {isExpanded && (
                  <div className="space-y-2.5 pl-1">
                    {groupItems.map((finding, idx) => (
                      <div
                        key={finding.id || `${finding.rule_id}-${idx}`}
                        style={{ borderLeftColor: colors.border }}
                        className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] border-l-4 rounded-r-lg p-3.5 sm:p-4 space-y-2.5"
                      >
                        {/* Top: Identity Link */}
                        <div className="flex items-center justify-between gap-2 border-b border-[#F4F4F5] dark:border-[#334155] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#71717A] dark:text-[#94A3B8]">Target:</span>
                            <Link
                              to={`/identities/${finding.identity_id || ''}`}
                              className="font-semibold text-xs text-[#2563EB] hover:underline"
                            >
                              {finding.identity_name || 'Identity'}
                            </Link>
                          </div>
                          <span className="font-mono text-[11px] text-[#71717A] dark:text-[#94A3B8]">
                            {finding.rule_id}
                          </span>
                        </div>

                        {/* Title and Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-[#18181B] dark:text-[#F1F5F9]">
                            {finding.rule_name || finding.title || finding.rule_id}
                          </span>
                          <RiskBadge level={finding.severity as RiskLevel} />
                        </div>

                        {/* Evidence Box */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#71717A] dark:text-[#94A3B8]">
                            Evidence
                          </span>
                          <div className="p-2.5 rounded bg-[#F4F4F5] dark:bg-[#0F172A] border border-[#E4E4E7] dark:border-[#334155] font-mono text-[11px] text-[#18181B] dark:text-[#CBD5E1] leading-relaxed break-words">
                            {finding.evidence_text || finding.description || 'Risk trigger conditions detected in directory metadata.'}
                          </div>
                        </div>

                        {/* Remediation Box */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#71717A] dark:text-[#94A3B8]">
                            Remediation
                          </span>
                          <div className="p-2.5 rounded bg-[#DCFCE7]/40 dark:bg-[#064E3B]/20 border border-[#86EFAC]/40 dark:border-[#065F46] text-[11px] text-[#166534] dark:text-[#86EFAC] leading-relaxed">
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
