import React from 'react';
import { Permission, OAuthPermission } from '../types';

export interface PermissionTableProps {
  permissions?: (Permission | OAuthPermission)[];
}

export const PermissionTable: React.FC<PermissionTableProps> = ({ permissions = [] }) => {
  if (!permissions || permissions.length === 0) {
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
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <p className="text-sm font-medium">No permissions granted.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0F172A]/70 text-[#94A3B8] text-xs uppercase tracking-wider border-b border-[#334155]">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Permission / Scope</th>
              <th className="px-5 py-3.5 font-semibold">Resource</th>
              <th className="px-5 py-3.5 font-semibold">Type</th>
              <th className="px-5 py-3.5 font-semibold">Privilege Level</th>
              <th className="px-5 py-3.5 font-semibold text-right">Admin Consent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]/60 text-[#E2E8F0]">
            {permissions.map((item, idx) => {
              const scope = 'permission' in item ? item.permission : item.scope_or_role;
              const resource = 'resource' in item ? item.resource : (item.resource_display_name || 'Microsoft Graph');
              const permType = 'type' in item ? item.type : item.permission_type;
              const isHigh = 'is_high_privilege' in item ? item.is_high_privilege : item.is_high_risk;
              const adminConsent = 'admin_consent' in item ? item.admin_consent : (permType === 'Application');

              return (
                <tr
                  key={`${scope}-${idx}`}
                  className="hover:bg-[#334155]/30 transition-colors duration-150"
                >
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#38BDF8]">
                    {scope}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#94A3B8] font-medium">
                    {resource}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        permType === 'Application'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {permType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {isHigh ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>
                        High Privilege
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#334155]/60 text-[#94A3B8]">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    {adminConsent ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Granted
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30">
                        Not Required
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
  );
};

export default PermissionTable;

