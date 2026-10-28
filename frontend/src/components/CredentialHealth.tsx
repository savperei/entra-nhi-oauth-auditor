import React, { useMemo } from 'react';

export interface CredentialItem {
  credential_id: string;
  type: 'secret' | 'certificate' | string;
  display_name: string | null;
  created: string | null;
  expires: string | null;
  days_until_expiry: number | null;
}

export interface CredentialHealthProps {
  credentials?: CredentialItem[] | any[];
}

export const CredentialHealth: React.FC<CredentialHealthProps> = ({ credentials = [] }) => {
  // Normalize incoming credentials to match the expected interface
  const normalizedCredentials = useMemo<CredentialItem[]>(() => {
    return (credentials || []).map((cred: any) => {
      const credential_id = cred.credential_id || cred.key_id || '';
      const rawType = (cred.type || 'secret').toString().toLowerCase();
      const type: 'secret' | 'certificate' = rawType.includes('cert') ? 'certificate' : 'secret';
      const display_name = cred.display_name ?? cred.displayName ?? null;
      const created = cred.created ?? cred.created_date ?? null;
      const expires = cred.expires ?? cred.expires_date ?? null;

      let days_until_expiry = cred.days_until_expiry;
      if (days_until_expiry === undefined) {
        if (cred.is_expired) {
          days_until_expiry = -1;
        } else if (expires && expires !== 'Managed by Azure') {
          const diffTime = new Date(expires).getTime() - Date.now();
          days_until_expiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else {
          days_until_expiry = null;
        }
      }

      return {
        credential_id,
        type,
        display_name,
        created,
        expires,
        days_until_expiry,
      };
    });
  }, [credentials]);

  // Critical check: expired OR days_until_expiry < 14
  const criticalCredentials = useMemo(() => {
    return normalizedCredentials.filter((c) => {
      if (c.days_until_expiry !== null && c.days_until_expiry < 14) {
        return true;
      }
      return false;
    });
  }, [normalizedCredentials]);

  const criticalCount = criticalCredentials.length;

  // Format date helper: "DD MMM YYYY"
  const formatExpiryDate = (dateStr: string | null): string => {
    if (!dateStr || dateStr === 'Managed by Azure') {
      return 'No expiry';
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return dateStr;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Status badge logic:
  const getStatusBadge = (expires: string | null, days: number | null) => {
    if (expires === null || expires === '' || expires === 'Managed by Azure' || days === null) {
      return {
        label: 'No expiry',
        badgeClass: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30',
      };
    }
    if (days < 0) {
      return {
        label: 'Expired',
        badgeClass: 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40',
      };
    }
    if (days < 14) {
      return {
        label: `${days}d left`,
        fullLabel: `${days} day${days === 1 ? '' : 's'} left`,
        badgeClass: 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40',
      };
    }
    if (days < 30) {
      return {
        label: `${days}d left`,
        fullLabel: `${days} days left`,
        badgeClass: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30',
      };
    }
    if (days < 90) {
      return {
        label: `${days}d left`,
        fullLabel: `${days} days left`,
        badgeClass: 'bg-[#EAB308]/20 text-[#EAB308] border-[#EAB308]/30',
      };
    }
    return {
      label: 'Valid',
      fullLabel: 'Valid',
      badgeClass: 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30',
    };
  };

  return (
    <div className="space-y-4">
      {/* ALERT BANNER (show above table if any critical) */}
      {criticalCount > 0 && (
        <div className="bg-[#EF4444]/15 border border-[#EF4444]/40 rounded-xl p-3.5 sm:p-4 flex items-center gap-3 text-[#FCA5A5] shadow-sm">
          <svg
            className="w-5 h-5 text-[#EF4444] shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-xs sm:text-sm font-semibold text-[#F1F5F9]">
            {criticalCount} credential{criticalCount === 1 ? '' : 's'} need immediate attention
          </div>
        </div>
      )}

      {/* TABLE / EMPTY STATE CONTAINER */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-sm">
        {normalizedCredentials.length === 0 ? (
          <div className="p-8 text-center text-[#64748B] text-xs sm:text-sm italic">
            No credentials configured.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0F172A]/70 text-[#64748B] text-xs uppercase tracking-wider border-b border-[#334155]">
                <tr>
                  <th className="px-4 sm:px-5 py-3.5 font-semibold">Name</th>
                  <th className="px-3 sm:px-5 py-3.5 font-semibold">Type</th>
                  {/* Desktop header columns: separate Expires and Status */}
                  <th className="hidden sm:table-cell px-5 py-3.5 font-semibold">Expires</th>
                  <th className="hidden sm:table-cell px-5 py-3.5 font-semibold text-right">Status</th>
                  {/* Mobile header column: single stacked Expires & Status */}
                  <th className="sm:hidden px-4 py-3.5 font-semibold text-right">Expires & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {normalizedCredentials.map((cred, idx) => {
                  const isExpiringSoonOrExpired =
                    cred.days_until_expiry !== null && cred.days_until_expiry < 14;
                  const status = getStatusBadge(cred.expires, cred.days_until_expiry);

                  return (
                    <tr
                      key={cred.credential_id || idx}
                      className="hover:bg-[#334155]/30 transition-colors duration-150"
                    >
                      {/* Name: "Unnamed" in muted if display_name is null */}
                      <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                        {cred.display_name ? (
                          <div className="font-semibold text-[#F1F5F9] text-xs sm:text-sm">
                            {cred.display_name}
                          </div>
                        ) : (
                          <div className="text-[#64748B] italic text-xs sm:text-sm">
                            Unnamed
                          </div>
                        )}
                        {cred.credential_id && (
                          <div className="font-mono text-xs text-[#64748B] mt-0.5 max-w-[120px] sm:max-w-none truncate">
                            ID: {cred.credential_id}
                          </div>
                        )}
                      </td>

                      {/* Type column: "Secret" or "Certificate" chip */}
                      <td className="px-3 sm:px-5 py-3.5 whitespace-nowrap">
                        {cred.type === 'certificate' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#3B82F6]/15 text-[#38BDF8] border border-[#3B82F6]/30">
                            Cert
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            Secret
                          </span>
                        )}
                      </td>

                      {/* DESKTOP Expires column */}
                      <td className="hidden sm:table-cell px-5 py-3.5 whitespace-nowrap text-xs">
                        <span
                          className={
                            isExpiringSoonOrExpired
                              ? 'text-[#EF4444] font-semibold'
                              : 'text-[#94A3B8] font-medium'
                          }
                        >
                          {formatExpiryDate(cred.expires)}
                        </span>
                      </td>

                      {/* DESKTOP Status column */}
                      <td className="hidden sm:table-cell px-5 py-3.5 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.badgeClass}`}
                        >
                          {status.fullLabel || status.label}
                        </span>
                      </td>

                      {/* MOBILE STACKED COLUMN: Expires + Status vertically */}
                      <td className="sm:hidden px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-xs ${
                              isExpiringSoonOrExpired
                                ? 'text-[#EF4444] font-semibold'
                                : 'text-[#94A3B8] font-medium'
                            }`}
                          >
                            {formatExpiryDate(cred.expires)}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${status.badgeClass}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CredentialHealth;
