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
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEF7EE] text-[#D77928] border border-[#D77928]/30 dark:bg-[#2A2016] dark:text-[#E58B3C]">
          No expiry
        </span>
      );
    }

    if (days === null) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#ECEBE4] text-[#66736C] dark:bg-[#283C35] dark:text-[#95A69E]">
          Unknown
        </span>
      );
    }

    if (days < 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#FDF2F2] text-[#C74444] border border-[#C74444]/30 dark:bg-[#202F2A] dark:text-[#E05A5A]">
          Expired
        </span>
      );
    }

    if (days < 14) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#FDF2F2] text-[#C74444] border border-[#C74444]/30 dark:bg-[#202F2A] dark:text-[#E05A5A]">
          {days} {days === 1 ? 'day' : 'days'} left
        </span>
      );
    }

    if (days < 30) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF7EE] text-[#D77928] border border-[#D77928]/30 dark:bg-[#2A2016] dark:text-[#E58B3C]">
          {days} days left
        </span>
      );
    }

    if (days < 90) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEFCE8] text-[#C59A32] border border-[#C59A32]/30 dark:bg-[#282618] dark:text-[#DDB045]">
          {days} days left
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F0FDF4] text-[#39856A] border border-[#A7C4B5]/40 dark:bg-[#142A22] dark:text-[#2DD4BF]">
        Valid
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {criticalCount > 0 && (
        <div className="p-3.5 rounded-lg bg-[#FDF2F2] dark:bg-[#202F2A] border border-[#C74444]/40 text-[#C74444] dark:text-[#E05A5A] flex items-center gap-2.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#C74444] shrink-0" />
          <span className="text-xs font-semibold">
            {criticalCount} credential{criticalCount === 1 ? '' : 's'} need immediate attention (expired or expiring in &lt;14 days)
          </span>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#ECEBE4] dark:bg-[#111B18] text-[#66736C] dark:text-[#95A69E] text-[11px] font-semibold border-b border-[#DCE2DB] dark:border-[#283C35]">
              <tr>
                <th className="py-2.5 px-3.5">Name</th>
                <th className="py-2.5 px-3.5">Type</th>
                <th className="py-2.5 px-3.5">Expires</th>
                <th className="py-2.5 px-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEBE4] dark:divide-[#283C35] text-[#202824] dark:text-[#E8EBE9]">
              {normalizedCredentials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#66736C] italic">
                    No credentials configured.
                  </td>
                </tr>
              ) : (
                normalizedCredentials.map((cred, idx) => {
                  const isExpiringSoon = cred.days_until_expiry !== null && cred.days_until_expiry < 14;

                  return (
                    <tr key={cred.credential_id || idx} className="hover:bg-[#ECEBE4]/50 dark:hover:bg-[#111B18]/60 transition-colors">
                      <td className="py-2.5 px-3.5">
                        <span className="font-medium">
                          {cred.display_name || <span className="text-[#97A8A0] italic">Unnamed</span>}
                        </span>
                        {cred.credential_id && (
                          <span className="block font-mono text-[10px] text-[#66736C] dark:text-[#95A69E] truncate max-w-[150px]">
                            {cred.credential_id}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono capitalize bg-[#ECEBE4] dark:bg-[#111B18] text-[#66736C] dark:text-[#95A69E] border border-[#DCE2DB] dark:border-[#283C35]">
                          {cred.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className={`font-mono text-xs ${isExpiringSoon ? 'font-bold text-[#C74444]' : ''}`}>
                          {formatDate(cred.expires)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
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
