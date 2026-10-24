import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useIdentity } from '../hooks/useApi';
import { RiskBadge } from '../components/RiskBadge';
import { RiskLevel } from '../types';

export const IdentityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { identity, loading, error } = useIdentity(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600 font-medium">Loading identity audit details...</span>
      </div>
    );
  }

  if (error || !identity) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <h3 className="text-lg font-semibold mb-1">Identity Not Found</h3>
        <p className="text-sm">{error || `No identity matching ID '${id}' was found.`}</p>
        <Link to="/identities" className="inline-block mt-4 text-xs font-semibold text-blue-600 underline">
          &larr; Back to Identities
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/identities" className="text-xs font-medium text-slate-500 hover:text-slate-700">
            &larr; Back
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{identity.name}</h1>
          <RiskBadge level={identity.risk_level as RiskLevel} />
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4 border-b pb-2">
          Metadata &amp; Governance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="block text-xs font-medium text-slate-500">Application (Client) ID</span>
            <span className="font-mono text-xs text-slate-800 break-all">{identity.app_id}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-500">Identity Type</span>
            <span className="text-slate-800">{identity.identity_type}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-500">Owner</span>
            <span className="text-slate-800">{identity.owner}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-500">Last Sign-in Activity</span>
            <span className="text-slate-800">{identity.last_sign_in}</span>
          </div>
        </div>
      </div>

      {/* OAuth Permissions Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4 border-b pb-2">
          OAuth Permissions &amp; Scopes
        </h2>
        {identity.oauth_permissions.length === 0 ? (
          <p className="text-sm text-slate-500">No OAuth permissions granted.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {identity.oauth_permissions.map((perm, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm text-slate-900">{perm.permission}</span>
                  <span className="ml-2 text-xs text-slate-500">({perm.resource})</span>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Type: <span className="font-medium text-slate-600">{perm.type}</span> &bull; Admin Consent:{' '}
                    <span className="font-medium text-slate-600">{perm.admin_consent ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                {perm.is_high_privilege && (
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-red-50 text-red-700 border border-red-200">
                    High Privilege Scope
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credentials Hygiene */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4 border-b pb-2">
          Credentials &amp; Secrets Hygiene
        </h2>
        <div className="space-y-3">
          {identity.credentials.map((cred, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
              <div>
                <span className="font-medium text-slate-800">{cred.type}</span>
                <span className="ml-2 font-mono text-xs text-slate-500">Key: {cred.key_id}</span>
                <div className="text-xs text-slate-400 mt-1">Expires: {cred.expires_date}</div>
              </div>
              <div>
                {cred.is_expired ? (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                    Expired
                  </span>
                ) : cred.days_until_expiry < 30 ? (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                    Expiring soon ({cred.days_until_expiry} days)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                    Valid
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

