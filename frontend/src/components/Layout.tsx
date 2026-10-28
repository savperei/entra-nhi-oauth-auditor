import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAudit } from '../hooks/useAudit';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { result, isLoading, runAudit } = useAudit();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile sidebar on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

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

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg
          className="w-5 h-5 shrink-0"
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
      ),
    },
    {
      to: '/identities',
      label: 'Identities',
      icon: (
        <svg
          className="w-5 h-5 shrink-0"
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
      ),
    },
    {
      to: '/findings',
      label: 'Findings',
      icon: (
        <svg
          className="w-5 h-5 shrink-0"
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
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#0F172A] text-[#F1F5F9] font-sans antialiased overflow-x-hidden">
      {/* Mobile Backdrop Overlay (<768px) */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar: Mobile Slide-in Drawer (<768px), Tablet 40px Icon-only (768-1024px), Desktop 240px (>1024px) */}
      <aside
        ref={sidebarRef}
        className={`fixed md:sticky top-0 z-50 md:z-20 h-screen bg-[#1E293B] border-r border-[#334155] flex flex-col justify-between transition-all duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } w-[240px] md:w-[40px] lg:w-[240px] shrink-0`}
      >
        <div>
          {/* Top Logo Section */}
          <div className="h-16 px-2 lg:px-6 flex items-center justify-between border-b border-[#334155]">
            <div className="flex items-center gap-3 min-w-0 justify-center md:w-full lg:w-auto lg:justify-start">
              <div
                className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] shrink-0"
                title="NHI Auditor"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
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
              <div className="md:hidden lg:block truncate">
                <span className="font-bold text-[#F1F5F9] text-base tracking-tight block truncate">
                  NHI Auditor
                </span>
                <span className="text-xs text-[#64748B] block font-mono">
                  v1.0.0 &bull; Safe Local
                </span>
              </div>
            </div>

            {/* Mobile Close Button (<768px) */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#334155] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 lg:mt-6 flex flex-col gap-1 px-1 lg:px-0">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={({ isActive }: { isActive: boolean }) =>
                  `px-2 lg:px-4 py-3 text-xs sm:text-sm flex items-center justify-center lg:justify-start gap-3 transition-colors rounded-lg lg:rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 group relative ${
                    isActive
                      ? 'border-l-0 lg:border-l-4 border-[#3B82F6] text-[#3B82F6] bg-[#0F172A]/70 font-semibold'
                      : 'border-l-0 lg:border-l-4 border-transparent text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#0F172A]/30 font-medium'
                  }`
                }
              >
                {item.icon}
                <span className="md:hidden lg:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Amber Badge */}
        <div className="p-1.5 lg:p-4 border-t border-[#334155]">
          <div
            title="Mode: Synthetic Data"
            className="bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] rounded-lg p-2 lg:px-3 lg:py-2 text-xs font-bold flex items-center justify-center lg:justify-start gap-2 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse shrink-0"></span>
            <span className="md:hidden lg:inline whitespace-nowrap">Mode: Synthetic Data</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Hamburger + Page Title + Run Audit */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#334155] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shrink-0"
              aria-label="Open sidebar navigation"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-[#F1F5F9] tracking-tight truncate">
              {currentTitle}
            </h1>

            {result?.run_id && (
              <span className="hidden sm:inline-block font-mono text-xs text-[#64748B] bg-[#0F172A] px-2 py-0.5 rounded border border-[#334155]">
                {result.run_id}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => runAudit()}
              disabled={isLoading}
              className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLoading
                  ? 'bg-[#334155] text-[#94A3B8] cursor-not-allowed'
                  : 'bg-[#3B82F6] hover:bg-blue-600 text-white active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin text-white shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Running...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 shrink-0"
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#0F172A]">
          <Outlet context={{ auditResult: result, isLoading, runAudit }} />
        </main>
      </div>
    </div>
  );
};

export default Layout;
