import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiDownload, FiHome, FiMapPin, FiCalendar, FiClock, FiDollarSign, FiHash } from 'react-icons/fi';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function Confirmation() {
  const [searchParams] = useSearchParams();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestReservation();
  }, []);

  const fetchLatestReservation = async () => {
    try {
      const { data } = await api.get('/reservations/my');
      const confirmed = data.find(r => r.status === 'confirmed' || r.payment_status === 'paid');
      if (confirmed) {
        setReservation(confirmed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async () => {
    if (!reservation) return;
    try {
      const response = await api.get(`/payments/receipt/${reservation.id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recu-${reservation.payment_reference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Erreur lors du telechargement du recu');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Aucune reservation confirmee</h2>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <FiHome /> Retour a l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <FiCheckCircle className="mx-auto text-green-500 text-6xl mb-4" />
        <h1 className="text-2xl font-bold text-green-600">Reservation confirmee!</h1>
        <p className="text-gray-500 mt-2">Votre reservation a ete confirmee avec succes.</p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Details de la reservation</h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <FiMapPin className="text-orange-600" />
            <div>
              <div className="text-sm text-gray-500">Terrain</div>
              <div className="font-medium">{reservation.terrain?.name || 'N/A'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FiMapPin className="text-orange-600" />
            <div>
              <div className="text-sm text-gray-500">Ville</div>
              <div className="font-medium">{reservation.terrain?.city || 'N/A'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FiCalendar className="text-orange-600" />
            <div>
              <div className="text-sm text-gray-500">Date</div>
              <div className="font-medium">{reservation.reservation_date}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FiClock className="text-orange-600" />
            <div>
              <div className="text-sm text-gray-500">Heure</div>
              <div className="font-medium">{reservation.start_time?.substring(0, 5)} - {reservation.end_time?.substring(0, 5)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FiDollarSign className="text-orange-600" />
            <div>
              <div className="text-sm text-gray-500">Montant paye</div>
              <div className="font-bold text-lg text-orange-600">{reservation.total_amount} XOF</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FiHash className="text-orange-600" />
            <div>
              <div className="text-sm text-gray-500">Reference de transaction</div>
              <div className="font-medium text-sm">{reservation.payment_reference}</div>
            </div>
          </div>

          <div className="border-t pt-3 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Statut:</span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                Paye
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button onClick={downloadReceipt} className="btn-secondary w-full flex items-center justify-center gap-2">
            <FiDownload />
            Telecharger le recu PDF
          </button>
          <Link to="/" className="btn-primary w-full text-center flex items-center justify-center gap-2">
            <FiHome />
            Retour a l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
