const supabase = require('../config/supabase');

const createReservation = async (req, res) => {
  try {
    const { terrain_id, reservation_date, start_time, end_time } = req.body;
    const user_id = req.user.id;

    if (!terrain_id || !reservation_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Check slot availability
    const { data: isAvailable } = await supabase
      .rpc('check_slot_availability', {
        p_terrain_id: terrain_id,
        p_date: reservation_date,
        p_start_time: start_time,
        p_end_time: end_time
      });

    if (!isAvailable) {
      return res.status(409).json({ error: 'Ce creneau est deja reserve' });
    }

    // Get terrain info for price calculation
    const { data: terrain } = await supabase
      .from('terrains')
      .select('*')
      .eq('id', terrain_id)
      .single();

    if (!terrain) {
      return res.status(404).json({ error: 'Terrain non trouve' });
    }

    // Calculate duration and total
    const start = new Date(`1970-01-01T${start_time}`);
    const end = new Date(`1970-01-01T${end_time}`);
    const durationHours = (end - start) / (1000 * 60 * 60);
    const totalAmount = durationHours * terrain.price_per_hour;

    // Generate payment reference
    const paymentRef = `TM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create reservation (pending)
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert({
        terrain_id,
        user_id,
        reservation_date,
        start_time,
        end_time,
        duration_hours: durationHours,
        total_amount: totalAmount,
        status: 'pending',
        payment_reference: paymentRef,
        payment_status: 'unpaid'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ce creneau est deja reserve' });
      }
      throw error;
    }

    res.status(201).json({
      reservation,
      terrain,
      total_amount: totalAmount,
      duration_hours: durationHours
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyReservations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, terrain:terrains(*, terrain_photos(*))')
      .eq('user_id', req.user.id)
      .order('reservation_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*, terrain:terrains(*)')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !reservation) {
      return res.status(404).json({ error: 'Reservation non trouvee' });
    }

    if (reservation.status === 'confirmed' && reservation.payment_status === 'paid') {
      return res.status(400).json({ error: 'Impossible d\'annuler une reservation payee' });
    }

    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Reservation annulee' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createReservation, getMyReservations, cancelReservation };
