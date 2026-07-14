import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import Calendar from '../components/Calendar';
import { FiCreditCard, FiLoader, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Reservation() {
  const { terrainId } = useParams();
  const navigate = useNavigate();
  const [terrain, setTerrain] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api.get(`/terrains/${terrainId}`).then(({ data }) => setTerrain(data)).catch(() => { toast.error('Terrain non trouve'); navigate('/'); }).finally(() => setLoading(false));
  }, [terrainId]);

  useEffect(() => {
    if (selectedDate) {
      api.get(`/terrains/${terrainId}/slots`, { params: { date: selectedDate } })
        .then(({ data }) => { setSlots(data); setSelectedSlot(null); })
        .catch(() => toast.error('Erreur creneaux'));
    }
  }, [selectedDate, terrainId]);

  const calculateAmount = () => {
    if (!selectedSlot || !terrain) return 0;
    const start = new Date(`1970-01-01T${selectedSlot.slot_start}`);
    const end = new Date(`1970-01-01T${selectedSlot.slot_end}`);
    return ((end - start) / 3600000) * terrain.price_per_hour;
  };

  const handlePayment = async () => {
    if (!selectedSlot) return toast.error('Choisissez un creneau');
    if (!phoneNumber) return toast.error('Entrez votre numero Orange Money');
    setPaying(true);
    try {
      const { data: resData } = await api.post('/reservations', { terrain_id: terrainId, reservation_date: selectedDate, start_time: selectedSlot.slot_start, end_time: selectedSlot.slot_end });
      await api.post('/payments/pay', { reservation_id: resData.reservation.id, phone_number: phoneNumber });
      toast.success('Reservation creee !');
      navigate('/confirmation');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><FiLoader className="animate-spin text-orange-600 text-4xl" /></div>;
  if (!terrain) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to={`/terrain/${terrainId}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6"><FiArrowLeft />Retour au terrain</Link>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reservation</h1>
        <p className="text-gray-500 mb-6">{terrain.name} - {terrain.city}</p>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Choisissez la date</h2>
          <Calendar slots={slots} selectedDate={selectedDate} onDateSelect={setSelectedDate} selectedSlot={selectedSlot} onSlotSelect={setSelectedSlot} />
        </div>
        {selectedSlot && (
          <div className="bg-orange-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-orange-800 mb-2">Resume</h3>
            <div className="space-y-1 text-sm text-orange-700">
              <div>Date: <span className="font-medium">{selectedDate}</span></div>
              <div>Heure: <span className="font-medium">{selectedSlot.slot_start?.substring(0,5)} - {selectedSlot.slot_end?.substring(0,5)}</span></div>
              <div>Prix horaire: <span className="font-medium">{terrain.price_per_hour} XOF</span></div>
              <div className="border-t border-orange-200 pt-2 mt-2"><span className="text-lg font-bold">Total: {calculateAmount()} XOF</span></div>
            </div>
          </div>
        )}
        {selectedSlot && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Paiement Orange Money</h2>
            <div className="space-y-4">
              <div><label className="label">Numero Orange Money</label><input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="input-field" placeholder="Votre numero" required /></div>
              <button onClick={handlePayment} disabled={paying || !phoneNumber} className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4">
                {paying ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><FiCreditCard />Payer {calculateAmount()} XOF</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
