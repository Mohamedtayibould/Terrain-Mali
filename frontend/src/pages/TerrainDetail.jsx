import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import PhotoGallery from '../components/PhotoGallery';
import { FiMapPin, FiClock, FiPhone, FiDollarSign, FiNavigation, FiArrowLeft, FiLoader } from 'react-icons/fi';

export default function TerrainDetail() {
  const { id } = useParams();
  const [terrain, setTerrain] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/terrains/${id}`).then(({ data }) => setTerrain(data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><FiLoader className="animate-spin text-orange-600 text-4xl" /></div>;
  if (!terrain) return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <h2 className="text-2xl font-bold text-gray-600">Terrain non trouve</h2>
      <Link to="/" className="btn-primary inline-block mt-4">Retour</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6"><FiArrowLeft />Retour aux terrains</Link>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <PhotoGallery photos={terrain.terrain_photos} />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{terrain.name}</h1>
              <div className="flex items-center gap-1 text-gray-500 mt-1"><FiMapPin /><span>{terrain.address}, {terrain.neighborhood}, {terrain.city}</span></div>
            </div>
            <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-xl text-center">
              <div className="text-2xl font-bold">{terrain.price_per_hour} XOF</div>
              <div className="text-sm">par heure</div>
            </div>
          </div>
          {terrain.description && <div className="mb-6"><h3 className="font-semibold text-gray-800 mb-2">Description</h3><p className="text-gray-600">{terrain.description}</p></div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"><FiClock className="text-orange-600 text-xl" /><div><div className="text-sm text-gray-500">Horaires</div><div className="font-semibold">{terrain.opening_time?.substring(0,5)} - {terrain.closing_time?.substring(0,5)}</div></div></div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"><FiPhone className="text-orange-600 text-xl" /><div><div className="text-sm text-gray-500">Gardien</div><div className="font-semibold">{terrain.guardian_phone}</div></div></div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"><FiDollarSign className="text-orange-600 text-xl" /><div><div className="text-sm text-gray-500">Orange Money</div><div className="font-semibold">{terrain.orange_money_number}</div></div></div>
            {terrain.latitude && terrain.longitude && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"><FiNavigation className="text-orange-600 text-xl" /><div><div className="text-sm text-gray-500">GPS</div><a href={`https://www.google.com/maps?q=${terrain.latitude},${terrain.longitude}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-orange-600 hover:underline">Google Maps</a></div></div>
            )}
          </div>
          <Link to={`/reservation/${terrain.id}`} className="btn-primary w-full text-center text-lg py-4 flex items-center justify-center gap-2"><FiDollarSign />Reserver ce terrain</Link>
        </div>
      </div>
    </div>
  );
}
