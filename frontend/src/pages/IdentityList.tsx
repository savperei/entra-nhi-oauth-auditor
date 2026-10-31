import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RiskBadge } from '../components/RiskBadge';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { apiClient, runAudit } from '../services/api';
import { NonHumanIdentity, RiskLevel } from '../types';

type SortField = 'name' | 'identity_type' | 'risk_level' | 'risk_score' | 'publisher' | 'credentials';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 25;

export const IdentityList: React.FC = () => {
  const [identities, setIdentities] = useState<NonHumanIdentity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedRisk, setSelectedRisk] = useState<string>('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('risk_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedType, selectedRisk]);

  const fetchIdentities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        type: selectedType,
        risk_level: selectedRisk,
        search: debouncedSearch.trim(),
      };

      const response = await apiClient.get<NonHumanIdentity[]>('/identities', { params });
      setIdentities(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch identities:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to load identities.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedType, selectedRisk]);

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      await runAudit();
      await fetchIdentities();
    } catch (err) {
      console.warn('Audit run error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const formatIdentityType = (type?: string): string => {
    switch (type) {
      case 'ServicePrincipal':
        return 'Service Principal';
      case 'AppRegistration':
        return 'App Registration';
      case 'ManagedIdentity':
        return 'Managed Identity';
      default:
        return type || 'Unknown';
    }
  };

  const getRiskScore = (item: NonHumanIdentity): number => {
    if (typeof item.risk_score === 'number') return item.risk_score;
    if (typeof item.score === 'number') return item.score;
    switch (item.risk_level?.toUpperCase()) {
      case 'CRITICAL':
        return 95;
      case 'HIGH':
        return 80;
      case 'MEDIUM':
        return 50;
      case 'LOW':
        return 20;
      default:
        return 0;
    }
  };

  const getScoreColorClass = (level?: string): string => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return 'text-[#DC2626]';
      case 'HIGH':
        return 'text-[#D97706]';
      case 'MEDIUM':
        return 'text-[#CA8A04]';
      case 'LOW':
        return 'text-[#16A34A]';
      default:
        return 'text-[#71717A] dark:text-[#94A3B8]';
    }
  };

  const isPublisherVerified = (item: NonHumanIdentity): boolean => {
    if (typeof item.publisher_verified === 'boolean') return item.publisher_verified;
    if (typeof item.is_publisher_verified === 'boolean') return item.is_publisher_verified;
    if (typeof item.publisher === 'boolean') return item.publisher;
    if (typeof item.publisher === 'object' && item.publisher !== null) {
      return Boolean(item.publisher.is_verified ?? item.publisher.verified);
    }
    if (typeof item.publisher === 'string') {
      const lower = item.publisher.toLowerCase();
      return lower.includes('verified') || lower.includes('microsoft');
    }
    return false;
  };

  const getExpiringCredCount = (item: NonHumanIdentity): number => {
    if (!item.credentials || item.credentials.length === 0) return 0;
    return item.credentials.filter((cred) => {
      if (cred.is_expired) return true;
      if (typeof cred.days_until_expiry === 'number') {
        return cred.days_until_expiry <= 14;
      }
      if (cred.expires_date && cred.expires_date !== 'Managed by Azure') {
        const diffDays = Math.ceil(
          (new Date(cred.expires_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return diffDays <= 14;
      }
      return false;
    }).length;
  };

  const isFilterActive = search.trim() !== '' || selectedType !== '' || selectedRisk !== '';

  const handleClearFilters = () => {
    setSearch('');
    setSelectedType('');
    setSelectedRisk('');
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const filteredIdentities = useMemo(() => {
    return identities.filter((item) => {
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase().trim();
        const matchesName = item.name?.toLowerCase().includes(query);
        const matchesAppId = item.app_id?.toLowerCase().includes(query);
        if (!matchesName && !matchesAppId) return false;
      }

      if (selectedType) {
        const normalizedFilter = selectedType.replace(/\s+/g, '').toLowerCase();
        const normalizedType = (item.identity_type || '').replace(/\s+/g, '').toLowerCase();
        if (normalizedType !== normalizedFilter) return false;
      }

      if (selectedRisk) {
        const normalizedRiskFilter = selectedRisk.toUpperCase();
        const normalizedItemRisk = (item.risk_level || '').toUpperCase();
        if (normalizedItemRisk !== normalizedRiskFilter) return false;
      }

      return true;
    });
  }, [identities, debouncedSearch, selectedType, selectedRisk]);

  const sortedIdentities = useMemo(() => {
    const list = [...filteredIdentities];
    list.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'identity_type':
          comparison = (a.identity_type || '').localeCompare(b.identity_type || '');
          break;
        case 'risk_level': {
          const rankMap: Record<string, number> = {
            CRITICAL: 4,
            HIGH: 3,
            MEDIUM: 2,
            LOW: 1,
            NONE: 0,
          };
          const aRank = rankMap[(a.risk_level || '').toUpperCase()] ?? 0;
          const bRank = rankMap[(b.risk_level || '').toUpperCase()] ?? 0;
          comparison = aRank - bRank;
          break;
        }
        case 'risk_score':
          comparison = getRiskScore(a) - getRiskScore(b);
          break;
        case 'publisher':
          comparison = (isPublisherVerified(a) ? 1 : 0) - (isPublisherVerified(b) ? 1 : 0);
          break;
        case 'credentials':
          comparison = (a.credentials?.length ?? 0) - (b.credentials?.length ?? 0);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredIdentities, sortField, sortOrder]);

  const totalCount = filteredIdentities.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paginatedIdentities = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return sortedIdentities.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedIdentities, currentPage]);

  const renderSortArrow = (field: SortField) => {
    if (sortField !== field) {
      return (
        <span className="ml-1 text-[#A1A1AA] opacity-50 text-[10px]">↕</span>
      );
    }
    return (
      <span className="ml-1 text-[#0F766E] dark:text-[#2DD4BF] text-[10px]">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E4E7] dark:border-[#334155]">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#F1F5F9]">
            Identities
          </h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#0F766E]/10 text-[#0F766E] dark:text-[#2DD4BF] border border-[#0F766E]/20">
            {identities.length} Total
          </span>
        </div>
        <Link
          to="/how-it-works"
          className="text-xs text-[#0F766E] dark:text-[#2DD4BF] hover:underline flex items-center gap-1 font-medium"
        >
          <span>How is risk scored?</span> &rarr;
        </Link>
      </div>

      {/* FILTER BAR */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by identity name or App ID..."
              className="w-full px-3 py-1.5 text-xs border border-[#E4E4E7] dark:border-[#334155] rounded bg-[#FAFAF9] dark:bg-[#0F172A] text-[#18181B] dark:text-[#F1F5F9] placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            />
          </div>

          {/* Type Dropdown */}
          <div className="min-w-[140px]">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-[#E4E4E7] dark:border-[#334155] rounded bg-[#FAFAF9] dark:bg-[#0F172A] text-[#18181B] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="">All Identity Types</option>
              <option value="ServicePrincipal">Service Principal</option>
              <option value="AppRegistration">App Registration</option>
              <option value="ManagedIdentity">Managed Identity</option>
            </select>
          </div>

          {/* Risk Level Dropdown */}
          <div className="min-w-[120px]">
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-[#E4E4E7] dark:border-[#334155] rounded bg-[#FAFAF9] dark:bg-[#0F172A] text-[#18181B] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="">All Risk Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Clear Filters Link */}
          {isFilterActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-[#0F766E] dark:text-[#2DD4BF] hover:underline px-2 py-1"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="my-3">
          <ErrorMessage message={error} onRetry={fetchIdentities} />
        </div>
      )}

      {/* TABLE CONTAINER */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E4E4E7] dark:divide-[#334155] text-left text-xs">
            <thead className="bg-[#F4F4F5] dark:bg-[#0F172A] text-[#71717A] dark:text-[#94A3B8] text-[11px] font-semibold border-b border-[#E4E4E7] dark:border-[#334155]">
              <tr>
                <th
                  scope="col"
                  onClick={() => handleSort('name')}
                  className="px-3 sm:px-4 py-2.5 cursor-pointer hover:bg-[#E4E4E7]/50 dark:hover:bg-[#334155]/40 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Name</span>
                    {renderSortArrow('name')}
                  </div>
                </th>

                <th
                  scope="col"
                  onClick={() => handleSort('identity_type')}
                  className="px-3 sm:px-4 py-2.5 cursor-pointer hover:bg-[#E4E4E7]/50 dark:hover:bg-[#334155]/40 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Type</span>
                    {renderSortArrow('identity_type')}
                  </div>
                </th>

                <th
                  scope="col"
                  onClick={() => handleSort('risk_level')}
                  title="Severity level derived from point total: Critical (80+), High (50-79), Medium (25-49), Low (1-24)"
                  className="px-3 sm:px-4 py-2.5 cursor-pointer hover:bg-[#E4E4E7]/50 dark:hover:bg-[#334155]/40 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Risk Level</span>
                    <span className="text-[10px] text-[#A1A1AA] cursor-help" title="Critical >=80, High >=50, Medium >=25, Low >=1">ⓘ</span>
                    {renderSortArrow('risk_level')}
                  </div>
                </th>

                <th
                  scope="col"
                  onClick={() => handleSort('risk_score')}
                  title="Points summed from triggered risk detection rules. Click to see scoring methodology."
                  className="px-3 sm:px-4 py-2.5 cursor-pointer hover:bg-[#E4E4E7]/50 dark:hover:bg-[#334155]/40 transition-colors select-none text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Score</span>
                    <span className="text-[10px] text-[#A1A1AA] cursor-help" title="Higher score is riskier">ⓘ</span>
                    {renderSortArrow('risk_score')}
                  </div>
                </th>

                <th
                  scope="col"
                  onClick={() => handleSort('publisher')}
                  title="Publisher verification via Microsoft Partner Network"
                  className="hidden sm:table-cell px-3 sm:px-4 py-2.5 cursor-pointer hover:bg-[#E4E4E7]/50 dark:hover:bg-[#334155]/40 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Publisher</span>
                    <span className="text-[10px] text-[#A1A1AA] cursor-help" title="Verified vs unverified publisher status">ⓘ</span>
                    {renderSortArrow('publisher')}
                  </div>
                </th>

                <th
                  scope="col"
                  onClick={() => handleSort('credentials')}
                  title="Attached secrets and certificates, highlighting credentials expiring within 14 days"
                  className="px-3 sm:px-4 py-2.5 cursor-pointer hover:bg-[#E4E4E7]/50 dark:hover:bg-[#334155]/40 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Credentials</span>
                    <span className="text-[10px] text-[#A1A1AA] cursor-help" title="Count of secrets/certs and expiry warning">ⓘ</span>
                    {renderSortArrow('credentials')}
                  </div>
                </th>
              </tr>
            </thead>

            {loading ? (
              <tbody className="divide-y divide-[#E4E4E7] dark:divide-[#334155]">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <tr key={i}>
                    <td className="px-3 sm:px-4 py-2.5"><Skeleton width="130px" height="0.875rem" /></td>
                    <td className="px-3 sm:px-4 py-2.5"><Skeleton width="90px" height="0.875rem" /></td>
                    <td className="px-3 sm:px-4 py-2.5"><Skeleton width="70px" height="0.875rem" /></td>
                    <td className="px-3 sm:px-4 py-2.5 text-right"><Skeleton width="30px" height="0.875rem" className="ml-auto" /></td>
                    <td className="hidden sm:table-cell px-3 sm:px-4 py-2.5"><Skeleton width="80px" height="0.875rem" /></td>
                    <td className="px-3 sm:px-4 py-2.5"><Skeleton width="100px" height="0.875rem" /></td>
                  </tr>
                ))}
              </tbody>
            ) : paginatedIdentities.length > 0 ? (
              <tbody className="divide-y divide-[#E4E4E7] dark:divide-[#334155] text-[#18181B] dark:text-[#F1F5F9]">
                {paginatedIdentities.map((item) => {
                  const verified = isPublisherVerified(item);
                  const credCount = item.credentials?.length ?? 0;
                  const expiringCount = getExpiringCredCount(item);
                  const score = getRiskScore(item);
                  const scoreColor = getScoreColorClass(item.risk_level);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F4F4F5]/60 dark:hover:bg-[#0F172A]/40 transition-colors"
                    >
                      {/* Name */}
                      <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                        <Link
                          to={`/identities/${item.id}`}
                          className="font-medium text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
                        >
                          {item.name}
                        </Link>
                        {item.app_id && (
                          <span className="text-[11px] text-[#71717A] dark:text-[#94A3B8] font-mono block max-w-[160px] sm:max-w-none truncate">
                            {item.app_id}
                          </span>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                        <span className="text-[11px] font-mono text-[#71717A] dark:text-[#94A3B8]">
                          {formatIdentityType(item.identity_type)}
                        </span>
                      </td>

                      {/* Risk Level */}
                      <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                        <RiskBadge level={item.risk_level as RiskLevel} />
                      </td>

                      {/* Score */}
                      <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap text-right">
                        <span className={`font-mono font-bold ${scoreColor}`}>
                          {score}
                        </span>
                      </td>

                      {/* Publisher */}
                      <td className="hidden sm:table-cell px-3 sm:px-4 py-2.5 whitespace-nowrap">
                        {verified ? (
                          <span className="inline-flex items-center gap-1 text-[#16A34A] text-xs font-medium">
                            <span>✓</span>
                            <span className="text-[#3F3F46] dark:text-[#CBD5E1]">
                              {typeof item.publisher === 'string' && item.publisher ? item.publisher : 'Verified'}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#DC2626] text-xs font-medium">
                            <span>⚠</span>
                            <span className="text-[#3F3F46] dark:text-[#CBD5E1]">
                              {typeof item.publisher === 'string' && item.publisher ? item.publisher : 'Unverified'}
                            </span>
                          </span>
                        )}
                      </td>

                      {/* Credentials */}
                      <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                        {credCount === 0 ? (
                          <span className="text-[#A1A1AA] text-[11px]">0 credentials</span>
                        ) : (
                          <span className={`text-[11px] ${expiringCount > 0 ? 'text-[#DC2626] font-medium' : 'text-[#71717A] dark:text-[#94A3B8]'}`}>
                            {credCount} {credCount === 1 ? 'credential' : 'credentials'}
                            {expiringCount > 0 ? `, ${expiringCount} expiring soon` : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ) : null}
          </table>

          {/* EMPTY STATES */}
          {!loading && filteredIdentities.length === 0 && (
            <div className="py-10 px-4">
              {identities.length === 0 && !isFilterActive ? (
                <EmptyState
                  title="No audit data yet"
                  message="Run an audit first to discover all non-human identities and analyze their credentials and permissions."
                  action={{
                    label: isAuditing ? 'Running Scan...' : 'Run Audit',
                    onClick: handleRunAudit,
                    disabled: isAuditing,
                    loading: isAuditing,
                  }}
                />
              ) : (
                <EmptyState
                  title="No matching identities"
                  message="No identities matched your filter or search query. Try clearing filters to inspect all identities."
                  action={{
                    label: 'Clear Filters',
                    onClick: handleClearFilters,
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {!loading && totalCount > 0 && (
          <div className="px-3 sm:px-4 py-2.5 border-t border-[#E4E4E7] dark:border-[#334155] flex items-center justify-between text-xs text-[#71717A] dark:text-[#94A3B8] bg-[#F4F4F5]/30 dark:bg-[#0F172A]/30">
            <span>
              Page {currentPage} of {totalPages} ({totalCount} identities)
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 rounded border border-[#E4E4E7] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F4F4F5] dark:hover:bg-[#334155] transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 rounded border border-[#E4E4E7] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F4F4F5] dark:hover:bg-[#334155] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentityList;
