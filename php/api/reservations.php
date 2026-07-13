<?php
// reservations.php
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?: [];

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

$sub = '';
$id = '';
if (preg_match('#/api/reservations/([^/]+)(?:/([^/]+))?#', $uri, $m)) {
    $sub = $m[1] ?? '';
    $id = $m[2] ?? '';
}

// GET /api/reservations/my
if ($method === 'GET' && $sub === 'my') {
    $user = require_auth();
    $data = supabase_get('reservations?select=*,terrain:terrains(*,terrain_photos(*))&user_id=eq.' . $user['id'] . '&order=reservation_date.desc');
    respond(200, $data);
}

// POST /api/reservations
if ($method === 'POST' && $sub === '') {
    $user = require_auth();
    $terrain_id = $body['terrain_id'] ?? '';
    $reservation_date = $body['reservation_date'] ?? '';
    $start_time = $body['start_time'] ?? '';
    $end_time = $body['end_time'] ?? '';

    if (!$terrain_id || !$reservation_date || !$start_time || !$end_time) {
        respond(400, ['error' => 'Tous les champs sont requis']);
    }

    $isAvailable = supabase_rpc('check_slot_availability', [
        'p_terrain_id' => $terrain_id,
        'p_date' => $reservation_date,
        'p_start_time' => $start_time,
        'p_end_time' => $end_time
    ]);

    if (!$isAvailable) {
        respond(409, ['error' => 'Ce creneau est deja reserve']);
    }

    $terrains = supabase_get('terrains?select=*&id=eq.' . $terrain_id);
    if (empty($terrains)) {
        respond(404, ['error' => 'Terrain non trouve']);
    }
    $terrain = $terrains[0];

    $start = new DateTime('1970-01-01 ' . $start_time);
    $end = new DateTime('1970-01-01 ' . $end_time);
    $durationHours = ($end->getTimestamp() - $start->getTimestamp()) / 3600;
    $totalAmount = $durationHours * $terrain['price_per_hour'];

    $paymentRef = 'TM-' . time() . '-' . strtoupper(substr(md5(uniqid()), 0, 6));

    $result = supabase_insert('reservations', [
        'terrain_id' => $terrain_id,
        'user_id' => $user['id'],
        'reservation_date' => $reservation_date,
        'start_time' => $start_time,
        'end_time' => $end_time,
        'duration_hours' => $durationHours,
        'total_amount' => $totalAmount,
        'status' => 'pending',
        'payment_reference' => $paymentRef,
        'payment_status' => 'unpaid'
    ]);

    if (isset($result['code'])) {
        respond(409, ['error' => 'Ce creneau est deja reserve']);
    }

    respond(201, [
        'reservation' => $result,
        'terrain' => $terrain,
        'total_amount' => $totalAmount,
        'duration_hours' => $durationHours
    ]);
}

// PATCH /api/reservations/:id/cancel
if ($method === 'PATCH' && $sub !== '' && $id === 'cancel') {
    $reservation_id = $sub;
    $user = require_auth();

    $reservations = supabase_get('reservations?select=*,terrain:terrains(*)&id=eq.' . $reservation_id . '&user_id=eq.' . $user['id']);
    if (empty($reservations)) {
        respond(404, ['error' => 'Reservation non trouvee']);
    }
    $reservation = $reservations[0];

    if ($reservation['status'] === 'confirmed' && $reservation['payment_status'] === 'paid') {
        respond(400, ['error' => "Impossible d'annuler une reservation payee"]);
    }

    supabase_update('reservations?id=eq.' . $reservation_id, [
        'status' => 'cancelled',
        'updated_at' => date('c')
    ]);

    respond(200, ['message' => 'Reservation annulee']);
}

respond(404, ['error' => 'Route reservations non trouvee']);
