import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { PermissionTable } from '../components/PermissionTable';
import { CredentialHealth } from '../components/CredentialHealth';
import { EvidencePanel } from '../components/EvidencePanel';
import { NonHumanIdentity, IdentityDetail as IIdentityDetail, OAuthGrant, RiskLevel } from '../types';

type TabKey = 'permissions' | 'credentials' | 'grants';

export const IdentityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [identity, setIdentity] = useState<(NonHumanIdentity & IIdentityDetail) | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [is404, setIs404] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabKey>('permissions');

  const fetchIdentity = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setIs404(false);

    try {
      const response = await apiClient.get<any>(`/identities/${id}`);
      const data = response.data;
      if (!data) {
        setIs404(true);
        return;
      }
      setIdentity(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setIs404(true);
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to load identity details.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIdentity();
  }, [fetchIdentity]);

  // Derived attributes
  const isPublisherVerified = useMemo(() => {
    if (!identity) return false;
    if (typeof identity.is_publisher_verified === 'boolean') return identity.is_publisher_verified;
    if (typeof identity.publisher_verified === 'boolean') return identity.publisher_verified;
    if (typeof identity.publisher === 'boolean') return identity.publisher;
    if (typeof identity.publisher === 'string') {
      const lower = identity.publisher.toLowerCase();
      return lower.includes('verified') || lower.includes('microsoft');
    }
    return false;
  }, [identity]);

  const publisherName = useMemo(() => {
    if (!identity) return '';
    if (identity.publisher_name) return identity.publisher_name;
    if (typeof identity.publisher === 'string') return identity.publisher;
    return isPublisherVerified ? 'Verified Publisher' : 'Unverified Publisher';
  }, [identity, isPublisherVerified]);

  const isEnabled = useMemo(() => {
    if (!identity) return true;
    if (identity.is_enabled !== undefined) return Boolean(identity.is_enabled);
    if (identity.is_active !== undefined) return Boolean(identity.is_active);
    return true;
  }, [identity]);

  const score = useMemo(() => {
    if (!identity) return 0;
    if (typeof identity.risk_score === 'number') return identity.risk_score;
    if (typeof identity.score === 'number') return identity.score;
    switch (identity.risk_level?.toString().toUpperCase()) {
      case 'CRITICAL':
        return 95;
      case 'HIGH':
        return 82;
      case 'MEDIUM':
        return 55;
      case 'LOW':
        return 20;
      default:
        return 0;
    }
  }, [identity]);

  const scoreColorClass = useMemo(() => {
    switch (identity?.risk_level?.toString().toUpperCase()) {
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
  }, [identity]);

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

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Resolve OAuth grants list (with fallback synthesis if not provided)
  const oauthGrants: OAuthGrant[] = useMemo(() => {
    if (!identity) return [];
    if (identity.oauth_grants && identity.oauth_grants.length > 0) {
      return identity.oauth_grants;
    }
    // Synthesize grants from permissions if backend hasn't populated grants
    const perms = identity.oauth_permissions || [];
    if (perms.length === 0) return [];
    return perms.map((p, idx) => ({
      grant_id: `grant-${idx + 1}`,
      consent_type: p.admin_consent || p.type === 'Application' ? 'AllPrincipals' : 'Principal',
      scope: p.permission,
      resource_id: p.resource || '00000003-0000-0000-c000-000000000000',
    }));
  }, [identity]);

  const permissionsList = useMemo(() => {
    if (!identity) return [];
    return identity.oauth_permissions || identity.permissions || [];
  }, [identity]);

  const credentialsList = useMemo(() => {
    if (!identity) return [];
    return identity.credentials || [];
  }, [identity]);

  // =========================================================================
  // STATES: LOADING, 404, ERROR
  // =========================================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] h-96">
        <div className="w-10 h-10 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-medium text-[#94A3B8]">
          Loading identity details...
        </span>
      </div>
    );
  }

  if (is404 || !identity) {
    return (
      <div className="my-16">
        <EmptyState
          title="Identity not found"
          message={`No non-human identity matching the ID "${id}" was found in directory inventory.`}
          action={{
            label: "Back to Identities",
            onClick: () => window.location.assign('/identities'),
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-5 bg-[#EF4444]/15 border border-[#EF4444]/40 rounded-xl text-[#F87171] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-[#EF4444] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <div className="text-sm font-bold text-white">Error loading identity</div>
            <div className="text-xs text-[#FCA5A5] mt-0.5">{error}</div>
          </div>
        </div>
        <button
          onClick={fetchIdentity}
          className="px-4 py-2 bg-[#EF4444] hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
        >
          Retry
        </button>
      </div>
    );
  }

  // =========================================================================
  // MAIN VIEW
  // =========================================================================

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* SECTION 1 — Identity Header card */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 shadow-sm">
        {/* Back link */}
        <div className="mb-4">
          <Link
            to="/identities"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#38BDF8] transition-colors"
          >
            &larr; All Identities
          </Link>
        </div>

        {/* Display name (large, bold) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F1F5F9] tracking-tight">
              {identity.display_name || identity.name}
            </h1>
            {identity.app_id && (
              <span className="font-mono text-xs text-[#64748B] block mt-1">
                App ID: {identity.app_id}
              </span>
            )}
          </div>

          {/* Row: identity_type chip | RiskBadge | score (large, coloured by level) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Identity type chip */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#334155] text-[#E2E8F0] border border-[#475569]">
              {formatIdentityType(identity.identity_type)}
            </span>

            {/* RiskBadge */}
            <RiskBadge level={identity.risk_level as RiskLevel} />

            {/* Score (large, coloured by level) */}
            <div className="flex items-baseline gap-1 pl-2 border-l border-[#334155]">
              <span className="text-xs uppercase tracking-wider text-[#64748B] font-semibold">
                Score
              </span>
              <span className={`text-2xl sm:text-3xl font-black ${scoreColorClass}`}>
                {score}
              </span>
              <span className="text-xs text-[#64748B] font-medium">/100</span>
            </div>
          </div>
        </div>

        {/* Meta row (muted, small): Publisher | Created date | Enabled/Disabled status chip */}
        <div className="mt-5 pt-4 border-t border-[#334155]/60 flex flex-wrap items-center gap-4 text-xs text-[#94A3B8]">
          {/* Publisher (verified tick or unverified warning) */}
          <div className="flex items-center gap-1.5">
            {isPublisherVerified ? (
              <span className="inline-flex items-center gap-1.5 text-[#22C55E] font-medium" title="Verified Publisher">
                <svg className="w-4 h-4 text-[#22C55E] shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span>{publisherName}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#EF4444] font-medium" title="Unverified Publisher">
                <svg className="w-4 h-4 text-[#EF4444] shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>{publisherName}</span>
              </span>
            )}
          </div>

          <span className="text-[#475569]">&bull;</span>

          {/* Created date */}
          <div className="flex items-center gap-1.5 text-[#94A3B8]">
            <svg className="w-3.5 h-3.5 text-[#64748B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Created {formatDate(identity.created_at || identity.created_date)}</span>
          </div>

          <span className="text-[#475569]">&bull;</span>

          {/* Enabled/Disabled status chip */}
          <div>
            {isEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                Enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>
                Disabled
              </span>
            )}
          </div>

          {identity.owner && identity.owner !== 'unassigned' && (
            <>
              <span className="text-[#475569]">&bull;</span>
              <span className="text-[#64748B]">Owner: <span className="text-[#94A3B8] font-mono">{identity.owner}</span></span>
            </>
          )}
        </div>
      </div>

      {/* SECTION 2 — Three tabs */}
      <div className="space-y-4">
        {/* Tab Headers */}
        <div className="flex border-b border-[#334155] gap-2">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-3 px-4 text-xs font-semibold transition-colors duration-150 relative ${
              activeTab === 'permissions'
                ? 'text-[#38BDF8]'
                : 'text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <span>Permissions</span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[#334155] text-[#CBD5E1]">
              {permissionsList.length}
            </span>
            {activeTab === 'permissions' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38BDF8]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-3 px-4 text-xs font-semibold transition-colors duration-150 relative ${
              activeTab === 'credentials'
                ? 'text-[#38BDF8]'
                : 'text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <span>Credentials</span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[#334155] text-[#CBD5E1]">
              {credentialsList.length}
            </span>
            {activeTab === 'credentials' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38BDF8]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('grants')}
            className={`pb-3 px-4 text-xs font-semibold transition-colors duration-150 relative ${
              activeTab === 'grants'
                ? 'text-[#38BDF8]'
                : 'text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <span>OAuth Grants</span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[#334155] text-[#CBD5E1]">
              {oauthGrants.length}
            </span>
            {activeTab === 'grants' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38BDF8]" />
            )}
          </button>
        </div>

        {/* Tab 1: Permissions */}
        {activeTab === 'permissions' && (
          <div>
            <PermissionTable permissions={permissionsList} />
          </div>
        )}

        {/* Tab 2: Credentials */}
        {activeTab === 'credentials' && (
          <div>
            <CredentialHealth credentials={credentialsList} />
          </div>
        )}

        {/* Tab 3: OAuth Grants */}
        {activeTab === 'grants' && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-sm">
            {oauthGrants.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8]">
                <p className="text-sm font-medium">No OAuth grants recorded.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0F172A]/70 text-[#94A3B8] text-xs uppercase tracking-wider border-b border-[#334155]">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Consent Type</th>
                      <th className="px-5 py-3.5 font-semibold">Scope</th>
                      <th className="px-5 py-3.5 font-semibold">Resource ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]/60 text-[#E2E8F0]">
                    {oauthGrants.map((grant, idx) => {
                      const isAllPrincipals = grant.consent_type === 'AllPrincipals';

                      return (
                        <tr
                          key={grant.grant_id || idx}
                          className={`transition-colors duration-150 ${
                            isAllPrincipals
                              ? 'bg-[#F59E0B]/10 border-l-4 border-l-[#F59E0B] text-[#F1F5F9]'
                              : 'hover:bg-[#334155]/30'
                          }`}
                        >
                          {/* Consent Type */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {isAllPrincipals ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                                AllPrincipals (Tenant-wide)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3B82F6]/15 text-[#38BDF8] border border-[#3B82F6]/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]"></span>
                                Principal (User-delegated)
                              </span>
                            )}
                          </td>

                          {/* Scope */}
                          <td className="px-5 py-3.5 font-mono text-xs text-[#38BDF8]">
                            {grant.scope}
                          </td>

                          {/* Resource ID */}
                          <td className="px-5 py-3.5 font-mono text-xs text-[#94A3B8]">
                            {grant.resource_id}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3 — Risk Findings: Use EvidencePanel component (Full width below the tabs) */}
      <div>
        <EvidencePanel
          findings={identity.findings || []}
          remediation={identity.remediation || identity.remediations || []}
        />
      </div>
    </div>
  );
};

export default IdentityDetail;

