import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiHome, FiMapPin, FiCalendar, FiClock, FiDollarSign, FiHash } from 'react-icons/fi';
import api from '../api/client';

export default function Confirmation() {
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reservations/my').then(({ data }) => {
      const found = data.find(r => r.status === 'confirmed' || r.payment_status === 'paid' || r.status === 'pending');
      if (found) setReservation(found);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;
  if (!reservation) return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <h2 className="text-2xl font-bold text-gray-600 mb-4">Aucune reservation trouvee</h2>
      <Link to="/" className="btn-primary inline-flex items-center gap-2"><FiHome />Retour</Link>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <FiCheckCircle className="mx-auto text-green-500 text-6xl mb-4" />
        <h1 className="text-2xl font-bold text-green-600">Reservation confirmee !</h1>
        <p className="text-gray-500 mt-2">Votre reservation a ete enregistree.</p>
      </div>
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Details</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3"><FiMapPin className="text-orange-600" /><div><div className="text-sm text-gray-500">Terrain</div><div className="font-medium">{reservation.terrain?.name || 'N/A'}</div></div></div>
          <div className="flex items-center gap-3"><FiMapPin className="text-orange-600" /><div><div className="text-sm text-gray-500">Ville</div><div className="font-medium">{reservation.terrain?.city || 'N/A'}</div></div></div>
          <div className="flex items-center gap-3"><FiCalendar className="text-orange-600" /><div><div className="text-sm text-gray-500">Date</div><div className="font-medium">{reservation.reservation_date}</div></div></div>
          <div className="flex items-center gap-3"><FiClock className="text-orange-600" /><div><div className="text-sm text-gray-500">Heure</div><div className="font-medium">{reservation.start_time?.substring(0,5)} - {reservation.end_time?.substring(0,5)}</div></div></div>
          <div className="flex items-center gap-3"><FiDollarSign className="text-orange-600" /><div><div className="text-sm text-gray-500">Montant</div><div className="font-bold text-lg text-orange-600">{reservation.total_amount} XOF</div></div></div>
          <div className="flex items-center gap-3"><FiHash className="text-orange-600" /><div><div className="text-sm text-gray-500">Reference</div><div className="font-medium text-sm">{reservation.payment_reference}</div></div></div>
        </div>
        <div className="mt-6"><Link to="/" className="btn-primary w-full text-center flex items-center justify-center gap-2"><FiHome />Retour a l'accueil</Link></div>
      </div>
    </div>
  );
}
