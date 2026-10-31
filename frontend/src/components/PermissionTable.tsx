import React, { useMemo, useState } from 'react';

export interface PermissionItem {
  scope_or_role: string;
  permission_type: 'Application' | 'Delegated';
  resource_display_name: string | null;
  is_high_risk: boolean;
}

export interface PermissionTableProps {
  permissions?: PermissionItem[] | any[];
}

export const PermissionTable: React.FC<PermissionTableProps> = ({ permissions = [] }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'application' | 'delegated'>('all');

  const normalizedPermissions = useMemo<PermissionItem[]>(() => {
    return (permissions || []).map((p: any) => ({
      scope_or_role: p.scope_or_role || p.permission || '',
      permission_type:
        (p.permission_type || p.type || 'Delegated').toString().toLowerCase() === 'application'
          ? 'Application'
          : 'Delegated',
      resource_display_name: p.resource_display_name ?? p.resource ?? null,
      is_high_risk: Boolean(p.is_high_risk ?? p.is_high_privilege ?? false),
    }));
  }, [permissions]);

  const totalCount = normalizedPermissions.length;
  const highRiskCount = useMemo(() => {
    return normalizedPermissions.filter((p) => p.is_high_risk).length;
  }, [normalizedPermissions]);

  const sortHighRiskFirst = (list: PermissionItem[]) => {
    return [...list].sort((a, b) => {
      if (a.is_high_risk && !b.is_high_risk) return -1;
      if (!a.is_high_risk && b.is_high_risk) return 1;
      return a.scope_or_role.localeCompare(b.scope_or_role);
    });
  };

  const appPermissions = useMemo(() => {
    const filtered = normalizedPermissions.filter((p) => p.permission_type === 'Application');
    return sortHighRiskFirst(filtered);
  }, [normalizedPermissions]);

  const delegatedPermissions = useMemo(() => {
    const filtered = normalizedPermissions.filter((p) => p.permission_type === 'Delegated');
    return sortHighRiskFirst(filtered);
  }, [normalizedPermissions]);

  const renderSubSection = (title: string, items: PermissionItem[]) => {
    return (
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg overflow-hidden flex flex-col h-full">
        <div className="px-3.5 py-2.5 border-b border-[#E4E4E7] dark:border-[#334155] bg-[#F4F4F5] dark:bg-[#0F172A] flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[#18181B] dark:text-[#F1F5F9]">{title}</h4>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#E4E4E7] dark:bg-[#334155] text-[#18181B] dark:text-[#CBD5E1]">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-6 text-center text-[#71717A] dark:text-[#94A3B8] text-xs italic">
            None assigned.
          </div>
        ) : (
          <div className="flex-1">
            {/* MOBILE VIEW */}
            <div className="block sm:hidden divide-y divide-[#E4E4E7] dark:divide-[#334155]">
              {items.map((item, idx) => (
                <div
                  key={`mobile-${item.scope_or_role}-${idx}`}
                  className={`p-3 flex items-start justify-between gap-2.5 ${
                    item.is_high_risk ? 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/15' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs font-semibold text-[#18181B] dark:text-[#F1F5F9] break-all">
                      {item.scope_or_role}
                    </div>
                    <div className="text-[11px] text-[#71717A] dark:text-[#94A3B8] mt-0.5">
                      {item.resource_display_name || 'Microsoft Graph'}
                    </div>
                  </div>
                  <div className="shrink-0 self-center">
                    {item.is_high_risk ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] dark:bg-[#7F1D1D]/30 dark:border-[#991B1B] dark:text-[#FCA5A5] uppercase">
                        HIGH RISK
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F4F4F5] dark:bg-[#334155] text-[#71717A] dark:text-[#94A3B8]">
                        Normal
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F4F5] dark:bg-[#0F172A] text-[#71717A] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider border-b border-[#E4E4E7] dark:border-[#334155]">
                  <tr>
                    <th className="px-3.5 py-2 font-semibold">Scope / Role</th>
                    <th className="px-3.5 py-2 font-semibold">Resource</th>
                    <th className="px-3.5 py-2 font-semibold text-right">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7] dark:divide-[#334155]">
                  {items.map((item, idx) => (
                    <tr
                      key={`${item.scope_or_role}-${idx}`}
                      className={`transition-colors ${
                        item.is_high_risk
                          ? 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/15 hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D]/25'
                          : 'hover:bg-[#F4F4F5]/60 dark:hover:bg-[#0F172A]/40'
                      }`}
                    >
                      <td className="px-3.5 py-2 font-mono text-xs font-semibold text-[#18181B] dark:text-[#F1F5F9] break-all">
                        {item.scope_or_role}
                      </td>
                      <td className="px-3.5 py-2 text-xs text-[#71717A] dark:text-[#94A3B8]">
                        {item.resource_display_name || 'Microsoft Graph'}
                      </td>
                      <td className="px-3.5 py-2 text-right whitespace-nowrap">
                        {item.is_high_risk ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] dark:bg-[#7F1D1D]/30 dark:border-[#991B1B] dark:text-[#FCA5A5] uppercase">
                            HIGH RISK
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F4F4F5] dark:bg-[#334155] text-[#71717A] dark:text-[#94A3B8]">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E4E4E7] dark:border-[#334155]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#F1F5F9]">
            Assigned Permissions
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
            {totalCount}
          </span>
        </div>

        {/* Tab pills on small screens */}
        <div className="flex sm:hidden gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2 py-1 text-xs rounded ${
              activeTab === 'all'
                ? 'bg-[#2563EB] text-white'
                : 'bg-[#F4F4F5] dark:bg-[#0F172A] text-[#71717A]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('application')}
            className={`px-2 py-1 text-xs rounded ${
              activeTab === 'application'
                ? 'bg-[#2563EB] text-white'
                : 'bg-[#F4F4F5] dark:bg-[#0F172A] text-[#71717A]'
            }`}
          >
            App ({appPermissions.length})
          </button>
          <button
            onClick={() => setActiveTab('delegated')}
            className={`px-2 py-1 text-xs rounded ${
              activeTab === 'delegated'
                ? 'bg-[#2563EB] text-white'
                : 'bg-[#F4F4F5] dark:bg-[#0F172A] text-[#71717A]'
            }`}
          >
            Delegated ({delegatedPermissions.length})
          </button>
        </div>
      </div>

      {/* Summary line */}
      {highRiskCount > 0 && (
        <div className="text-xs font-medium text-[#DC2626] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          <span>{highRiskCount} high-risk permission{highRiskCount === 1 ? '' : 's'} detected</span>
        </div>
      )}

      {/* Side-by-side or stacked grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(activeTab === 'all' || activeTab === 'application') && (
          <div className="flex-1">
            {renderSubSection('Application Permissions', appPermissions)}
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'delegated') && (
          <div className="flex-1">
            {renderSubSection('Delegated Permissions', delegatedPermissions)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionTable;
