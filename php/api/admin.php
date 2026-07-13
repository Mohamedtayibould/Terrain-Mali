<?php
// admin.php
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?: [];

$uri = $_SERVER['REQUEST_URI'];
$uri = strtok($uri, '?');
$parts = array_filter(explode('/', preg_replace('#^/api/admin#', '', $uri)));
$sub = $parts[0] ?? '';
$sub2 = $parts[1] ?? '';

$user = require_auth();
$user = require_admin($user);

// GET /api/admin/stats
if ($method === 'GET' && $sub === 'stats') {
    $myTerrains = supabase_get('terrains?select=id&owner_id=eq.' . $user['id']);
    $terrainIds = array_column($myTerrains, 'id');

    $terrainsCount = supabase_get('terrains?select=id&owner_id=eq.' . $user['id'] . '&is_active=eq.true');
    $terrains_count = is_array($terrainsCount) ? count($terrainsCount) : 0;

    $reservations_count = 0;
    $confirmed = 0;
    if (!empty($terrainIds)) {
        $ids_str = implode(',', $terrainIds);
        $reservations = supabase_get('reservations?select=id,status&terrain_id=in.(' . $ids_str . ')');
        $reservations_count = is_array($reservations) ? count($reservations) : 0;
        $confirmed = is_array($reservations) ? count(array_filter($reservations, fn($r) => $r['status'] === 'confirmed')) : 0;
    }

    $totalRevenue = 0;
    if (!empty($terrainIds)) {
        $ids_str = implode(',', $terrainIds);
        $allRes = supabase_get('reservations?select=id&terrain_id=in.(' . $ids_str . ')');
        $resIds = array_column($allRes, 'id');
        if (!empty($resIds)) {
            $resIds_str = implode(',', $resIds);
            $payments = supabase_get('payments?select=amount,reservation_id&status=eq.successful&reservation_id=in.(' . $resIds_str . ')');
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

// GET /api/admin/terrains
if ($method === 'GET' && $sub === 'terrains') {
    $data = supabase_get('terrains?select=*,terrain_photos(*)&owner_id=eq.' . $user['id'] . '&order=created_at.desc');
    respond(200, $data);
}

// POST /api/admin/terrains
if ($method === 'POST' && ($sub === 'terrains' || $sub === '')) {
    $required = ['name', 'city', 'neighborhood', 'address', 'price_per_hour', 'orange_money_number', 'guardian_phone'];
    foreach ($required as $field) {
        if (empty($body[$field])) {
            respond(400, ['error' => 'Tous les champs obligatoires sont requis']);
        }
    }

    $result = supabase_insert('terrains', [
        'name' => $body['name'],
        'city' => $body['city'],
        'neighborhood' => $body['neighborhood'],
        'address' => $body['address'],
        'description' => $body['description'] ?? null,
        'price_per_hour' => $body['price_per_hour'],
        'orange_money_number' => $body['orange_money_number'],
        'guardian_phone' => $body['guardian_phone'],
        'latitude' => $body['latitude'] ?? null,
        'longitude' => $body['longitude'] ?? null,
        'opening_time' => $body['opening_time'] ?? '08:00',
        'closing_time' => $body['closing_time'] ?? '22:00',
        'owner_id' => $user['id']
    ]);

    if (isset($result['code'])) {
        respond(500, ['error' => 'Erreur creation terrain']);
    }
    respond(201, $result);
}

// PUT /api/admin/terrains/:id
if ($method === 'PUT' && $sub === 'terrains' && $sub2 !== '') {
    $body['updated_at'] = date('c');
    $result = supabase_update('terrains?id=eq.' . $sub2 . '&owner_id=eq.' . $user['id'], $body);
    if (!empty($result[0])) {
        respond(200, $result[0]);
    }
    respond(404, ['error' => 'Terrain non trouve']);
}

// DELETE /api/admin/terrains/:id
if ($method === 'DELETE' && $sub === 'terrains' && $sub2 !== '') {
    supabase_update('terrains?id=eq.' . $sub2 . '&owner_id=eq.' . $user['id'], ['is_active' => false]);
    respond(200, ['message' => 'Terrain desactive']);
}

// POST /api/admin/photos
if ($method === 'POST' && $sub === 'photos') {
    $terrain_id = $body['terrain_id'] ?? '';
    $photo_url = $body['photo_url'] ?? '';
    $is_primary = $body['is_primary'] ?? false;

    $terrains = supabase_get('terrains?select=owner_id&id=eq.' . $terrain_id);
    if (empty($terrains) || $terrains[0]['owner_id'] !== $user['id']) {
        respond(403, ['error' => 'Non autorise']);
    }

    if ($is_primary) {
        supabase_update('terrain_photos?terrain_id=eq.' . $terrain_id, ['is_primary' => false]);
    }

    $result = supabase_insert('terrain_photos', [
        'terrain_id' => $terrain_id,
        'photo_url' => $photo_url,
        'is_primary' => $is_primary
    ]);
    respond(201, $result);
}

// DELETE /api/admin/photos/:id
if ($method === 'DELETE' && $sub === 'photos' && $sub2 !== '') {
    supabase_update('terrain_photos?id=eq.' . $sub2, ['deleted' => true]);
    respond(200, ['message' => 'Photo supprimee']);
}

// GET /api/admin/reservations
if ($method === 'GET' && $sub === 'reservations') {
    $query = $_GET ?? [];
    $myTerrains = supabase_get('terrains?select=id&owner_id=eq.' . $user['id']);
    $terrainIds = array_column($myTerrains, 'id');

    if (empty($terrainIds)) {
        respond(200, []);
    }

    $ids_str = implode(',', $terrainIds);
    $endpoint = 'reservations?select=*,terrain:terrains(name,city)&terrain_id=in.(' . $ids_str . ')&order=reservation_date.desc';

    if (!empty($query['status'])) {
        $endpoint .= '&status=eq.' . $query['status'];
    }
    if (!empty($query['date'])) {
        $endpoint .= '&reservation_date=eq.' . $query['date'];
    }

    $data = supabase_get($endpoint);
    respond(200, $data);
}

// GET /api/admin/payments
if ($method === 'GET' && $sub === 'payments') {
    $query = $_GET ?? [];
    $myTerrains = supabase_get('terrains?select=id&owner_id=eq.' . $user['id']);
    $terrainIds = array_column($myTerrains, 'id');

    if (empty($terrainIds)) {
        respond(200, []);
    }

    $ids_str = implode(',', $terrainIds);
    $myRes = supabase_get('reservations?select=id&terrain_id=in.(' . $ids_str . ')');
    $resIds = array_column($myRes, 'id');

    if (empty($resIds)) {
        respond(200, []);
    }

    $resIds_str = implode(',', $resIds);
    $endpoint = 'payments?select=*,reservation:reservations(terrain:terrains(name,city),reservation_date,start_time,end_time)&reservation_id=in.(' . $resIds_str . ')&order=created_at.desc';

    if (!empty($query['status'])) {
        $endpoint .= '&status=eq.' . $query['status'];
    }

    $data = supabase_get($endpoint);
    respond(200, $data);
}

respond(404, ['error' => 'Route non trouvee']);
