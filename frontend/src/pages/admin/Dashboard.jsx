import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  FiPlus, FiEdit, FiTrash2, FiCalendar, FiDollarSign, FiMapPin,
  FiUsers, FiLoader, FiGrid, FiList, FiLogOut, FiHome, FiImage,
  FiChevronRight, FiCheckCircle, FiClock, FiXCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('terrains');
  const [stats, setStats] = useState(null);
  const [terrains, setTerrains] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, terrainsRes, reservationsRes, paymentsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/terrains'),
        api.get('/admin/reservations'),
        api.get('/admin/payments')
      ]);
      setStats(statsRes.data);
      setTerrains(terrainsRes.data);
      setReservations(reservationsRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const deleteTerrain = async (id) => {
    if (!window.confirm('Desactiver ce terrain ?')) return;
    try {
      await api.delete(`/admin/terrains/${id}`);
      toast.success('Terrain desactive');
      fetchAll();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const menuItems = [
    { id: 'terrains', label: 'Mes Terrains', icon: FiGrid, count: terrains.length },
    { id: 'reservations', label: 'Reservations', icon: FiCalendar, count: reservations.length },
    { id: 'payments', label: 'Paiements', icon: FiDollarSign, count: payments.length },
    { id: 'stats', label: 'Statistiques', icon: FiList },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <FiLoader className="animate-spin text-orange-500 text-4xl" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 text-white flex flex-col fixed h-full z-10">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-orange-500">Terrain Mali</h2>
          <p className="text-xs text-gray-400 mt-1">Espace Administrateur</p>
        </div>

        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center font-bold text-sm">
              {profile?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === item.id ? 'bg-orange-700' : 'bg-gray-800'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-800 space-y-1">
          <a
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <FiHome size={18} />
            Voir le site client
          </a>
          <button
            onClick={() => { logout(); window.location.href = '/'; }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
          >
            <FiLogOut size={18} />
            Deconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {activeTab === 'terrains' && (
            <Link to="/terrain/new" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
              <FiPlus /> Ajouter un terrain
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-3 rounded-lg"><FiMapPin className="text-blue-400 text-xl" /></div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.terrains_count}</div>
                  <div className="text-xs text-gray-400">Terrains actifs</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-3 rounded-lg"><FiCheckCircle className="text-green-400 text-xl" /></div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.confirmed_reservations}</div>
                  <div className="text-xs text-gray-400">Confirmees</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500/20 p-3 rounded-lg"><FiClock className="text-yellow-400 text-xl" /></div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.reservations_count}</div>
                  <div className="text-xs text-gray-400">Total reservations</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 p-3 rounded-lg"><FiDollarSign className="text-orange-400 text-xl" /></div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.total_revenue?.toLocaleString()} XOF</div>
                  <div className="text-xs text-gray-400">Revenu total</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TERRAINS TAB */}
        {activeTab === 'terrains' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {terrains.length === 0 ? (
              <div className="p-12 text-center">
                <FiMapPin className="mx-auto text-gray-600 text-5xl mb-4" />
                <h3 className="text-lg font-semibold text-gray-400">Aucun terrain</h3>
                <p className="text-gray-500 text-sm mt-1 mb-4">Ajoutez votre premier terrain pour commencer</p>
                <Link to="/terrain/new" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm font-medium">
                  <FiPlus /> Ajouter un terrain
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Terrain</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Ville / Quartier</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Prix / h</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Horaires</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Statut</th>
                      <th className="text-right px-5 py-3 font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {terrains.map(t => (
                      <tr key={t.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">{t.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{t.address}</div>
                        </td>
                        <td className="px-5 py-4 text-gray-300">{t.city} - {t.neighborhood}</td>
                        <td className="px-5 py-4">
                          <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs font-medium">
                            {t.price_per_hour} XOF
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {t.opening_time?.substring(0, 5)} - {t.closing_time?.substring(0, 5)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            t.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {t.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link to={`/terrain/${t.id}/edit`} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors">
                              <FiEdit size={16} />
                            </Link>
                            <button onClick={() => deleteTerrain(t.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* RESERVATIONS TAB */}
        {activeTab === 'reservations' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {reservations.length === 0 ? (
              <div className="p-12 text-center">
                <FiCalendar className="mx-auto text-gray-600 text-5xl mb-4" />
                <h3 className="text-lg font-semibold text-gray-400">Aucune reservation</h3>
                <p className="text-gray-500 text-sm mt-1">Les reservations apparaitront ici</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Client</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Terrain</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Date</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Heure</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Montant</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {reservations.map(r => (
                      <tr key={r.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-5 py-4">
                          <div className="text-white">{r.user?.full_name || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{r.user?.phone}</div>
                        </td>
                        <td className="px-5 py-4 text-gray-300">{r.terrain?.name}</td>
                        <td className="px-5 py-4 text-gray-300">{r.reservation_date}</td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {r.start_time?.substring(0, 5)} - {r.end_time?.substring(0, 5)}
                        </td>
                        <td className="px-5 py-4 font-medium text-orange-400">{r.total_amount} XOF</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            r.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            r.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {r.status === 'confirmed' ? 'Confirmee' : r.status === 'pending' ? 'En attente' : 'Annulee'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {payments.length === 0 ? (
              <div className="p-12 text-center">
                <FiDollarSign className="mx-auto text-gray-600 text-5xl mb-4" />
                <h3 className="text-lg font-semibold text-gray-400">Aucun paiement</h3>
                <p className="text-gray-500 text-sm mt-1">Les paiements apparaitront ici</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Client</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Montant</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Reference</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Statut</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-5 py-4 text-white">{p.user?.full_name || 'N/A'}</td>
                        <td className="px-5 py-4 font-medium text-orange-400">{p.amount} {p.currency}</td>
                        <td className="px-5 py-4 text-xs font-mono text-gray-400">{p.provider_transaction_id || 'N/A'}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            p.status === 'successful' ? 'bg-green-500/20 text-green-400' :
                            p.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {p.status === 'successful' ? 'Reussi' : p.status === 'failed' ? 'Echoue' : 'En attente'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400">
                          {new Date(p.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-white font-semibold mb-4">Resume</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Terrains actifs</span>
                  <span className="text-white font-bold text-xl">{stats.terrains_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Reservations totales</span>
                  <span className="text-white font-bold text-xl">{stats.reservations_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Reservations confirmees</span>
                  <span className="text-green-400 font-bold text-xl">{stats.confirmed_reservations}</span>
                </div>
                <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
                  <span className="text-gray-400">Revenu total</span>
                  <span className="text-orange-400 font-bold text-2xl">{stats.total_revenue?.toLocaleString()} XOF</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-white font-semibold mb-4">Apercu rapide</h3>
              <div className="space-y-3">
                <Link to="/terrain/new" className="block bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-sm font-medium text-center transition-colors">
                  + Ajouter un nouveau terrain
                </Link>
                <a href="/" className="block bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg text-sm font-medium text-center transition-colors">
                  Voir le site client
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
