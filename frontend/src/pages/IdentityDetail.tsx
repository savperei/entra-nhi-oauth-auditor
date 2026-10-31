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
        return 'text-[#C74444] dark:text-[#E05A5A]';
      case 'HIGH':
        return 'text-[#D77928] dark:text-[#E58B3C]';
      case 'MEDIUM':
        return 'text-[#C59A32] dark:text-[#DDB045]';
      case 'LOW':
        return 'text-[#39856A] dark:text-[#4AA484]';
      default:
        return 'text-[#66736C] dark:text-[#95A69E]';
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
        return type || 'Identity';
    }
  };

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return 'Unknown';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const grantsList: OAuthGrant[] = useMemo(() => {
    if (!identity) return [];
    if (identity.oauth_grants && identity.oauth_grants.length > 0) {
      return identity.oauth_grants;
    }
    return (identity.oauth_permissions || []).map((p: any, idx: number) => ({
      grant_id: `grant-${idx + 1}`,
      consent_type: p.admin_consent ? 'AllPrincipals' : 'Principal',
      scope: p.permission || '',
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

  const findingsList = identity?.findings || [];
  const findingsCount = findingsList.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-[#147D68] border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-3 text-xs text-[#66736C] dark:text-[#95A69E]">
          Loading identity details...
        </span>
      </div>
    );
  }

  if (is404 || !identity) {
    return (
      <div className="my-12">
        <EmptyState
          title="Identity not found"
          message={`No identity matching the ID "${id}" was found in your directory.`}
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
      <div className="max-w-xl mx-auto my-8">
        <ErrorMessage message={error} onRetry={fetchIdentity} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* SECTION 1 — Identity Header card */}
      <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 sm:p-6 shadow-xs">
        {/* Back link */}
        <div className="mb-3">
          <Link
            to="/identities"
            className="inline-flex items-center gap-1 text-xs text-[#147D68] dark:text-[#2DD4BF] hover:underline font-semibold"
          >
            &larr; All Identities
          </Link>
        </div>

        {/* Display name & Score */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#202824] dark:text-[#E8EBE9] tracking-tight">
              {identity.display_name || identity.name}
            </h1>
            {identity.app_id && (
              <span className="font-mono text-xs text-[#66736C] dark:text-[#95A69E] block mt-0.5">
                App ID: {identity.app_id}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono text-[#66736C] dark:text-[#A7C4B5] bg-[#ECEBE4] dark:bg-[#111B18] border border-[#DCE2DB] dark:border-[#283C35]">
              {formatIdentityType(identity.identity_type)}
            </span>

            <RiskBadge level={identity.risk_level as RiskLevel} />

            <div className="flex items-baseline gap-1 pl-2 border-l border-[#DCE2DB] dark:border-[#283C35]">
              <span className="text-[11px] text-[#66736C] dark:text-[#95A69E] font-medium">
                Score
              </span>
              <span className={`text-xl sm:text-2xl font-bold font-mono ${scoreColorClass}`}>
                {score}
              </span>
            </div>
          </div>
        </div>

        {/* Plain-English summary sentence */}
        <div className="mt-3.5 p-3 rounded bg-[#F5F4EF] dark:bg-[#111B18] border border-[#DCE2DB] dark:border-[#283C35] text-xs text-[#202824] dark:text-[#E8EBE9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            This {formatIdentityType(identity.identity_type).toLowerCase()} scored{' '}
            <strong className="font-mono font-bold text-[#202824] dark:text-[#E8EBE9]">{score}</strong>{' '}
            because {findingsCount} {findingsCount === 1 ? 'rule' : 'rules'} triggered. Review the findings below to understand what needs attention.
          </span>
          <Link
            to="/how-it-works"
            className="text-[#147D68] dark:text-[#2DD4BF] hover:underline font-semibold whitespace-nowrap text-[11px]"
          >
            How is this calculated? &rarr;
          </Link>
        </div>

        {/* Meta row */}
        <div className="mt-3.5 pt-3.5 border-t border-[#ECEBE4] dark:border-[#283C35] flex flex-wrap items-center gap-3 text-xs text-[#66736C] dark:text-[#95A69E]">
          <div className="flex items-center gap-1">
            {isPublisherVerified ? (
              <span className="text-[#39856A] font-medium flex items-center gap-1">
                <span>✓</span> {publisherName}
              </span>
            ) : (
              <span className="text-[#C74444] font-medium flex items-center gap-1">
                <span>⚠</span> {publisherName}
              </span>
            )}
          </div>

          <span>&bull;</span>

          <div>
            <span>Created {formatDate(identity.created_at || identity.created_date)}</span>
          </div>

          <span>&bull;</span>

          <div>
            {isEnabled ? (
              <span className="inline-flex items-center gap-1 text-[#39856A] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39856A]" /> Enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#C74444] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C74444]" /> Disabled
              </span>
            )}
          </div>

          {identity.owner && identity.owner !== 'unassigned' && (
            <>
              <span>&bull;</span>
              <span>Owner: <span className="font-mono text-[#202824] dark:text-[#E8EBE9]">{identity.owner}</span></span>
            </>
          )}
        </div>
      </div>

      {/* SECTION 2 — Three tabs */}
      <div className="space-y-3">
        {/* Tab Headers */}
        <div className="flex border-b border-[#DCE2DB] dark:border-[#283C35] gap-2">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'permissions'
                ? 'border-[#147D68] text-[#147D68] dark:text-[#2DD4BF] font-semibold'
                : 'border-transparent text-[#66736C] dark:text-[#95A69E] hover:text-[#202824] dark:hover:text-[#E8EBE9]'
            }`}
          >
            Permissions ({permissionsList.length})
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'credentials'
                ? 'border-[#147D68] text-[#147D68] dark:text-[#2DD4BF] font-semibold'
                : 'border-transparent text-[#66736C] dark:text-[#95A69E] hover:text-[#202824] dark:hover:text-[#E8EBE9]'
            }`}
          >
            Credentials ({credentialsList.length})
          </button>
          <button
            onClick={() => setActiveTab('grants')}
            className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'grants'
                ? 'border-[#147D68] text-[#147D68] dark:text-[#2DD4BF] font-semibold'
                : 'border-transparent text-[#66736C] dark:text-[#95A69E] hover:text-[#202824] dark:hover:text-[#E8EBE9]'
            }`}
          >
            OAuth Grants ({grantsList.length})
          </button>
        </div>

        {/* Tab 1: Permissions */}
        {activeTab === 'permissions' && (
          <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-4 shadow-xs">
            <PermissionTable
              permissions={permissionsList.map((p: any) => ({
                scope_or_role: p.scope_or_role || p.permission || '',
                permission_type: (p.permission_type || p.type || 'Delegated') as 'Application' | 'Delegated',
                resource_display_name: p.resource_display_name || p.resource || null,
                is_high_risk: Boolean(p.is_high_risk || p.is_high_privilege),
              }))}
            />
          </div>
        )}

        {/* Tab 2: Credentials */}
        {activeTab === 'credentials' && (
          <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-4 shadow-xs">
            <CredentialHealth
              credentials={credentialsList.map((c: any) => ({
                credential_id: c.credential_id || c.key_id || 'cred',
                type: (c.type?.toLowerCase().includes('cert') ? 'certificate' : 'secret') as 'secret' | 'certificate',
                display_name: c.display_name || c.displayName || null,
                created: c.created || c.created_date || null,
                expires: c.expires || c.expires_date || null,
                days_until_expiry: c.days_until_expiry ?? null,
              }))}
            />
          </div>
        )}

        {/* Tab 3: OAuth Grants */}
        {activeTab === 'grants' && (
          <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-[#ECEBE4] dark:border-[#283C35]">
              <h2 className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9]">
                Active Delegated and Application OAuth Grants
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#ECEBE4] dark:bg-[#111B18] text-[#66736C] dark:text-[#95A69E] text-[11px] font-semibold border-b border-[#DCE2DB] dark:border-[#283C35]">
                  <tr>
                    <th className="py-2.5 px-3.5">Consent Type</th>
                    <th className="py-2.5 px-3.5">Scope / Permissions</th>
                    <th className="py-2.5 px-3.5">Target Resource ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEBE4] dark:divide-[#283C35] text-[#202824] dark:text-[#E8EBE9]">
                  {grantsList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-[#66736C]">
                        No OAuth grants assigned.
                      </td>
                    </tr>
                  ) : (
                    grantsList.map((grant) => {
                      const isAll = grant.consent_type === 'AllPrincipals';
                      return (
                        <tr
                          key={grant.grant_id}
                          className={isAll ? 'bg-[#FEF7EE] dark:bg-[#D77928]/10' : ''}
                        >
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                                isAll
                                  ? 'bg-[#FEF7EE] text-[#D77928] border border-[#D77928]/30 dark:text-[#E58B3C]'
                                  : 'bg-[#ECEBE4] dark:bg-[#111B18] text-[#66736C] dark:text-[#95A69E]'
                              }`}
                            >
                              {grant.consent_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-[11px]">
                            {grant.scope}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-[11px] text-[#66736C] dark:text-[#95A69E]">
                            {grant.resource_id}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3 — Risk Findings */}
      <div className="space-y-2.5 pt-2">
        <h2 className="text-sm font-semibold text-[#202824] dark:text-[#E8EBE9]">
          Triggered Risk Findings
        </h2>
        <EvidencePanel
          findings={findingsList.map((f: any) => ({
            rule_id: f.rule_id,
            rule_name: f.rule_name || f.title || f.rule_id,
            severity: (f.severity || 'Medium') as 'Critical' | 'High' | 'Medium' | 'Low',
            evidence_text: f.evidence_text || f.description || '',
            remediation: f.remediation || '',
          }))}
        />
      </div>
    </div>
  );
};

export default IdentityDetail;
