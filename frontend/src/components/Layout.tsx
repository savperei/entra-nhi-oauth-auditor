import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAudit } from '../hooks/useAudit';
import { getConfig, apiClient } from '../services/api';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { result, isLoading, runAudit } = useAudit();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [appMode, setAppMode] = useState<'synthetic' | 'live'>('synthetic');
  const [htmlExporting, setHtmlExporting] = useState<boolean>(false);
  const [jsonExporting, setJsonExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

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

  // Fetch real mode from backend config
  useEffect(() => {
    getConfig()
      .then((cfg) => {
        if (cfg?.mode) {
          setAppMode(cfg.mode === 'live' ? 'live' : 'synthetic');
        }
      })
      .catch(() => {
        setAppMode('synthetic');
      });
  }, []);

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

  // Secondary Download actions
  const handleDownloadReport = async (format: 'html' | 'json') => {
    const isNoAudit =
      !result ||
      (result as any).status === 'no_audit_run' ||
      (result as any).total_identities === 0;
    if (isNoAudit) return;

    if (format === 'html') setHtmlExporting(true);
    else setJsonExporting(true);

    try {
      const response = await apiClient.get(`/reports/${format}`, {
        responseType: 'blob',
      });

      const today = new Date().toISOString().split('T')[0];
      const mimeType = format === 'html' ? 'text/html' : 'application/json';
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `nhi-audit-${today}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccess(format.toUpperCase());
      setTimeout(() => setExportSuccess(null), 2000);
    } catch (err) {
      console.error(`Failed to download ${format} report:`, err);
    } finally {
      if (format === 'html') setHtmlExporting(false);
      else setJsonExporting(false);
    }
  };

  const isNoAuditData =
    !result ||
    (result as any).status === 'no_audit_run' ||
    (result as any).total_identities === 0;

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
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F4EF] dark:bg-[#111B18] text-[#202824] dark:text-[#E8EBE9] font-sans antialiased transition-colors duration-150">
      {/* Mobile Backdrop Overlay (<768px) */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Editorially Crafted Deep Forest Sidebar (Full viewport height, anchored) */}
      <aside
        ref={sidebarRef}
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-20 h-full bg-[#202F2A] dark:bg-[#131E1B] border-r border-[#2D3E38] dark:border-[#22332E] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } w-[240px] md:w-[60px] lg:w-[240px] shrink-0 text-[#E8EBE9] shadow-md md:shadow-none`}
      >
        {/* Top Brand Section & Navigation */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Top Brand Area with Identity Shield */}
          <div className="h-16 px-4 lg:px-5 flex items-center justify-between border-b border-[#2D3E38] dark:border-[#22332E] shrink-0">
            <div className="flex items-center gap-3 min-w-0 justify-center md:w-full lg:w-auto lg:justify-start">
              <div
                className="w-8 h-8 rounded-md bg-[#147D68] border border-[#A7C4B5]/30 flex items-center justify-center text-white shrink-0 shadow-xs"
                title="NHI Auditor Command Centre"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div className="md:hidden lg:block truncate">
                <span className="font-semibold text-[#FFFFFF] text-sm tracking-tight block truncate">
                  NHI Auditor
                </span>
                <span className="text-[10px] text-[#A7C4B5] block font-mono tracking-wider uppercase">
                  Security Console
                </span>
              </div>
            </div>

            {/* Mobile Close Button (<768px) */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded text-[#97A8A0] hover:text-[#FFFFFF] hover:bg-[#172622] focus:outline-none transition-colors"
              aria-label="Close navigation"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Navigation Links (Scrollable if viewport is short) */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={({ isActive }: { isActive: boolean }) =>
                  `px-3 py-2.5 rounded text-xs flex items-center justify-center lg:justify-start gap-3 transition-all focus:outline-none focus:ring-1 focus:ring-[#147D68] ${
                    isActive
                      ? 'border-l-3 border-[#2DD4BF] text-white font-semibold bg-[#172622] pl-2.5 shadow-2xs'
                      : 'border-l-3 border-transparent text-[#97A8A0] hover:text-white hover:bg-[#172622]/60 font-normal'
                  }`
                }
              >
                {item.icon}
                <span className="md:hidden lg:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer: Anchored at bottom with product info & connectivity status */}
        <div className="p-3.5 border-t border-[#2D3E38] dark:border-[#22332E] space-y-2.5 shrink-0 bg-[#202F2A] dark:bg-[#131E1B]">
          {/* Status & Version Card (Expanded on Desktop) */}
          <div className="hidden lg:block p-2.5 rounded bg-[#172622] dark:bg-[#0E1614] border border-[#2D3E38] dark:border-[#22332E]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A7C4B5]">
                Identity Console
              </span>
              <span className="text-[10px] font-mono text-[#97A8A0] bg-[#202F2A] px-1.5 py-0.5 rounded border border-[#2D3E38]">
                v1.0.0
              </span>
            </div>

            {/* Connectivity / Environment state */}
            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#E8EBE9]">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  appMode === 'live'
                    ? 'bg-[#39856A] shadow-[0_0_6px_#39856A]'
                    : 'bg-[#D77928] shadow-[0_0_6px_#D77928]'
                }`}
              />
              <div className="truncate font-sans leading-tight">
                <div className="font-medium text-white truncate text-[11px]">
                  {appMode === 'live' ? 'Entra ID: Connected' : 'Synthetic Benchmark'}
                </div>
                <div className="text-[10px] text-[#97A8A0] font-mono truncate">
                  {appMode === 'live' ? 'Production Tenant' : 'Offline Dataset'}
                </div>
              </div>
            </div>
          </div>

          {/* Compact indicator for tablet collapsed sidebar */}
          <div
            className="hidden md:flex lg:hidden items-center justify-center p-2 rounded bg-[#172622] border border-[#2D3E38]"
            title={appMode === 'live' ? 'Entra ID: Connected (Live)' : 'Synthetic Benchmark Data'}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                appMode === 'live' ? 'bg-[#39856A]' : 'bg-[#D77928]'
              }`}
            />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-center lg:justify-between px-2.5 py-1.5 rounded text-xs text-[#97A8A0] hover:text-white hover:bg-[#172622] border border-transparent hover:border-[#2D3E38] transition-colors cursor-pointer"
            title={darkMode ? 'Switch to warm linen theme' : 'Switch to dark forest theme'}
            aria-label="Toggle theme"
          >
            <span className="md:hidden lg:inline text-[11px] font-medium">
              {darkMode ? 'Warm linen mode' : 'Dark forest mode'}
            </span>
            {darkMode ? (
              <svg className="w-3.5 h-3.5 text-[#DDB045]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg className="w-3.5 h-3.5 text-[#97A8A0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </aside>

      {/* Main Command Centre Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Bar with Comfortable Spacing, Baseline Alignment & Clean Action Hub */}
        <header className="h-16 min-h-[64px] px-4 sm:px-6 lg:px-8 py-3.5 bg-[#FFFFFF] dark:bg-[#182622] border-b border-[#DCE2DB] dark:border-[#283C35] flex items-center justify-between gap-4 shrink-0 z-30 shadow-2xs">
          {/* Left: Hamburger + Page Title + Audit Run ID neatly aligned */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded text-[#66736C] hover:text-[#202824] dark:hover:text-white hover:bg-[#ECEBE4] dark:hover:bg-[#202F2A] focus:outline-none transition-colors shrink-0"
              aria-label="Open sidebar navigation"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-[#202824] dark:text-[#E8EBE9] tracking-tight truncate leading-tight">
                {currentTitle}
              </h1>

              {result?.run_id && (
                <span
                  title="Current Audit Run Identifier"
                  className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] text-[#66736C] dark:text-[#95A69E] bg-[#ECEBE4] dark:bg-[#111B18] px-2.5 py-1 rounded border border-[#DCE2DB] dark:border-[#283C35] leading-none shrink-0"
                >
                  <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-[#97A8A0]">Run</span>
                  <span className="font-semibold text-[#202824] dark:text-[#E8EBE9]">{result.run_id}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right Action Hub: Cleanly Aligned Actions with Generous Breathing Room */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
            {/* Download HTML (Secondary) */}
            <button
              type="button"
              onClick={() => handleDownloadReport('html')}
              disabled={isNoAuditData || htmlExporting}
              title="Download HTML audit executive report"
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors focus:outline-none focus:ring-1 focus:ring-[#147D68] cursor-pointer ${
                isNoAuditData
                  ? 'border-[#DCE2DB] dark:border-[#283C35] text-[#97A8A0] dark:text-[#6E827A] cursor-not-allowed bg-transparent'
                  : 'border-[#DCE2DB] dark:border-[#283C35] bg-[#FFFFFF] dark:bg-[#202F2A] text-[#202824] dark:text-[#E8EBE9] hover:bg-[#ECEBE4] dark:hover:bg-[#2D3E38] hover:border-[#A7C4B5]'
              }`}
            >
              {htmlExporting ? (
                <svg className="w-3.5 h-3.5 animate-spin text-[#147D68]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : exportSuccess === 'HTML' ? (
                <span className="text-[#39856A] font-bold">✓</span>
              ) : (
                <svg className="w-3.5 h-3.5 text-[#66736C] dark:text-[#95A69E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              <span className="hidden md:inline">Download HTML</span>
              <span className="md:hidden">HTML</span>
            </button>

            {/* Download JSON (Secondary) */}
            <button
              type="button"
              onClick={() => handleDownloadReport('json')}
              disabled={isNoAuditData || jsonExporting}
              title="Download raw JSON findings export"
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors focus:outline-none focus:ring-1 focus:ring-[#147D68] cursor-pointer ${
                isNoAuditData
                  ? 'border-[#DCE2DB] dark:border-[#283C35] text-[#97A8A0] dark:text-[#6E827A] cursor-not-allowed bg-transparent'
                  : 'border-[#DCE2DB] dark:border-[#283C35] bg-[#FFFFFF] dark:bg-[#202F2A] text-[#202824] dark:text-[#E8EBE9] hover:bg-[#ECEBE4] dark:hover:bg-[#2D3E38] hover:border-[#A7C4B5]'
              }`}
            >
              {jsonExporting ? (
                <svg className="w-3.5 h-3.5 animate-spin text-[#147D68]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : exportSuccess === 'JSON' ? (
                <span className="text-[#39856A] font-bold">✓</span>
              ) : (
                <svg className="w-3.5 h-3.5 text-[#66736C] dark:text-[#95A69E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              <span className="hidden md:inline">Download JSON</span>
              <span className="md:hidden">JSON</span>
            </button>

            {/* Run Audit (Primary Action) */}
            <button
              onClick={() => runAudit()}
              disabled={isLoading}
              title="Trigger a new non-human identity risk scan"
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#147D68] cursor-pointer ${
                isLoading
                  ? 'bg-[#ECEBE4] dark:bg-[#283C35] text-[#97A8A0] cursor-not-allowed'
                  : 'bg-[#147D68] hover:bg-[#0E6150] text-white active:scale-98'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-white shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Auditing…</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Run Audit</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Page Content Outlet (Independently scrollable) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#F5F4EF] dark:bg-[#111B18]">
          <Outlet context={{ auditResult: result, isLoading, runAudit }} />
        </main>
      </div>
    </div>
  );
};

export default Layout;
