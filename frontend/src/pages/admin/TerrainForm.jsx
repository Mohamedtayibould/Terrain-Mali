import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import { FiSave, FiArrowLeft, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TerrainForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', neighborhood: '', address: '', description: '', price_per_hour: '', orange_money_number: '', guardian_phone: '', latitude: '', longitude: '', opening_time: '08:00', closing_time: '22:00' });

  useEffect(() => {
    if (isEdit) {
      api.get('/admin/terrains').then(({ data }) => {
        const t = data.find(terr => terr.id === id);
        if (t) setForm({ name: t.name||'', city: t.city||'', neighborhood: t.neighborhood||'', address: t.address||'', description: t.description||'', price_per_hour: t.price_per_hour||'', orange_money_number: t.orange_money_number||'', guardian_phone: t.guardian_phone||'', latitude: t.latitude||'', longitude: t.longitude||'', opening_time: t.opening_time?.substring(0,5)||'08:00', closing_time: t.closing_time?.substring(0,5)||'22:00' });
      }).catch(() => toast.error('Erreur')).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, price_per_hour: parseFloat(form.price_per_hour), latitude: form.latitude ? parseFloat(form.latitude) : null, longitude: form.longitude ? parseFloat(form.longitude) : null };
      if (isEdit) { await api.put(`/admin/terrains/${id}`, payload); toast.success('Modifie !'); }
      else { await api.post('/admin/terrains', payload); toast.success('Cree !'); }
      window.location.href = '/admin.html';
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-900"><FiLoader className="animate-spin text-orange-500 text-4xl" /></div>;
  const ic = "w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none";
  const lc = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <a href="/admin.html" className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-500 mb-6"><FiArrowLeft />Retour</a>
        <h1 className="text-2xl font-bold text-white mb-6">{isEdit ? 'Modifier' : 'Ajouter'} un terrain</h1>
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className={lc}>Nom *</label><input name="name" value={form.name} onChange={handleChange} className={ic} required /></div>
            <div><label className={lc}>Ville *</label><input name="city" value={form.city} onChange={handleChange} className={ic} required /></div>
            <div><label className={lc}>Quartier *</label><input name="neighborhood" value={form.neighborhood} onChange={handleChange} className={ic} required /></div>
            <div className="sm:col-span-2"><label className={lc}>Adresse *</label><input name="address" value={form.address} onChange={handleChange} className={ic} required /></div>
            <div className="sm:col-span-2"><label className={lc}>Description</label><textarea name="description" value={form.description} onChange={handleChange} className={ic} rows={3} /></div>
            <div><label className={lc}>Prix/heure (XOF) *</label><input name="price_per_hour" type="number" step="50" value={form.price_per_hour} onChange={handleChange} className={ic} required /></div>
            <div><label className={lc}>Num Orange Money *</label><input name="orange_money_number" value={form.orange_money_number} onChange={handleChange} className={ic} required /></div>
            <div><label className={lc}>Tel gardien *</label><input name="guardian_phone" value={form.guardian_phone} onChange={handleChange} className={ic} required /></div>
            <div><label className={lc}>Ouverture</label><input name="opening_time" type="time" value={form.opening_time} onChange={handleChange} className={ic} /></div>
            <div><label className={lc}>Fermeture</label><input name="closing_time" type="time" value={form.closing_time} onChange={handleChange} className={ic} /></div>
            <div><label className={lc}>Latitude</label><input name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} className={ic} /></div>
            <div><label className={lc}>Longitude</label><input name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} className={ic} /></div>
          </div>
          <div className="flex gap-3 pt-4">
            <a href="/admin.html" className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg text-center font-medium">Annuler</a>
            <button type="submit" disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium disabled:opacity-50">
              {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><FiSave />{isEdit ? 'Modifier' : 'Creer'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
