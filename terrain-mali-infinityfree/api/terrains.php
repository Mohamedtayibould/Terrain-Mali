<?php
// terrains.php - uses PATH_INFO
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?: [];
$query = $_GET ?? [];

$path = $_SERVER['PATH_INFO'] ?? '';
$path = '/' . ltrim($path, '/');
$parts = array_values(array_filter(explode('/', $path)));
// parts[0]=terrains, parts[1]=sub/id, parts[2]=extra
$sub = $parts[1] ?? '';
$extra = $parts[2] ?? '';

// GET /api/index.php/terrains/cities
if ($method === 'GET' && $sub === 'cities') {
    $data = supabase_get('terrains?select=city&is_active=eq.true');
    $cities = array_unique(array_column($data, 'city'));
    sort($cities);
    respond(200, array_values($cities));
}

// GET /api/index.php/terrains/:id/slots
if ($method === 'GET' && $extra === 'slots' && $sub !== '') {
    $terrain_id = $sub;
    $date = $query['date'] ?? '';
    if (!$date) respond(400, ['error' => 'Date requise']);
    $result = supabase_rpc('get_available_slots', [
        'p_terrain_id' => $terrain_id,
        'p_date' => $date
    ]);
    respond(200, $result);
}

// GET /api/index.php/terrains/:id
if ($method === 'GET' && $sub !== '' && $sub !== 'cities' && $extra === '') {
    $data = supabase_get('terrains?select=*,terrain_photos(*)&id=eq.' . $sub);
    if (empty($data)) respond(404, ['error' => 'Terrain non trouve']);
    respond(200, $data[0]);
}

// GET /api/index.php/terrains (list)
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

    $data = supabase_get('terrains?select=*,terrain_photos(*)&' . $filters . '&order=created_at.desc&offset=' . $offset . '&limit=' . $limit);
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
