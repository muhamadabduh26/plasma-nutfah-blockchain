import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RegistrasiVarietas from './pages/RegistrasiVarietas';

import Sertifikat from './pages/Sertifikat';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import AuditBlockchain from './pages/AuditBlockchain';
import Profile from './pages/Profile';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Jika rolenya tidak diizinkan, arahkan kembali ke dashboard utama mereka
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppContent() {
  return (
    <Layout>
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Rute Terproteksi */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['peneliti', 'validator_admin', 'validator_substantif', 'validator_final', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrasi"
          element={
            <ProtectedRoute allowedRoles={['peneliti', 'validator_admin', 'validator_substantif', 'validator_final', 'admin']}>
              <RegistrasiVarietas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sertifikat"
          element={
            <ProtectedRoute allowedRoles={['peneliti', 'validator_admin', 'validator_substantif', 'validator_final', 'admin']}>
              <Sertifikat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['peneliti', 'validator_admin', 'validator_substantif', 'validator_final', 'admin']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Rute Super Admin */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/transactions"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditBlockchain />
            </ProtectedRoute>
          }
        />

        {/* Fallback ke landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
