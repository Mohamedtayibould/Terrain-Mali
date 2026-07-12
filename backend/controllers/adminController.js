const supabase = require('../config/supabase');

// ============ TERRAINS ============

const createTerrain = async (req, res) => {
  try {
    const {
      name, city, neighborhood, address, description,
      price_per_hour, orange_money_number, guardian_phone,
      latitude, longitude, opening_time, closing_time
    } = req.body;

    if (!name || !city || !neighborhood || !address || !price_per_hour || !orange_money_number || !guardian_phone) {
      return res.status(400).json({ error: 'Tous les champs obligatoires sont requis' });
    }

    const { data, error } = await supabase
      .from('terrains')
      .insert({
        name, city, neighborhood, address, description,
        price_per_hour, orange_money_number, guardian_phone,
        latitude, longitude,
        opening_time: opening_time || '08:00',
        closing_time: closing_time || '22:00',
        owner_id: req.user.id
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTerrain = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('terrains')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTerrain = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('terrains')
      .update({ is_active: false })
      .eq('id', id)
      .eq('owner_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Terrain desactive' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyTerrains = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('terrains')
      .select('*, terrain_photos(*)')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ PHOTOS ============

const addPhoto = async (req, res) => {
  try {
    const { terrain_id, photo_url, is_primary } = req.body;

    const { data: terrain } = await supabase
      .from('terrains')
      .select('owner_id')
      .eq('id', terrain_id)
      .single();

    if (!terrain || terrain.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorise' });
    }

    if (is_primary) {
      await supabase
        .from('terrain_photos')
        .update({ is_primary: false })
        .eq('terrain_id', terrain_id);
    }

    const { data, error } = await supabase
      .from('terrain_photos')
      .insert({ terrain_id, photo_url, is_primary: is_primary || false })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('terrain_photos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Photo supprimee' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ RESERVATIONS (only for this admin's terrains) ============

const getMyReservations = async (req, res) => {
  try {
    const { status, date } = req.query;

    const { data: myTerrains } = await supabase
      .from('terrains')
      .select('id')
      .eq('owner_id', req.user.id);

    const terrainIds = myTerrains?.map(t => t.id) || [];

    if (terrainIds.length === 0) return res.json([]);

    let query = supabase
      .from('reservations')
      .select('*, terrain:terrains(name, city)')
      .in('terrain_id', terrainIds)
      .order('reservation_date', { ascending: false });

    if (status) query = query.eq('status', status);
    if (date) query = query.eq('reservation_date', date);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ PAYMENTS (only for this admin's terrains) ============

const getMyPayments = async (req, res) => {
  try {
    const { status } = req.query;

    const { data: myTerrains } = await supabase
      .from('terrains')
      .select('id')
      .eq('owner_id', req.user.id);

    const terrainIds = myTerrains?.map(t => t.id) || [];
    if (terrainIds.length === 0) return res.json([]);

    const { data: myReservations } = await supabase
      .from('reservations')
      .select('id')
      .in('terrain_id', terrainIds);

    const reservationIds = myReservations?.map(r => r.id) || [];
    if (reservationIds.length === 0) return res.json([]);

    let query = supabase
      .from('payments')
      .select('*, reservation:reservations(terrain:terrains(name, city), reservation_date, start_time, end_time)')
      .in('reservation_id', reservationIds)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ STATS (only for this admin's terrains) ============

const getMyStats = async (req, res) => {
  try {
    const { data: myTerrains } = await supabase
      .from('terrains')
      .select('id')
      .eq('owner_id', req.user.id);

    const terrainIds = myTerrains?.map(t => t.id) || [];

    const { count: terrainsCount } = await supabase
      .from('terrains')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', req.user.id)
      .eq('is_active', true);

    const { data: reservations } = await supabase
      .from('reservations')
      .select('id, status')
      .in('terrain_id', terrainIds);

    const terrainSet = new Set(terrainIds);
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, reservation_id')
      .eq('status', 'successful');

    const { data: allResForPayments } = await supabase
      .from('reservations')
      .select('id')
      .in('terrain_id', terrainIds);

    const myReservationIds = new Set(allResForPayments?.map(r => r.id) || []);
    const myPayments = payments?.filter(p => myReservationIds.has(p.reservation_id)) || [];
    const totalRevenue = myPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    res.json({
      terrains_count: terrainsCount || 0,
      reservations_count: reservations?.length || 0,
      confirmed_reservations: reservations?.filter(r => r.status === 'confirmed').length || 0,
      total_revenue: totalRevenue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createTerrain, updateTerrain, deleteTerrain, getMyTerrains,
  addPhoto, deletePhoto,
  getMyReservations, getMyPayments, getMyStats
};
