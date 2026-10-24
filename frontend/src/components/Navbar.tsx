import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
    }`;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              E
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                Entra NHI &amp; OAuth Auditor
              </span>
              <span className="hidden md:inline-block ml-2 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 rounded">
                Synthetic Mode
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-2">
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/identities" className={navLinkClass}>
              Identities
            </NavLink>
            <NavLink to="/findings" className={navLinkClass}>
              Findings
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
};

