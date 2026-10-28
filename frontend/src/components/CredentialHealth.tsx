import React from 'react';
import { CredentialInfo } from '../types';

export interface CredentialHealthProps {
  credentials?: CredentialInfo[];
}

export const CredentialHealth: React.FC<CredentialHealthProps> = ({ credentials = [] }) => {
  if (!credentials || credentials.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-8 text-center text-[#94A3B8]">
        <svg
          className="w-10 h-10 mx-auto text-[#64748B] mb-2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p className="text-sm font-medium">No credentials registered for this identity.</p>
      </div>
    );
  }

  const formatDays = (days?: number | null) => {
    if (days === null || days === undefined) return 'N/A';
    if (days > 1000) return 'Managed';
    if (days < 0) return `${Math.abs(days)} days ago (Expired)`;
    if (days === 0) return 'Expires today';
    return `${days} days remaining`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            Total Credentials
          </span>
          <div className="text-2xl font-bold text-[#F1F5F9] mt-1">{credentials.length}</div>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            Expiring &le; 30 Days
          </span>
          <div className="text-2xl font-bold text-[#F59E0B] mt-1">
            {credentials.filter((c) => !c.is_expired && c.days_until_expiry != null && c.days_until_expiry <= 30 && c.days_until_expiry >= 0).length}
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            Expired Keys
          </span>
          <div className="text-2xl font-bold text-[#EF4444] mt-1">
            {credentials.filter((c) => c.is_expired || (c.days_until_expiry != null && c.days_until_expiry < 0)).length}
          </div>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0F172A]/70 text-[#94A3B8] text-xs uppercase tracking-wider border-b border-[#334155]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Credential Type</th>
                <th className="px-5 py-3.5 font-semibold">Key Identifier</th>
                <th className="px-5 py-3.5 font-semibold">Expiry Date</th>
                <th className="px-5 py-3.5 font-semibold">Validity</th>
                <th className="px-5 py-3.5 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/60 text-[#E2E8F0]">
              {credentials.map((cred, idx) => {
                const isExpired = cred.is_expired || (cred.days_until_expiry != null && cred.days_until_expiry < 0);
                const isExpiringSoon = !isExpired && cred.days_until_expiry != null && cred.days_until_expiry <= 30;
                const isManaged = (cred.days_until_expiry != null && cred.days_until_expiry > 1000) || cred.expires_date === 'Managed by Azure';

                return (
                  <tr
                    key={cred.key_id || cred.credential_id || idx}
                    className="hover:bg-[#334155]/30 transition-colors duration-150"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-medium text-xs text-[#F1F5F9]">
                        <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
                        {cred.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#94A3B8]">
                      {cred.key_id || cred.credential_id || 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#94A3B8]">
                      {cred.expires_date || cred.expires || 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                      <span
                        className={
                          isExpired
                            ? 'text-[#EF4444] font-semibold'
                            : isExpiringSoon
                            ? 'text-[#F59E0B] font-semibold'
                            : 'text-[#94A3B8]'
                        }
                      >
                        {formatDays(cred.days_until_expiry)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>
                          Expired
                        </span>
                      ) : isExpiringSoon ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                          Expiring Soon
                        </span>
                      ) : isManaged ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3B82F6]/15 text-[#38BDF8] border border-[#3B82F6]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]"></span>
                          Auto-Managed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                          Healthy
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CredentialHealth;

