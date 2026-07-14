<?php
// payments.php - uses PATH_INFO
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?: [];

$path = $_SERVER['PATH_INFO'] ?? '';
$path = '/' . ltrim($path, '/');
$parts = array_values(array_filter(explode('/', $path)));
$sub = $parts[1] ?? '';
$extra = $parts[2] ?? '';

// POST /api/index.php/payments/pay
if ($method === 'POST' && $sub === 'pay') {
    $user = require_auth();
    $reservation_id = $body['reservation_id'] ?? '';
    $phone_number = $body['phone_number'] ?? '';

    if (!$reservation_id || !$phone_number) {
        respond(400, ['error' => 'reservation_id et phone_number requis']);
    }

    $reservations = supabase_get('reservations?select=*,terrain:terrains(*)&id=eq.' . $reservation_id . '&user_id=eq.' . $user['id'], true);
    if (empty($reservations)) {
        respond(404, ['error' => 'Reservation non trouvee']);
    }
    $reservation = $reservations[0];

    if ($reservation['payment_status'] === 'paid') {
        respond(400, ['error' => 'Deja paye']);
    }

    $payment = supabase_insert('payments', [
        'reservation_id' => $reservation_id,
        'user_id' => $user['id'],
        'amount' => $reservation['total_amount'],
        'currency' => 'XOF',
        'phone_number' => $phone_number,
        'status' => 'pending'
    ]);

    respond(200, [
        'payment_url' => '#demo-payment',
        'pay_token' => 'demo-token-' . uniqid(),
        'notif_token' => 'demo-notif-' . uniqid(),
        'payment_id' => $payment['id'] ?? null,
        'message' => 'Mode demo - paiement simule'
    ]);
}

// POST /api/index.php/payments/webhook
if ($method === 'POST' && $sub === 'webhook') {
    $order_id = $body['order_id'] ?? '';
    $status = $body['status'] ?? '';
    $txnid = $body['txnid'] ?? '';

    $reservations = supabase_get('reservations?select=*,terrain:terrains(*)&payment_reference=eq.' . $order_id, true);
    if (empty($reservations)) {
        respond(404, ['error' => 'Reservation non trouvee']);
    }
    $reservation = $reservations[0];

    $payments = supabase_get('payments?select=*&reservation_id=eq.' . $reservation['id'] . '&order=created_at.desc&limit=1', true);
    if (empty($payments)) {
        respond(404, ['error' => 'Paiement non trouve']);
    }
    $payment = $payments[0];

    if ($status === 'SUCCESS') {
        supabase_update('payments?id=eq.' . $payment['id'], [
            'status' => 'successful',
            'provider_status' => $status,
            'provider_transaction_id' => $txnid ?: $payment['provider_transaction_id'],
            'webhook_payload' => json_encode($body),
            'updated_at' => date('c')
        ]);
        supabase_update('reservations?id=eq.' . $reservation['id'], [
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'updated_at' => date('c')
        ]);
    } elseif (in_array($status, ['FAILED', 'EXPIRED'])) {
        supabase_update('payments?id=eq.' . $payment['id'], [
            'status' => 'failed',
            'provider_status' => $status,
            'webhook_payload' => json_encode($body),
            'updated_at' => date('c')
        ]);
        supabase_update('reservations?id=eq.' . $reservation['id'], [
            'payment_status' => 'failed',
            'updated_at' => date('c')
        ]);
    }

    respond(200, ['status' => 'received']);
}

// GET /api/index.php/payments/receipt/:id
if ($method === 'GET' && $sub === 'receipt' && $extra !== '') {
    $user = require_auth();
    $reservations = supabase_get('reservations?select=*,terrain:terrains(*)&id=eq.' . $extra . '&user_id=eq.' . $user['id'], true);
    if (empty($reservations)) {
        respond(404, ['error' => 'Reservation non trouvee']);
    }
    $payments = supabase_get('payments?select=*&reservation_id=eq.' . $extra . '&status=eq.successful', true);
    if (empty($payments)) {
        respond(404, ['error' => 'Paiement non trouve']);
    }
    respond(200, [
        'reservation' => $reservations[0],
        'payment' => $payments[0],
        'message' => 'Recu disponible'
    ]);
}

respond(404, ['error' => 'Route payments non trouvee']);
