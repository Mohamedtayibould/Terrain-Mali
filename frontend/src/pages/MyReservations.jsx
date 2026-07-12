import { useState, useEffect } from 'react';
import api from '../api/client';
import { FiCalendar, FiMapPin, FiClock, FiCheckCircle, FiXCircle, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const { data } = await api.get('/reservations/my');
      setReservations(data);
    } catch (err) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (id) => {
    if (!window.confirm('Voulez-vous vraiment annuler cette reservation?')) return;
    try {
      await api.patch(`/reservations/${id}/cancel`);
      toast.success('Reservation annulee');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const downloadReceipt = async (reservationId) => {
    try {
      const response = await api.get(`/payments/receipt/${reservationId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recu-${reservationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Recu non disponible');
    }
  };

  const statusBadge = (status) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-700'
    };
    const labels = {
      confirmed: 'Confirmee',
      pending: 'En attente',
      cancelled: 'Annulee',
      expired: 'Expiree'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mes Reservations</h1>

      {reservations.length === 0 ? (
        <div className="text-center py-12">
          <FiCalendar className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Aucune reservation</h3>
          <p className="text-gray-500 mt-2">Vous n'avez pas encore fait de reservation</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FiMapPin className="text-orange-600" />
                    <span className="font-semibold">{r.terrain?.name || 'Terrain'}</span>
                    <span className="text-gray-400">-</span>
                    <span className="text-gray-500 text-sm">{r.terrain?.city}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiCalendar size={14} />
                      {r.reservation_date}
                    </div>
                    <div className="flex items-center gap-1">
                      <FiClock size={14} />
                      {r.start_time?.substring(0, 5)} - {r.end_time?.substring(0, 5)}
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">{r.total_amount} XOF</span>
                    <span className="mx-2">|</span>
                    {statusBadge(r.status)}
                  </div>
                </div>

                <div className="flex gap-2">
                  {r.payment_status === 'paid' && (
                    <button
                      onClick={() => downloadReceipt(r.id)}
                      className="btn-secondary text-sm py-2 px-3 flex items-center gap-1"
                    >
                      <FiDownload size={14} />
                      Recu
                    </button>
                  )}
                  {(r.status === 'pending' || r.status === 'cancelled') && r.payment_status !== 'paid' && (
                    <button
                      onClick={() => cancelReservation(r.id)}
                      className="btn-danger text-sm py-2 px-3 flex items-center gap-1"
                    >
                      <FiXCircle size={14} />
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
