import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import TerrainForm from './pages/admin/TerrainForm';

function AdminGuard({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;
  if (!user || profile?.role !== 'admin') return <AdminLogin />;
  return children;
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={
            <AdminGuard>
              <Dashboard />
            </AdminGuard>
          } />
          <Route path="/terrain/new" element={
            <AdminGuard>
              <TerrainForm />
            </AdminGuard>
          } />
          <Route path="/terrain/:id/edit" element={
            <AdminGuard>
              <TerrainForm />
            </AdminGuard>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
