<?php
// terrains.php
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?: [];

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

// Extract parts after /api/terrains
$sub = '';
$id = '';
if (preg_match('#/api/terrains/([^/]+)(?:/([^/]+))?#', $uri, $m)) {
    $sub = $m[1] ?? '';
    $id = $m[2] ?? '';
    // If sub is "cities", handle it
    if ($sub === 'cities') {
        $sub = 'cities';
        $id = '';
    }
}

$query = $_GET ?? [];

// GET /api/terrains/cities
if ($method === 'GET' && $sub === 'cities') {
    $data = supabase_get('terrains?select=city&is_active=eq.true');
    $cities = array_unique(array_column($data, 'city'));
    sort($cities);
    respond(200, array_values($cities));
}

// GET /api/terrains/:id/slots
if ($method === 'GET' && $id === 'slots' && $sub !== '' && $sub !== 'cities') {
    $terrain_id = $sub;
    $date = $query['date'] ?? '';
    if (!$date) respond(400, ['error' => 'Date requise']);
    $result = supabase_rpc('get_available_slots', [
        'p_terrain_id' => $terrain_id,
        'p_date' => $date
    ]);
    respond(200, $result);
}

// GET /api/terrains/:id (single terrain)
if ($method === 'GET' && $sub !== '' && $sub !== 'cities' && $id === '') {
    $data = supabase_get('terrains?select=*,terrain_photos(*)&id=eq.' . $sub);
    if (empty($data)) respond(404, ['error' => 'Terrain non trouve']);
    respond(200, $data[0]);
}

// GET /api/terrains (list all)
if ($method === 'GET' && $sub === '') {
    $page = intval($query['page'] ?? 1);
    $limit = intval($query['limit'] ?? 12);
    $offset = ($page - 1) * $limit;
    $city = $query['city'] ?? '';
    $search = $query['search'] ?? '';

    $filters = 'is_active=eq.true';
    if ($city) {
        $filters .= '&city=ilike.*' . urlencode($city) . '*';
    }
    if ($search) {
        $filters .= '&or=(name.ilike.*' . urlencode($search) . '*,neighborhood.ilike.*' . urlencode($search) . '*,address.ilike.*' . urlencode($search) . '*,city.ilike.*' . urlencode($search) . '*)';
    }

    $endpoint = 'terrains?select=*,terrain_photos(*)&' . $filters . '&order=created_at.desc&offset=' . $offset . '&limit=' . $limit;
    $data = supabase_get($endpoint);

    $count_data = supabase_get('terrains?select=id&' . $filters);
    $total = is_array($count_data) ? count($count_data) : 0;

    respond(200, [
        'terrains' => $data,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($total / $limit)
        ]
    ]);
}

respond(404, ['error' => 'Route terrains non trouvee']);
