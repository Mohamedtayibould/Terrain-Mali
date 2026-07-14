import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { FiPlus, FiEdit, FiTrash2, FiMapPin, FiDollarSign, FiLoader, FiGrid, FiList, FiLogOut, FiHome, FiCheckCircle, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('terrains');
  const [stats, setStats] = useState(null);
  const [terrains, setTerrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile, logout } = useAuth();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [s, t] = await Promise.all([api.get('/admin/stats'), api.get('/admin/terrains')]);
      setStats(s.data); setTerrains(t.data);
    } catch (err) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Desactiver ce terrain ?')) return;
    try { await api.delete(`/admin/terrains/${id}`); toast.success('Desactive'); fetchAll(); } catch { toast.error('Erreur'); }
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-900"><FiLoader className="animate-spin text-orange-500 text-4xl" /></div>;

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <aside className="w-64 bg-gray-950 text-white flex flex-col fixed h-full z-10">
        <div className="p-5 border-b border-gray-800"><h2 className="text-lg font-bold text-orange-500">Terrain Mali</h2><p className="text-xs text-gray-400 mt-1">Admin</p></div>
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center font-bold text-sm">{profile?.full_name?.charAt(0) || 'A'}</div>
            <div className="min-w-0"><p className="text-sm font-medium truncate">{profile?.full_name || 'Admin'}</p><p className="text-xs text-gray-400 truncate">{profile?.email}</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[{ id: 'terrains', label: 'Mes Terrains', icon: FiGrid, count: terrains.length }, { id: 'stats', label: 'Statistiques', icon: FiList }].map(item => {
            const Icon = item.icon;
            return <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}><Icon size={18} /><span className="flex-1 text-left">{item.label}</span>{item.count !== undefined && <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === item.id ? 'bg-orange-700' : 'bg-gray-800'}`}>{item.count}</span>}</button>;
          })}
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-1">
          <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white"><FiHome size={18} />Site client</a>
          <button onClick={() => { logout(); window.location.href = '/'; }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:bg-red-900/30 hover:text-red-400"><FiLogOut size={18} />Deconnexion</button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Tableau de bord</h1></div>
          <Link to="/terrain/new" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"><FiPlus />Ajouter</Link>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><div className="flex items-center gap-3"><div className="bg-blue-500/20 p-3 rounded-lg"><FiMapPin className="text-blue-400 text-xl" /></div><div><div className="text-2xl font-bold text-white">{stats.terrains_count}</div><div className="text-xs text-gray-400">Terrains</div></div></div></div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><div className="flex items-center gap-3"><div className="bg-green-500/20 p-3 rounded-lg"><FiCheckCircle className="text-green-400 text-xl" /></div><div><div className="text-2xl font-bold text-white">{stats.confirmed_reservations}</div><div className="text-xs text-gray-400">Confirmees</div></div></div></div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><div className="flex items-center gap-3"><div className="bg-yellow-500/20 p-3 rounded-lg"><FiClock className="text-yellow-400 text-xl" /></div><div><div className="text-2xl font-bold text-white">{stats.reservations_count}</div><div className="text-xs text-gray-400">Total</div></div></div></div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><div className="flex items-center gap-3"><div className="bg-orange-500/20 p-3 rounded-lg"><FiDollarSign className="text-orange-400 text-xl" /></div><div><div className="text-2xl font-bold text-white">{stats.total_revenue?.toLocaleString()} XOF</div><div className="text-xs text-gray-400">Revenu</div></div></div></div>
          </div>
        )}

        {activeTab === 'terrains' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {terrains.length === 0 ? (
              <div className="p-12 text-center"><FiMapPin className="mx-auto text-gray-600 text-5xl mb-4" /><h3 className="text-lg font-semibold text-gray-400">Aucun terrain</h3><Link to="/terrain/new" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm font-medium mt-4"><FiPlus />Ajouter</Link></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900"><tr><th className="text-left px-5 py-3 font-medium text-gray-400">Terrain</th><th className="text-left px-5 py-3 font-medium text-gray-400">Ville</th><th className="text-left px-5 py-3 font-medium text-gray-400">Prix/h</th><th className="text-left px-5 py-3 font-medium text-gray-400">Statut</th><th className="text-right px-5 py-3 font-medium text-gray-400">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-700">
                    {terrains.map(t => (
                      <tr key={t.id} className="hover:bg-gray-750">
                        <td className="px-5 py-4 font-medium text-white">{t.name}</td>
                        <td className="px-5 py-4 text-gray-300">{t.city}</td>
                        <td className="px-5 py-4"><span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs">{t.price_per_hour} XOF</span></td>
                        <td className="px-5 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${t.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{t.is_active ? 'Actif' : 'Inactif'}</span></td>
                        <td className="px-5 py-4"><div className="flex justify-end gap-2"><Link to={`/terrain/${t.id}/edit`} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"><FiEdit size={16} /></Link><button onClick={() => handleDelete(t.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><FiTrash2 size={16} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-white font-semibold mb-4">Resume</h3>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-gray-400">Terrains actifs</span><span className="text-white font-bold">{stats.terrains_count}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Reservations</span><span className="text-white font-bold">{stats.reservations_count}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Confirmees</span><span className="text-green-400 font-bold">{stats.confirmed_reservations}</span></div>
              <div className="border-t border-gray-700 pt-4 flex justify-between"><span className="text-gray-400">Revenu total</span><span className="text-orange-400 font-bold text-xl">{stats.total_revenue?.toLocaleString()} XOF</span></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
