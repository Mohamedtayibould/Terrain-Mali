<?php
// admin.php - uses PATH_INFO
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?: [];
$query = $_GET ?? [];

$path = $_SERVER['PATH_INFO'] ?? '';
$path = '/' . ltrim($path, '/');
$parts = array_values(array_filter(explode('/', $path)));
$sub = $parts[1] ?? '';
$id = $parts[2] ?? '';

$user = require_auth();
$user = require_admin($user);

// GET /api/index.php/admin/stats
if ($method === 'GET' && $sub === 'stats') {
    $myTerrains = supabase_get('terrains?select=id&owner_id=eq.' . $user['id'], true);
    $terrainIds = array_column($myTerrains, 'id');
    $terrainsCount = supabase_get('terrains?select=id&owner_id=eq.' . $user['id'] . '&is_active=eq.true', true);
    $terrains_count = is_array($terrainsCount) ? count($terrainsCount) : 0;
    $reservations_count = 0;
    $confirmed = 0;
    $totalRevenue = 0;

    if (!empty($terrainIds)) {
        $ids_str = implode(',', $terrainIds);
        $reservations = supabase_get('reservations?select=id,status&terrain_id=in.(' . $ids_str . ')', true);
        $reservations_count = is_array($reservations) ? count($reservations) : 0;
        $confirmed = is_array($reservations) ? count(array_filter($reservations, fn($r) => $r['status'] === 'confirmed')) : 0;
        $allRes = supabase_get('reservations?select=id&terrain_id=in.(' . $ids_str . ')', true);
        $resIds = array_column($allRes, 'id');
        if (!empty($resIds)) {
            $resIds_str = implode(',', $resIds);
            $payments = supabase_get('payments?select=amount&status=eq.successful&reservation_id=in.(' . $resIds_str . ')', true);
            foreach ($payments as $p) {
                $totalRevenue += floatval($p['amount']);
            }
        }
    }

    respond(200, [
        'terrains_count' => $terrains_count,
        'reservations_count' => $reservations_count,
        'confirmed_reservations' => $confirmed,
        'total_revenue' => $totalRevenue
    ]);
}

// GET /api/index.php/admin/terrains
if ($method === 'GET' && $sub === 'terrains' && $id === '') {
    $data = supabase_get('terrains?select=*,terrain_photos(*)&owner_id=eq.' . $user['id'] . '&order=created_at.desc', true);
    respond(200, $data);
}

// POST /api/index.php/admin/terrains
if ($method === 'POST' && $sub === 'terrains') {
    $required = ['name', 'city', 'neighborhood', 'address', 'price_per_hour', 'orange_money_number', 'guardian_phone'];
    foreach ($required as $field) {
        if (empty($body[$field])) {
            respond(400, ['error' => 'Tous les champs obligatoires sont requis']);
        }
    }

    $result = supabase_insert('terrains', [
        'name' => $body['name'], 'city' => $body['city'], 'neighborhood' => $body['neighborhood'],
        'address' => $body['address'], 'description' => $body['description'] ?? null,
        'price_per_hour' => $body['price_per_hour'], 'orange_money_number' => $body['orange_money_number'],
        'guardian_phone' => $body['guardian_phone'], 'latitude' => $body['latitude'] ?? null,
        'longitude' => $body['longitude'] ?? null, 'opening_time' => $body['opening_time'] ?? '08:00',
        'closing_time' => $body['closing_time'] ?? '22:00', 'owner_id' => $user['id']
    ]);

    if (isset($result['code'])) {
        respond(500, ['error' => 'Erreur creation terrain']);
    }
    respond(201, $result);
}

// PUT /api/index.php/admin/terrains/:id
if ($method === 'PUT' && $sub === 'terrains' && $id !== '') {
    $body['updated_at'] = date('c');
    $result = supabase_update('terrains?id=eq.' . $id . '&owner_id=eq.' . $user['id'], $body);
    if (!empty($result[0])) {
        respond(200, $result[0]);
    }
    respond(404, ['error' => 'Terrain non trouve']);
}

// DELETE /api/index.php/admin/terrains/:id
if ($method === 'DELETE' && $sub === 'terrains' && $id !== '') {
    supabase_update('terrains?id=eq.' . $id . '&owner_id=eq.' . $user['id'], ['is_active' => false]);
    respond(200, ['message' => 'Terrain desactive']);
}

// POST /api/index.php/admin/photos
if ($method === 'POST' && $sub === 'photos') {
    $terrain_id = $body['terrain_id'] ?? '';
    $photo_url = $body['photo_url'] ?? '';
    $is_primary = $body['is_primary'] ?? false;
    $terrains = supabase_get('terrains?select=owner_id&id=eq.' . $terrain_id, true);
    if (empty($terrains) || $terrains[0]['owner_id'] !== $user['id']) {
        respond(403, ['error' => 'Non autorise']);
    }
    if ($is_primary) {
        supabase_update('terrain_photos?terrain_id=eq.' . $terrain_id, ['is_primary' => false]);
    }
    $result = supabase_insert('terrain_photos', ['terrain_id' => $terrain_id, 'photo_url' => $photo_url, 'is_primary' => $is_primary]);
    respond(201, $result);
}

// DELETE /api/index.php/admin/photos/:id
if ($method === 'DELETE' && $sub === 'photos' && $id !== '') {
    supabase_delete('terrain_photos?id=eq.' . $id);
    respond(200, ['message' => 'Photo supprimee']);
}

// GET /api/index.php/admin/reservations
if ($method === 'GET' && $sub === 'reservations') {
    $myTerrains = supabase_get('terrains?select=id&owner_id=eq.' . $user['id'], true);
    $terrainIds = array_column($myTerrains, 'id');
    if (empty($terrainIds)) respond(200, []);
    $ids_str = implode(',', $terrainIds);
    $endpoint = 'reservations?select=*,terrain:terrains(name,city)&terrain_id=in.(' . $ids_str . ')&order=reservation_date.desc';
    if (!empty($query['status'])) $endpoint .= '&status=eq.' . $query['status'];
    if (!empty($query['date'])) $endpoint .= '&reservation_date=eq.' . $query['date'];
    $data = supabase_get($endpoint, true);
    respond(200, $data);
}

// GET /api/index.php/admin/payments
if ($method === 'GET' && $sub === 'payments') {
    $myTerrains = supabase_get('terrains?select=id&owner_id=eq.' . $user['id'], true);
    $terrainIds = array_column($myTerrains, 'id');
    if (empty($terrainIds)) respond(200, []);
    $ids_str = implode(',', $terrainIds);
    $myRes = supabase_get('reservations?select=id&terrain_id=in.(' . $ids_str . ')', true);
    $resIds = array_column($myRes, 'id');
    if (empty($resIds)) respond(200, []);
    $resIds_str = implode(',', $resIds);
    $endpoint = 'payments?select=*,reservation:reservations(terrain:terrains(name,city),reservation_date,start_time,end_time)&reservation_id=in.(' . $resIds_str . ')&order=created_at.desc';
    if (!empty($query['status'])) $endpoint .= '&status=eq.' . $query['status'];
    $data = supabase_get($endpoint, true);
    respond(200, $data);
}

respond(404, ['error' => 'Route admin non trouvee']);
