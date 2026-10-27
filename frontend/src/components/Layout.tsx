import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 text-center font-medium">
        Running in <strong>Safe Synthetic Data Mode</strong>. No live Microsoft Entra ID or external OAuth connections are made.
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Entra Non-Human Identity and OAuth Integration Risk Auditor &bull; Synthetic Demo
      </footer>
    </div>
  );
};

