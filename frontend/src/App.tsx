import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { IdentitiesPage } from './pages/IdentitiesPage';
import { IdentityDetailPage } from './pages/IdentityDetailPage';
import { FindingsPage } from './pages/FindingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/identities" element={<IdentitiesPage />} />
          <Route path="/identities/:id" element={<IdentityDetailPage />} />
          <Route path="/findings" element={<FindingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

