const supabase = require('../config/supabase');

const getTerrains = async (req, res) => {
  try {
    const { city, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('terrains')
      .select('*, terrain_photos(*)', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,neighborhood.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      terrains: data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTerrainById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('terrains')
      .select('*, terrain_photos(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Terrain non trouve' });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCities = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('terrains')
      .select('city')
      .eq('is_active', true);

    if (error) throw error;

    const cities = [...new Set(data.map(t => t.city))].sort();
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date requise' });
    }

    const { data, error } = await supabase
      .rpc('get_available_slots', {
        p_terrain_id: id,
        p_date: date
      });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getTerrains, getTerrainById, getCities, getAvailableSlots };
