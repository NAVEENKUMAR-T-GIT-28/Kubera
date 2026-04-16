import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getToken } from './api';

import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import HomePage      from './pages/HomePage';
import PayPage       from './pages/PayPage';
import HistoryPage   from './pages/HistoryPage';
import CardPage      from './pages/CardPage';
import InvestmentPage from './pages/InvestmentPage';
import SettingsPage  from './pages/SettingsPage';
import BottomNav     from './components/BottomNav';

function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

function WithNav({ children }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

export default function App() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  return (
    <BrowserRouter>
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="mi mi-sm">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
          {toast.message}
        </div>
      )}

      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage    showToast={showToast} />} />
        <Route path="/register" element={<RegisterPage showToast={showToast} />} />

        {/* Protected — WITH bottom nav */}
        <Route path="/" element={<Protected><WithNav><HomePage showToast={showToast} /></WithNav></Protected>} />
        <Route path="/history" element={<Protected><WithNav><HistoryPage /></WithNav></Protected>} />
        <Route path="/cards"   element={<Protected><WithNav><CardPage   showToast={showToast} /></WithNav></Protected>} />
        <Route path="/invest"  element={<Protected><WithNav><InvestmentPage showToast={showToast} /></WithNav></Protected>} />
        <Route path="/settings" element={<Protected><WithNav><SettingsPage showToast={showToast} /></WithNav></Protected>} />

        {/* Pay page — full screen, NO bottom nav (flow replaces it) */}
        <Route path="/pay" element={<Protected><PayPage showToast={showToast} /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
