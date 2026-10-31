import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAudit } from '../hooks/useAudit';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { result, isLoading, runAudit } = useAudit();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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
    if (path.startsWith('/dashboard')) return 'Security Dashboard';
    if (path.startsWith('/identities/') && path.length > '/identities/'.length) {
      return 'Identity Risk Detail';
    }
    if (path.startsWith('/identities')) return 'Non-Human Identities';
    if (path.startsWith('/findings')) return 'Security Audit Findings';
    if (path.startsWith('/how-it-works')) return 'How It Works';
    if (path.startsWith('/setup')) return 'Setup & Configuration';
    return 'NHI OAuth Auditor';
  };

  const currentTitle = getPageTitle(location.pathname);

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2l-2 2m-1-1l-3 3m2-2l-3 3m-2-2l-3 3" />
          <circle cx="7.5" cy="15.5" r="5.5" />
        </svg>
      ),
    },
    {
      to: '/findings',
      label: 'Findings',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      to: '/how-it-works',
      label: 'How it works',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      to: '/setup',
      label: 'Setup',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#FAFAF9] dark:bg-[#0F172A] text-[#18181B] dark:text-[#F1F5F9] font-sans antialiased overflow-x-hidden transition-colors duration-150">
      {/* Mobile Backdrop Overlay (<768px) */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Slim, quiet enterprise sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed md:sticky top-0 z-50 md:z-20 h-screen bg-[#FFFFFF] dark:bg-[#1E293B] border-r border-[#E4E4E7] dark:border-[#334155] flex flex-col justify-between transition-all duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } w-[220px] md:w-[48px] lg:w-[220px] shrink-0`}
      >
        <div>
          {/* Top Logo Section */}
          <div className="h-14 px-3 lg:px-5 flex items-center justify-between border-b border-[#E4E4E7] dark:border-[#334155]">
            <div className="flex items-center gap-2.5 min-w-0 justify-center md:w-full lg:w-auto lg:justify-start">
              <div
                className="w-7 h-7 rounded-md bg-[#0F766E]/10 border border-[#0F766E]/20 flex items-center justify-center text-[#0F766E] dark:text-[#2DD4BF] shrink-0"
                title="NHI Auditor"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div className="md:hidden lg:block truncate">
                <span className="font-semibold text-[#18181B] dark:text-[#F1F5F9] text-sm tracking-tight block truncate">
                  NHI Auditor
                </span>
                <span className="text-[11px] text-[#71717A] dark:text-[#94A3B8] block font-mono">
                  v1.0.0
                </span>
              </div>
            </div>

            {/* Mobile Close Button (<768px) */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 rounded-md text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F1F5F9] hover:bg-[#F4F4F5] dark:hover:bg-[#334155] focus:outline-none transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Navigation Links with narrow left rule and stronger text for active state */}
          <nav className="mt-3 flex flex-col gap-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={({ isActive }: { isActive: boolean }) =>
                  `px-3 lg:px-4 py-2.5 text-xs flex items-center justify-center lg:justify-start gap-2.5 transition-colors focus:outline-none focus:ring-1 focus:ring-[#0F766E] ${
                    isActive
                      ? 'border-l-2 border-[#0F766E] dark:border-[#2DD4BF] text-[#0F766E] dark:text-[#2DD4BF] font-semibold bg-[#0F766E]/5 dark:bg-[#14B8A6]/10'
                      : 'border-l-2 border-transparent text-[#71717A] dark:text-[#94A3B8] hover:text-[#18181B] dark:hover:text-[#F1F5F9] hover:bg-[#F4F4F5]/60 dark:hover:bg-[#334155]/40 font-normal'
                  }`
                }
              >
                {item.icon}
                <span className="md:hidden lg:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer: Mode info & Dark Mode Toggle */}
        <div className="p-2 lg:p-3 border-t border-[#E4E4E7] dark:border-[#334155] space-y-2">
          {/* Subtle Mode Indicator */}
          <div
            title="Mode: Synthetic Demo Data"
            className="flex items-center justify-center lg:justify-start gap-2 px-2 py-1 text-[11px] text-[#71717A] dark:text-[#94A3B8]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] shrink-0"></span>
            <span className="md:hidden lg:inline truncate">Synthetic demo data</span>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-center lg:justify-between px-2 py-1.5 rounded text-xs text-[#71717A] dark:text-[#94A3B8] hover:bg-[#F4F4F5] dark:hover:bg-[#334155] transition-colors"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            <span className="md:hidden lg:inline text-[11px]">
              {darkMode ? 'Light mode' : 'Dark mode'}
            </span>
            {darkMode ? (
              <svg className="w-3.5 h-3.5 text-[#F59E0B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-[#71717A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 px-4 sm:px-6 lg:px-8 bg-[#FFFFFF] dark:bg-[#1E293B] border-b border-[#E4E4E7] dark:border-[#334155] flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F1F5F9] hover:bg-[#F4F4F5] dark:hover:bg-[#334155] focus:outline-none transition-colors shrink-0"
              aria-label="Open sidebar navigation"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <h1 className="text-sm sm:text-base font-semibold text-[#18181B] dark:text-[#F1F5F9] tracking-tight truncate">
              {currentTitle}
            </h1>

            {result?.run_id && (
              <span className="hidden sm:inline-block font-mono text-[11px] text-[#71717A] dark:text-[#94A3B8] bg-[#F4F4F5] dark:bg-[#0F172A] px-2 py-0.5 rounded border border-[#E4E4E7] dark:border-[#334155]">
                {result.run_id}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => runAudit()}
              disabled={isLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F766E] ${
                isLoading
                  ? 'bg-[#E4E4E7] dark:bg-[#334155] text-[#A1A1AA] cursor-not-allowed'
                  : 'bg-[#0F766E] hover:bg-[#115E59] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white active:scale-98'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-white shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="hidden sm:inline">Auditing…</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Run Audit</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Page Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#FAFAF9] dark:bg-[#0F172A]">
          <Outlet context={{ auditResult: result, isLoading, runAudit }} />
        </main>
      </div>
    </div>
  );
};

export default Layout;
