import axios from 'axios';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseRest = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    'apikey': supabaseAnonKey,
    'Content-Type': 'application/json'
  }
});

supabaseRest.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb-access-token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export async function fetchTerrains({ page = 1, limit = 12, city = '', search = '' } = {}) {
  let filters = 'is_active=eq.true';
  if (city) filters += `&city=ilike.*${encodeURIComponent(city)}*`;
  if (search) {
    filters += `&or=(name.ilike.*${encodeURIComponent(search)}*,neighborhood.ilike.*${encodeURIComponent(search)}*,address.ilike.*${encodeURIComponent(search)}*,city.ilike.*${encodeURIComponent(search)}*)`;
  }

  const offset = (page - 1) * limit;

  const [data, countRes] = await Promise.all([
    supabaseRest.get(`/terrains?select=*,terrain_photos(*)&${filters}&order=created_at.desc&offset=${offset}&limit=${limit}`),
    supabaseRest.get(`/terrains?select=id&${filters}`)
  ]);

  const total = Array.isArray(countRes.data) ? countRes.data.length : 0;
  return {
    terrains: data.data,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
}

export async function fetchTerrainById(id) {
  const { data } = await supabaseRest.get(`/terrains?select=*,terrain_photos(*)&id=eq.${id}`);
  return data?.[0] || null;
}

export async function fetchCities() {
  const { data } = await supabaseRest.get('/terrains?select=city&is_active=eq.true');
  return [...new Set(data.map(t => t.city))].sort();
}

export async function fetchSlots(terrainId, date) {
  try {
    const { data } = await supabaseRest.post('/rpc/get_available_slots', {
      p_terrain_id: terrainId,
      p_date: date
    });
    return data;
  } catch (err) {
    console.error('RPC error:', err);
    return [];
  }
}

export async function fetchMyReservations() {
  const token = localStorage.getItem('sb-access-token');
  if (!token) return [];
  const user = JSON.parse(localStorage.getItem('sb-user') || '{}');
  if (!user.id) return [];
  const { data } = await supabaseRest.get(`/reservations?select=*,terrain:terrains(*,terrain_photos(*))&user_id=eq.${user.id}&order=reservation_date.desc`);
  return data || [];
}

export async function createReservation(terrainId, date, startTime, endTime) {
  const user = JSON.parse(localStorage.getItem('sb-user') || '{}');
  if (!user.id) throw new Error('Non connecte');

  const terrains = await supabaseRest.get(`/terrains?select=*&id=eq.${terrainId}`);
  if (!terrains.data?.length) throw new Error('Terrain non trouve');
  const terrain = terrains.data[0];

  const slots = await fetchSlots(terrainId, date);
  const slot = slots?.find(s => s.slot_start === startTime && s.slot_end === endTime);
  if (!slot || !slot.is_available) throw new Error('Ce creneau n\'est pas disponible');

  const start = new Date(`1970-01-01 ${startTime}`);
  const end = new Date(`1970-01-01 ${endTime}`);
  const hours = (end - start) / 3600000;
  const totalAmount = hours * terrain.price_per_hour;
  const ref = 'TM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

  const { data } = await supabaseRest.post('/reservations', {
    terrain_id: terrainId,
    user_id: user.id,
    reservation_date: date,
    start_time: startTime,
    end_time: endTime,
    duration_hours: hours,
    total_amount: totalAmount,
    status: 'pending',
    payment_reference: ref,
    payment_status: 'unpaid'
  }, { headers: { 'Prefer': 'return=representation' } });

  return { reservation: data, terrain, total_amount: totalAmount, duration_hours: hours };
}

export async function cancelReservation(id) {
  await supabaseRest.patch(`/reservations?id=eq.${id}`, {
    status: 'cancelled',
    updated_at: new Date().toISOString()
  });
}

export async function fetchAdminStats(ownerId) {
  const terrains = await supabaseRest.get(`/terrains?select=id&owner_id=eq.${ownerId}&is_active=eq.true`);
  const terrainIds = terrains.data?.map(t => t.id) || [];
  if (!terrainIds.length) return { terrains_count: 0, reservations_count: 0, confirmed_reservations: 0, total_revenue: 0 };

  const ids = terrainIds.join(',');
  const [reservations, allRes, payments] = await Promise.all([
    supabaseRest.get(`/reservations?select=id,status&terrain_id=in.(${ids})`),
    supabaseRest.get(`/reservations?select=id&terrain_id=in.(${ids})`),
  ]);

  const confirmed = reservations.data?.filter(r => r.status === 'confirmed').length || 0;
  const resIds = allRes.data?.map(r => r.id) || [];

  let totalRevenue = 0;
  if (resIds.length) {
    const payRes = await supabaseRest.get(`/payments?select=amount&status=eq.successful&reservation_id=in.(${resIds.join(',')})`);
    totalRevenue = payRes.data?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
  }

  return {
    terrains_count: terrains.data?.length || 0,
    reservations_count: reservations.data?.length || 0,
    confirmed_reservations: confirmed,
    total_revenue: totalRevenue
  };
}

export async function fetchAdminTerrains(ownerId) {
  const { data } = await supabaseRest.get(`/terrains?select=*,terrain_photos(*)&owner_id=eq.${ownerId}&order=created_at.desc`);
  return data || [];
}

export async function createTerrain(payload, ownerId) {
  const { data } = await supabaseRest.post('/terrains', {
    ...payload,
    owner_id: ownerId
  }, { headers: { 'Prefer': 'return=representation' } });
  return data;
}

export async function updateTerrain(id, payload, ownerId) {
  const { data } = await supabaseRest.patch(`/terrains?id=eq.${id}&owner_id=eq.${ownerId}`, {
    ...payload,
    updated_at: new Date().toISOString()
  }, { headers: { 'Prefer': 'return=representation' } });
  return data?.[0];
}

export async function deactivateTerrain(id, ownerId) {
  await supabaseRest.patch(`/terrains?id=eq.${id}&owner_id=eq.${ownerId}`, {
    is_active: false
  });
}
