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

  const criticalCredentials = useMemo(() => {
    return normalizedCredentials.filter((c) => {
      if (c.days_until_expiry !== null && c.days_until_expiry < 14) {
        return true;
      }
      return false;
    });
  }, [normalizedCredentials]);

  const criticalCount = criticalCredentials.length;

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr || dateStr === 'Managed by Azure') return dateStr || 'Never';
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

  const getStatusBadge = (days: number | null, expires: string | null) => {
    if (expires === null || expires === undefined || expires === 'Managed by Azure') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] dark:bg-[#78350F]/30 dark:border-[#B45309] dark:text-[#FDE68A]">
          No expiry
        </span>
      );
    }

    if (days === null) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F4F4F5] text-[#71717A] dark:bg-[#334155] dark:text-[#94A3B8]">
          Unknown
        </span>
      );
    }

    if (days < 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] dark:bg-[#7F1D1D]/30 dark:border-[#991B1B] dark:text-[#FCA5A5]">
          Expired
        </span>
      );
    }

    if (days < 14) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] dark:bg-[#7F1D1D]/30 dark:border-[#991B1B] dark:text-[#FCA5A5]">
          {days} {days === 1 ? 'day' : 'days'} left
        </span>
      );
    }

    if (days < 30) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D] dark:bg-[#78350F]/30 dark:border-[#B45309] dark:text-[#FDE68A]">
          {days} days left
        </span>
      );
    }

    if (days < 90) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF9C3] text-[#CA8A04] border border-[#FDE047] dark:bg-[#713F12]/30 dark:border-[#A16207] dark:text-[#FEF08A]">
          {days} days left
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] dark:bg-[#064E3B]/30 dark:border-[#065F46] dark:text-[#86EFAC]">
        Valid
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {criticalCount > 0 && (
        <div className="p-3 rounded-lg bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 border border-[#FCA5A5] dark:border-[#991B1B] text-[#DC2626] dark:text-[#FCA5A5] flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
          <span className="text-xs font-semibold">
            {criticalCount} credential{criticalCount === 1 ? '' : 's'} need immediate attention (expired or expiring in &lt;14 days)
          </span>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F4F5] dark:bg-[#0F172A] text-[#71717A] dark:text-[#94A3B8] text-[11px] font-semibold border-b border-[#E4E4E7] dark:border-[#334155]">
              <tr>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Expires</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] dark:divide-[#334155] text-[#18181B] dark:text-[#F1F5F9]">
              {normalizedCredentials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#71717A] italic">
                    No credentials configured.
                  </td>
                </tr>
              ) : (
                normalizedCredentials.map((cred, idx) => {
                  const isExpiringSoon = cred.days_until_expiry !== null && cred.days_until_expiry < 14;

                  return (
                    <tr key={cred.credential_id || idx} className="hover:bg-[#F4F4F5]/60 dark:hover:bg-[#0F172A]/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-medium">
                          {cred.display_name || <span className="text-[#A1A1AA] italic">Unnamed</span>}
                        </span>
                        {cred.credential_id && (
                          <span className="block font-mono text-[10px] text-[#71717A] dark:text-[#94A3B8] truncate max-w-[150px]">
                            {cred.credential_id}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono capitalize bg-[#F4F4F5] dark:bg-[#0F172A] text-[#71717A] dark:text-[#94A3B8] border border-[#E4E4E7] dark:border-[#334155]">
                          {cred.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`font-mono text-xs ${isExpiringSoon ? 'font-bold text-[#DC2626]' : ''}`}>
                          {formatDate(cred.expires)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {getStatusBadge(cred.days_until_expiry, cred.expires)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CredentialHealth;
