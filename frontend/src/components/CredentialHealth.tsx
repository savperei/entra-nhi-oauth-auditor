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
  // days_until_expiry < 0 -> "Expired" red
  // days_until_expiry < 14 -> "N days left" red
  // days_until_expiry < 30 -> "N days left" amber
  // days_until_expiry < 90 -> "N days left" yellow
  // days_until_expiry >= 90 -> "Valid" green
  // expires = null -> "No expiry" amber
  const getStatusBadge = (expires: string | null, days: number | null) => {
    if (expires === null || expires === '' || expires === 'Managed by Azure' || days === null) {
      return {
        label: 'No expiry',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    }
    if (days < 0) {
      return {
        label: 'Expired',
        badgeClass: 'bg-red-100 text-red-800 border-red-200',
      };
    }
    if (days < 14) {
      return {
        label: `${days} day${days === 1 ? '' : 's'} left`,
        badgeClass: 'bg-red-100 text-red-800 border-red-200',
      };
    }
    if (days < 30) {
      return {
        label: `${days} days left`,
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    }
    if (days < 90) {
      return {
        label: `${days} days left`,
        badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      };
    }
    return {
      label: 'Valid',
      badgeClass: 'bg-green-100 text-green-800 border-green-200',
    };
  };

  return (
    <div className="space-y-4">
      {/* ALERT BANNER (show above table if any critical) */}
      {criticalCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800 shadow-sm">
          <svg
            className="w-5 h-5 text-red-600 shrink-0"
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
          <div className="text-sm font-semibold">
            {criticalCount} credential{criticalCount === 1 ? '' : 's'} need immediate attention
          </div>
        </div>
      )}

      {/* TABLE / EMPTY STATE CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {normalizedCredentials.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm italic">
            No credentials configured.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Name</th>
                  <th className="px-5 py-3.5 font-semibold">Type</th>
                  <th className="px-5 py-3.5 font-semibold">Expires</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {normalizedCredentials.map((cred, idx) => {
                  const isExpiringSoonOrExpired =
                    cred.days_until_expiry !== null && cred.days_until_expiry < 14;
                  const status = getStatusBadge(cred.expires, cred.days_until_expiry);

                  return (
                    <tr
                      key={cred.credential_id || idx}
                      className="hover:bg-slate-50/60 transition-colors duration-150"
                    >
                      {/* Name: "Unnamed" in muted if display_name is null */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {cred.display_name ? (
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {cred.display_name}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-xs sm:text-sm">
                            Unnamed
                          </div>
                        )}
                        {cred.credential_id && (
                          <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                            ID: {cred.credential_id}
                          </div>
                        )}
                      </td>

                      {/* Type column: "Secret" or "Certificate" chip */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {cred.type === 'certificate' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Certificate
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            Secret
                          </span>
                        )}
                      </td>

                      {/* Expires column: format "DD MMM YYYY", red text if expiring within 14 days */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                        <span
                          className={
                            isExpiringSoonOrExpired
                              ? 'text-red-600 font-semibold'
                              : 'text-slate-600 font-medium'
                          }
                        >
                          {formatExpiryDate(cred.expires)}
                        </span>
                      </td>

                      {/* Status column: badge according to status badge logic */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.badgeClass}`}
                        >
                          {status.label}
                        </span>
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
