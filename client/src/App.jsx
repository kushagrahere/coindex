import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  const fetchMe = useAuthStore(s => s.fetchMe);

  // Restore session from localStorage on app load
  useEffect(() => { fetchMe(); }, [fetchMe]);

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
