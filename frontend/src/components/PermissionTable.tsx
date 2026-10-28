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

  // Sub-section table renderer
  const renderSubSectionTable = (title: string, items: PermissionItem[]) => {
    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800">{title}</h4>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm italic">
            None assigned.
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/60 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Scope / Role</th>
                  <th className="px-4 py-3 font-semibold">Resource</th>
                  <th className="px-4 py-3 font-semibold text-right">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, idx) => (
                  <tr
                    key={`${item.scope_or_role}-${idx}`}
                    className={`transition-colors ${
                      item.is_high_risk ? 'bg-[#FEF2F2]' : 'bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Scope / Role: monospace font, small */}
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 break-all">
                      {item.scope_or_role}
                    </td>

                    {/* Resource */}
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {item.resource_display_name || 'Microsoft Graph'}
                    </td>

                    {/* Risk column */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {item.is_high_risk ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                          HIGH RISK
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Permissions</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            {totalCount}
          </span>
        </div>

        {/* Tab switchers on smaller displays or optional toggle */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('application')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'application'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Application ({appPermissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('delegated')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'delegated'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Delegated ({delegatedPermissions.length})
          </button>
        </div>
      </div>

      {/* SUMMARY LINE (above table): If any high-risk perms exist */}
      {highRiskCount > 0 && (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
          <svg className="w-4 h-4 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
          <div>{renderSubSectionTable('Application Permissions', appPermissions)}</div>
          <div>{renderSubSectionTable('Delegated Permissions', delegatedPermissions)}</div>
        </div>
      )}

      {activeTab === 'application' && (
        <div>{renderSubSectionTable('Application Permissions', appPermissions)}</div>
      )}

      {activeTab === 'delegated' && (
        <div>{renderSubSectionTable('Delegated Permissions', delegatedPermissions)}</div>
      )}
    </div>
  );
};

export default PermissionTable;
