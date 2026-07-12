import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TerrainDetail from './pages/TerrainDetail';
import Reservation from './pages/Reservation';
import Confirmation from './pages/Confirmation';
import MyReservations from './pages/MyReservations';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/terrain/:id" element={<TerrainDetail />} />
              <Route path="/reservation/:terrainId" element={
                <ProtectedRoute><Reservation /></ProtectedRoute>
              } />
              <Route path="/confirmation" element={
                <ProtectedRoute><Confirmation /></ProtectedRoute>
              } />
              <Route path="/mes-reservations" element={
                <ProtectedRoute><MyReservations /></ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
