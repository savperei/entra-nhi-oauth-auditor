import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { IdentityList } from './pages/IdentityList';
import { IdentityDetail } from './pages/IdentityDetail';
import { Findings } from './pages/Findings';
import { HowItWorks } from './pages/HowItWorks';
import { SetupConfig } from './pages/SetupConfig';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/identities" element={<IdentityList />} />
            <Route path="/identities/:id" element={<IdentityDetail />} />
            <Route path="/findings" element={<Findings />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/setup" element={<SetupConfig />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
