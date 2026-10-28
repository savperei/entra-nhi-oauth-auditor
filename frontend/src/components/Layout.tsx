import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAudit } from '../hooks/useAudit';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { result, isLoading, runAudit } = useAudit();

  // Derive dynamic page title based on active route
  const getPageTitle = (path: string): string => {
    if (path.startsWith('/dashboard')) return 'Security Audit Dashboard';
    if (path.startsWith('/identities/') && path.length > '/identities/'.length) {
      return 'Identity Risk Detail';
    }
    if (path.startsWith('/identities')) return 'Non-Human Identities';
    if (path.startsWith('/findings')) return 'Security Audit Findings';
    return 'NHI Auditor Overview';
  };

  const currentTitle = getPageTitle(location.pathname);

  return (
    <div className="flex min-h-screen bg-[#0F172A] text-[#F1F5F9] font-sans antialiased">
      {/* 240px Left Sidebar */}
      <aside className="w-[240px] min-w-[240px] max-w-[240px] bg-[#1E293B] border-r border-[#334155] flex flex-col justify-between h-screen sticky top-0 z-20">
        <div>
          {/* Logo + Shield Icon */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-[#334155]">
            <div className="w-9 h-9 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6]">
              {/* Shield Icon */}
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-[#F1F5F9] text-base tracking-tight block">
                NHI Auditor
              </span>
              <span className="text-[10px] text-[#64748B] block font-mono">
                v1.0.0 &bull; Local Mode
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex flex-col gap-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }: { isActive: boolean }) =>
                `px-5 py-3 text-sm flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'border-l-4 border-[#3B82F6] text-[#3B82F6] bg-[#0F172A]/70 font-semibold'
                    : 'border-l-4 border-transparent text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#0F172A]/30 font-medium'
                }`
              }
            >
              {/* Dashboard Icon */}
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/identities"
              className={({ isActive }: { isActive: boolean }) =>
                `px-5 py-3 text-sm flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'border-l-4 border-[#3B82F6] text-[#3B82F6] bg-[#0F172A]/70 font-semibold'
                    : 'border-l-4 border-transparent text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#0F172A]/30 font-medium'
                }`
              }
            >
              {/* Key / Identities Icon */}
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 2l-2 2m-1-1l-3 3m2-2l-3 3m-2-2l-3 3" />
                <circle cx="7.5" cy="15.5" r="5.5" />
              </svg>
              <span>Identities</span>
            </NavLink>

            <NavLink
              to="/findings"
              className={({ isActive }: { isActive: boolean }) =>
                `px-5 py-3 text-sm flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'border-l-4 border-[#3B82F6] text-[#3B82F6] bg-[#0F172A]/70 font-semibold'
                    : 'border-l-4 border-transparent text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#0F172A]/30 font-medium'
                }`
              }
            >
              {/* Alert / Findings Icon */}
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Findings</span>
            </NavLink>
          </nav>
        </div>

        {/* Bottom Amber Badge */}
        <div className="p-4 border-t border-[#334155]">
          <div className="bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse"></span>
            <span>Mode: Synthetic Data</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Page Title Slot + Run Audit Button */}
        <header className="h-16 px-8 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[#F1F5F9] tracking-tight">
              {currentTitle}
            </h1>
            {result?.run_id && (
              <span className="hidden sm:inline-block font-mono text-[11px] text-[#64748B] bg-[#0F172A] px-2 py-0.5 rounded border border-[#334155]">
                {result.run_id}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => runAudit()}
              disabled={isLoading}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow-sm ${
                isLoading
                  ? 'bg-[#334155] text-[#94A3B8] cursor-not-allowed'
                  : 'bg-[#3B82F6] hover:bg-blue-600 text-white active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  {/* Loading Spinner */}
                  <svg
                    className="w-4 h-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  <span>Running Audit...</span>
                </>
              ) : (
                <>
                  {/* Refresh / Play Icon */}
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Run Audit</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Page Content Outlet */}
        <main className="flex-1 p-8 overflow-y-auto bg-[#0F172A]">
          <Outlet context={{ auditResult: result, isLoading, runAudit }} />
        </main>
      </div>
    </div>
  );
};

export default Layout;
