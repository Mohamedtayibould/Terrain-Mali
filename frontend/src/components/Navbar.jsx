import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { FiMenu, FiX, FiUser, FiLogOut, FiCalendar, FiMapPin } from 'react-icons/fi';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <FiMapPin className="text-orange-600 text-2xl" />
            <span className="text-xl font-bold text-gray-900">Terrain <span className="text-orange-600">Mali</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-orange-600 transition-colors font-medium">
              Accueil
            </Link>
            {user && (
              <Link to="/mes-reservations" className="text-gray-600 hover:text-orange-600 transition-colors font-medium">
                Mes Reservations
              </Link>
            )}
            {profile?.role === 'admin' && (
              <a href="/admin.html" className="text-gray-600 hover:text-orange-600 transition-colors font-medium">
                Administration
              </a>
            )}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiUser />
                  <span>{profile?.full_name || user.email}</span>
                </div>
                <button onClick={logout} className="text-gray-500 hover:text-red-600 transition-colors" title="Deconnexion">
                  <FiLogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">
                  Connexion
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  Inscription
                </Link>
              </div>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-600">
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-3 space-y-3">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-orange-600 font-medium">
              Accueil
            </Link>
            {user && (
              <Link to="/mes-reservations" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-orange-600 font-medium">
                Mes Reservations
              </Link>
            )}
            {profile?.role === 'admin' && (
              <a href="/admin.html" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-orange-600 font-medium">
                Administration
              </a>
            )}
            {user ? (
              <>
                <div className="text-sm text-gray-500">{profile?.full_name || user.email}</div>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="text-red-600 font-medium">
                  Deconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-orange-600 font-medium">
                  Connexion
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block btn-primary text-center text-sm py-2">
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
