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

  // Normalize permissions to standard interface
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

  // Total counts
  const totalCount = normalizedPermissions.length;
  const highRiskCount = useMemo(() => {
    return normalizedPermissions.filter((p) => p.is_high_risk).length;
  }, [normalizedPermissions]);

  // Sort helper: High risk rows sorted to top within each sub-section
  const sortHighRiskFirst = (list: PermissionItem[]) => {
    return [...list].sort((a, b) => {
      if (a.is_high_risk && !b.is_high_risk) return -1;
      if (!a.is_high_risk && b.is_high_risk) return 1;
      return a.scope_or_role.localeCompare(b.scope_or_role);
    });
  };

  // Sub-section items
  const appPermissions = useMemo(() => {
    const filtered = normalizedPermissions.filter((p) => p.permission_type === 'Application');
    return sortHighRiskFirst(filtered);
  }, [normalizedPermissions]);

  const delegatedPermissions = useMemo(() => {
    const filtered = normalizedPermissions.filter((p) => p.permission_type === 'Delegated');
    return sortHighRiskFirst(filtered);
  }, [normalizedPermissions]);

  // Sub-section table & mobile card renderer
  const renderSubSection = (title: string, items: PermissionItem[]) => {
    return (
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
        {/* Section Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#334155] bg-[#0F172A]/60 flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-[#F1F5F9]">{title}</h4>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#334155] text-[#CBD5E1]">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-[#64748B] text-xs sm:text-sm italic">
            None assigned.
          </div>
        ) : (
          <div className="flex-1">
            {/* MOBILE VIEW: Card layout (<640px) */}
            <div className="block sm:hidden divide-y divide-[#334155]">
              {items.map((item, idx) => (
                <div
                  key={`mobile-${item.scope_or_role}-${idx}`}
                  className={`p-3.5 flex items-start justify-between gap-3 ${
                    item.is_high_risk ? 'bg-[#EF4444]/10' : 'bg-[#1E293B]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {/* Scope on top */}
                    <div className="font-mono text-xs font-semibold text-[#F1F5F9] break-all leading-snug">
                      {item.scope_or_role}
                    </div>
                    {/* Resource below */}
                    <div className="text-xs text-[#94A3B8] mt-1">
                      {item.resource_display_name || 'Microsoft Graph'}
                    </div>
                  </div>

                  {/* Badge on right */}
                  <div className="shrink-0 self-center">
                    {item.is_high_risk ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 uppercase tracking-wide whitespace-nowrap">
                        HIGH RISK
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#334155] text-[#94A3B8] border border-[#475569] whitespace-nowrap">
                        Normal
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW (>=640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0F172A]/40 text-[#64748B] text-xs uppercase tracking-wider border-b border-[#334155]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Scope / Role</th>
                    <th className="px-4 py-3 font-semibold">Resource</th>
                    <th className="px-4 py-3 font-semibold text-right">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {items.map((item, idx) => (
                    <tr
                      key={`${item.scope_or_role}-${idx}`}
                      className={`transition-colors ${
                        item.is_high_risk
                          ? 'bg-[#EF4444]/10 hover:bg-[#EF4444]/15'
                          : 'bg-[#1E293B] hover:bg-[#334155]/40'
                      }`}
                    >
                      {/* Scope / Role: monospace font, small */}
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#F1F5F9] break-all">
                        {item.scope_or_role}
                      </td>

                      {/* Resource */}
                      <td className="px-4 py-3 text-xs text-[#94A3B8]">
                        {item.resource_display_name || 'Microsoft Graph'}
                      </td>

                      {/* Risk column */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {item.is_high_risk ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 uppercase tracking-wide">
                            HIGH RISK
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#334155] text-[#94A3B8] border border-[#475569]">
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
    <div className="space-y-4">
      {/* HEADER: Section heading "Permissions" + count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base sm:text-lg font-bold text-[#F1F5F9] tracking-tight">Permissions</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3B82F6]/20 text-[#38BDF8] border border-[#3B82F6]/30">
            {totalCount}
          </span>
        </div>

        {/* Tab switchers */}
        <div className="inline-flex p-1 bg-[#0F172A] border border-[#334155] rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === 'all'
                ? 'bg-[#1E293B] text-[#F1F5F9] shadow-sm font-semibold border border-[#334155]'
                : 'text-[#64748B] hover:text-[#F1F5F9]'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('application')}
            className={`px-3 py-1 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === 'application'
                ? 'bg-[#1E293B] text-[#F1F5F9] shadow-sm font-semibold border border-[#334155]'
                : 'text-[#64748B] hover:text-[#F1F5F9]'
            }`}
          >
            Application ({appPermissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('delegated')}
            className={`px-3 py-1 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === 'delegated'
                ? 'bg-[#1E293B] text-[#F1F5F9] shadow-sm font-semibold border border-[#334155]'
                : 'text-[#64748B] hover:text-[#F1F5F9]'
            }`}
          >
            Delegated ({delegatedPermissions.length})
          </button>
        </div>
      </div>

      {/* SUMMARY LINE (above table): If any high-risk perms exist */}
      {highRiskCount > 0 && (
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#EF4444]">
          <svg className="w-4 h-4 text-[#EF4444] shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            {highRiskCount} high-risk permission{highRiskCount === 1 ? '' : 's'} detected
          </span>
        </div>
      )}

      {/* TWO SUB-SECTIONS: side by side on desktop (lg:grid-cols-2), stacked on mobile (grid-cols-1) */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>{renderSubSection('Application Permissions', appPermissions)}</div>
          <div>{renderSubSection('Delegated Permissions', delegatedPermissions)}</div>
        </div>
      )}

      {activeTab === 'application' && (
        <div>{renderSubSection('Application Permissions', appPermissions)}</div>
      )}

      {activeTab === 'delegated' && (
        <div>{renderSubSection('Delegated Permissions', delegatedPermissions)}</div>
      )}
    </div>
  );
};

export default PermissionTable;
