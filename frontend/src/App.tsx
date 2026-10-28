import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { IdentityList } from './pages/IdentityList';
import { IdentityDetail } from './pages/IdentityDetail';
import { FindingsPage } from './pages/FindingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/identities" element={<IdentityList />} />
          <Route path="/identities/:id" element={<IdentityDetail />} />
          <Route path="/findings" element={<FindingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
