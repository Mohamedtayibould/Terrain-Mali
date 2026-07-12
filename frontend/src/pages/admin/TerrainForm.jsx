import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import { FiSave, FiArrowLeft, FiImage, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TerrainForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [form, setForm] = useState({
    name: '', city: '', neighborhood: '', address: '',
    description: '', price_per_hour: '', orange_money_number: '',
    guardian_phone: '', latitude: '', longitude: '',
    opening_time: '08:00', closing_time: '22:00'
  });

  useEffect(() => {
    if (isEdit) fetchTerrain();
  }, [id]);

  const fetchTerrain = async () => {
    try {
      const { data } = await api.get('/admin/terrains');
      const terrain = data.find(t => t.id === id);
      if (terrain) {
        setForm({
          name: terrain.name || '',
          city: terrain.city || '',
          neighborhood: terrain.neighborhood || '',
          address: terrain.address || '',
          description: terrain.description || '',
          price_per_hour: terrain.price_per_hour || '',
          orange_money_number: terrain.orange_money_number || '',
          guardian_phone: terrain.guardian_phone || '',
          latitude: terrain.latitude || '',
          longitude: terrain.longitude || '',
          opening_time: terrain.opening_time?.substring(0, 5) || '08:00',
          closing_time: terrain.closing_time?.substring(0, 5) || '22:00'
        });
      }
    } catch (err) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price_per_hour: parseFloat(form.price_per_hour),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null
      };

      if (isEdit) {
        await api.put(`/admin/terrains/${id}`, payload);
        toast.success('Terrain modifie!');
      } else {
        await api.post('/admin/terrains', payload);
        toast.success('Terrain cree!');
      }
      window.location.href = '/admin.html';
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const addPhoto = async () => {
    if (!photoUrl || !id) return;
    try {
      await api.post('/admin/photos', { terrain_id: id, photo_url: photoUrl });
      toast.success('Photo ajoutee!');
      setPhotoUrl('');
      fetchTerrain();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <FiLoader className="animate-spin text-orange-500 text-4xl" />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <a href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-500 mb-6 transition-colors">
          <FiArrowLeft /> Retour au tableau de bord
        </a>

        <h1 className="text-2xl font-bold text-white mb-6">
          {isEdit ? 'Modifier le terrain' : 'Ajouter un terrain'}
        </h1>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Nom du terrain *</label>
              <input name="name" value={form.name} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className={labelClass}>Ville *</label>
              <input name="city" value={form.city} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className={labelClass}>Quartier *</label>
              <input name="neighborhood" value={form.neighborhood} onChange={handleChange} className={inputClass} required />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Adresse *</label>
              <input name="address" value={form.address} onChange={handleChange} className={inputClass} required />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} className={inputClass} rows={3} />
            </div>

            <div>
              <label className={labelClass}>Prix par heure (XOF) *</label>
              <input name="price_per_hour" type="number" step="50" value={form.price_per_hour} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className={labelClass}>Numero Orange Money *</label>
              <input name="orange_money_number" value={form.orange_money_number} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className={labelClass}>Telephone du gardien *</label>
              <input name="guardian_phone" value={form.guardian_phone} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className={labelClass}>Heure d'ouverture</label>
              <input name="opening_time" type="time" value={form.opening_time} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Heure de fermeture</label>
              <input name="closing_time" type="time" value={form.closing_time} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Latitude GPS</label>
              <input name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} className={inputClass} placeholder="12.6392" />
            </div>

            <div>
              <label className={labelClass}>Longitude GPS</label>
              <input name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} className={inputClass} placeholder="-8.0029" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <a href="/" className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg text-center font-medium transition-colors">
              Annuler
            </a>
            <button type="submit" disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50">
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <FiSave />
                  {isEdit ? 'Modifier' : 'Creer le terrain'}
                </>
              )}
            </button>
          </div>
        </form>

        {isEdit && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mt-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FiImage className="text-orange-500" />
              Gestion des photos
            </h3>

            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="URL de la photo"
              />
              <button onClick={addPhoto} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                Ajouter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
