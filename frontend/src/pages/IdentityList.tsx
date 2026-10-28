import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RiskBadge } from '../components/RiskBadge';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { apiClient } from '../services/api';
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

  // Sorting - default sort: risk_score descending
  const [sortField, setSortField] = useState<SortField>('risk_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Debounce search input changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedType, selectedRisk]);

  // Fetch identities from API: GET /api/v1/identities?type=&risk_level=&search=
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

  // Trigger audit run for empty state
  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      await apiClient.post('/audit/run');
    } catch (err) {
      console.warn('Audit run endpoint error or fallback:', err);
    } finally {
      await fetchIdentities();
      setIsAuditing(false);
    }
  };

  // Helper for type chip formatting
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

  // Helper for calculating/resolving score
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

  // Helper for score text color matching risk level
  const getScoreColorClass = (level?: string): string => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return 'text-[#EF4444]';
      case 'HIGH':
        return 'text-[#F59E0B]';
      case 'MEDIUM':
        return 'text-[#EAB308]';
      case 'LOW':
        return 'text-[#22C55E]';
      default:
        return 'text-[#94A3B8]';
    }
  };

  // Helper for publisher verification check
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

  // Helper for credentials expiring within 14 days
  const hasExpiringCredentials = (item: NonHumanIdentity): boolean => {
    if (!item.credentials || item.credentials.length === 0) return false;
    return item.credentials.some((cred) => {
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
    });
  };

  // Filter check flag
  const isFilterActive = search.trim() !== '' || selectedType !== '' || selectedRisk !== '';

  const handleClearFilters = () => {
    setSearch('');
    setSelectedType('');
    setSelectedRisk('');
    setCurrentPage(1);
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Fallback client-side filter
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
        if (item.risk_level?.toUpperCase() !== selectedRisk.toUpperCase()) return false;
      }

      return true;
    });
  }, [identities, debouncedSearch, selectedType, selectedRisk]);

  // Risk weighting for sorting
  const riskWeight: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  // Sorted list
  const sortedIdentities = useMemo(() => {
    return [...filteredIdentities].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'identity_type':
          comparison = (a.identity_type || '').localeCompare(b.identity_type || '');
          break;
        case 'risk_level': {
          const rA = riskWeight[a.risk_level?.toUpperCase()] || 0;
          const rB = riskWeight[b.risk_level?.toUpperCase()] || 0;
          comparison = rA - rB;
          break;
        }
        case 'risk_score':
          comparison = getRiskScore(a) - getRiskScore(b);
          break;
        case 'publisher': {
          const pA = isPublisherVerified(a) ? 1 : 0;
          const pB = isPublisherVerified(b) ? 1 : 0;
          comparison = pA - pB;
          break;
        }
        case 'credentials': {
          const cA = a.credentials?.length || 0;
          const cB = b.credentials?.length || 0;
          comparison = cA - cB;
          break;
        }
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredIdentities, sortField, sortOrder]);

  // Pagination calculations
  const totalCount = filteredIdentities.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paginatedIdentities = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return sortedIdentities.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedIdentities, currentPage]);

  const renderSortArrow = (field: SortField) => {
    if (sortField !== field) {
      return (
        <span className="text-[#64748B] ml-1 text-xs select-none" aria-hidden="true">
          ↕
        </span>
      );
    }
    return (
      <span className="text-[#3B82F6] ml-1 font-bold text-xs select-none" aria-hidden="true">
        {sortOrder === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* PAGE TITLE + TOTAL COUNT BADGE */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-[#F1F5F9] tracking-tight">Identities</h1>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3B82F6]/20 text-[#38BDF8] border border-[#3B82F6]/30">
          {totalCount}
        </span>
      </div>

      {/* FILTER BAR (horizontal, below title) */}
      <div className="bg-[#1E293B] p-4 border border-[#334155] rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-[#334155] rounded-lg placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#0F172A] text-[#F1F5F9]"
            />
          </div>

          {/* Type dropdown */}
          <div className="min-w-[150px]">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-[#334155] rounded-lg text-[#F1F5F9] bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="ServicePrincipal">Service Principal</option>
              <option value="AppRegistration">App Registration</option>
              <option value="ManagedIdentity">Managed Identity</option>
            </select>
          </div>

          {/* Risk Level dropdown */}
          <div className="min-w-[130px]">
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-[#334155] rounded-lg text-[#F1F5F9] bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Risks</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* "Clear filters" link (only visible when filter active) */}
          {isFilterActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs sm:text-sm font-medium text-[#3B82F6] hover:text-blue-400 hover:underline transition-colors px-1 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ERROR NOTICE IF OCCURRED */}
      {error && (
        <div className="my-4">
          <ErrorMessage message={error} onRetry={fetchIdentities} />
        </div>
      )}

      {/* TABLE CONTAINER: Wrapped in overflow-x: auto */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#334155] text-left text-sm">
            <thead className="bg-[#0F172A]/70 border-b border-[#334155]">
              <tr>
                {/* Column: Name */}
                <th
                  scope="col"
                  onClick={() => handleSort('name')}
                  className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider cursor-pointer hover:bg-[#334155]/40 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Name</span>
                    {renderSortArrow('name')}
                  </div>
                </th>

                {/* Column: Type */}
                <th
                  scope="col"
                  onClick={() => handleSort('identity_type')}
                  className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider cursor-pointer hover:bg-[#334155]/40 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Type</span>
                    {renderSortArrow('identity_type')}
                  </div>
                </th>

                {/* Column: Risk Level */}
                <th
                  scope="col"
                  onClick={() => handleSort('risk_level')}
                  className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider cursor-pointer hover:bg-[#334155]/40 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Risk Level</span>
                    {renderSortArrow('risk_level')}
                  </div>
                </th>

                {/* Column: Score */}
                <th
                  scope="col"
                  onClick={() => handleSort('risk_score')}
                  className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider cursor-pointer hover:bg-[#334155]/40 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Score</span>
                    {renderSortArrow('risk_score')}
                  </div>
                </th>

                {/* Column: Publisher - HIDDEN BELOW 640px (<640px) */}
                <th
                  scope="col"
                  onClick={() => handleSort('publisher')}
                  className="hidden sm:table-cell px-6 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider cursor-pointer hover:bg-[#334155]/40 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Publisher</span>
                    {renderSortArrow('publisher')}
                  </div>
                </th>

                {/* Column: Credentials */}
                <th
                  scope="col"
                  onClick={() => handleSort('credentials')}
                  className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider cursor-pointer hover:bg-[#334155]/40 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Credentials</span>
                    {renderSortArrow('credentials')}
                  </div>
                </th>
              </tr>
            </thead>

            {/* TABLE STATES */}
            {loading ? (
              /* LOADING STATE: 6 skeleton rows */
              <tbody className="divide-y divide-[#334155]">
                {[...Array(6)].map((_, idx) => (
                  <tr
                    key={`skeleton-${idx}`}
                    className="bg-[#1E293B]"
                  >
                    {/* Name skeleton */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Skeleton width="180px" height="1rem" className="mb-1.5" />
                      <Skeleton width="100px" height="0.75rem" />
                    </td>
                    {/* Type skeleton */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Skeleton width="110px" height="1.25rem" rounded="full" />
                    </td>
                    {/* Risk Level skeleton */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Skeleton width="80px" height="1.25rem" rounded="full" />
                    </td>
                    {/* Score skeleton */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Skeleton width="32px" height="1rem" />
                    </td>
                    {/* Publisher skeleton - hidden below 640px */}
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      <Skeleton width="90px" height="1rem" />
                    </td>
                    {/* Credentials skeleton */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Skeleton width="40px" height="1rem" />
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : paginatedIdentities.length > 0 ? (
              /* POPULATED TABLE: interactive rows with cursor-pointer & hover highlight */
              <tbody className="divide-y divide-[#334155]">
                {paginatedIdentities.map((item, index) => {
                  const verified = isPublisherVerified(item);
                  const credCount = item.credentials?.length ?? 0;
                  const credExpiring = hasExpiringCredentials(item);
                  const score = getRiskScore(item);
                  const scoreColor = getScoreColorClass(item.risk_level);

                  return (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition-colors duration-150 hover:bg-[#334155]/40 ${
                        index % 2 === 0 ? 'bg-[#1E293B]' : 'bg-[#0F172A]/30'
                      }`}
                    >
                      {/* Name: clickable text -> /identities/:id */}
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/identities/${item.id}`}
                          className="font-semibold text-[#38BDF8] hover:underline block text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        >
                          {item.name}
                        </Link>
                        {item.app_id && (
                          <span className="text-xs text-[#64748B] font-mono block mt-0.5 max-w-[160px] sm:max-w-none truncate">
                            {item.app_id}
                          </span>
                        )}
                      </td>

                      {/* Type: small chip */}
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#0F172A] text-[#CBD5E1] border border-[#334155]">
                          {formatIdentityType(item.identity_type)}
                        </span>
                      </td>

                      {/* Risk Level: use RiskBadge component */}
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <RiskBadge level={item.risk_level as RiskLevel} />
                      </td>

                      {/* Score: bold number, colour matches risk level */}
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs sm:text-sm font-bold font-mono ${scoreColor}`}>
                          {score}
                        </span>
                      </td>

                      {/* Publisher: green checkmark if verified, red warning icon if not - HIDDEN BELOW 640px */}
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        {verified ? (
                          <div className="flex items-center gap-1.5 text-[#22C55E]" title="Verified Publisher">
                            <svg
                              className="w-4 h-4 text-[#22C55E] shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-xs font-medium text-[#CBD5E1]">
                              {typeof item.publisher === 'string' && item.publisher ? item.publisher : 'Verified'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[#EF4444]" title="Unverified Publisher">
                            <svg
                              className="w-4 h-4 text-[#EF4444] shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-xs font-medium text-[#CBD5E1]">
                              {typeof item.publisher === 'string' && item.publisher ? item.publisher : 'Unverified'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Credentials: count, red if any expiring within 14 days */}
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs sm:text-sm ${
                            credExpiring ? 'font-bold text-[#EF4444]' : 'font-medium text-[#CBD5E1]'
                          }`}
                        >
                          {credCount}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ) : null}
          </table>

          {/* EMPTY STATES */}
          {!loading && filteredIdentities.length === 0 && (
            <div className="py-12 px-4">
              {identities.length === 0 && !isFilterActive ? (
                <EmptyState
                  title="No audit data"
                  message="Run an audit first to discover and populate your non-human identity inventory."
                  action={{
                    label: isAuditing ? 'Running Audit...' : 'Run Audit',
                    onClick: handleRunAudit,
                    disabled: isAuditing,
                    loading: isAuditing,
                  }}
                />
              ) : (
                <EmptyState
                  title="No matching identities"
                  message="No identities found matching the selected filters or search term."
                  action={{
                    label: 'Clear Filters',
                    onClick: handleClearFilters,
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdentityList;