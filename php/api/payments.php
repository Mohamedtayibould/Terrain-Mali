<?php
// payments.php
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?: [];

$uri = $_SERVER['REQUEST_URI'];
$uri = strtok($uri, '?');
$parts = array_filter(explode('/', preg_replace('#^/api/payments#', '', $uri)));
$sub = $parts[0] ?? '';

// POST /api/payments/pay
if ($method === 'POST' && $sub === 'pay') {
    $user = require_auth();
    $reservation_id = $body['reservation_id'] ?? '';
    $phone_number = $body['phone_number'] ?? '';

    if (!$reservation_id || !$phone_number) {
        respond(400, ['error' => 'reservation_id et phone_number requis']);
    }

    $reservations = supabase_get('reservations?select=*,terrain:terrains(*)&id=eq.' . $reservation_id . '&user_id=eq.' . $user['id']);
    if (empty($reservations)) {
        respond(404, ['error' => 'Reservation non trouvee']);
    }
    $reservation = $reservations[0];

    if ($reservation['payment_status'] === 'paid') {
        respond(400, ['error' => 'Deja paye']);
    }

    // Create payment record
    $payment = supabase_insert('payments', [
        'reservation_id' => $reservation_id,
        'user_id' => $user['id'],
        'amount' => $reservation['total_amount'],
        'currency' => 'XOF',
        'phone_number' => $phone_number,
        'status' => 'pending'
    ]);

    if (isset($payment['code'])) {
        respond(500, ['error' => 'Erreur creation paiement']);
    }

    // Orange Money API call (stub demo)
    respond(200, [
        'payment_url' => '#demo-payment',
        'pay_token' => 'demo-token-' . uniqid(),
        'notif_token' => 'demo-notif-' . uniqid(),
        'payment_id' => $payment['id'] ?? null,
        'message' => 'Mode demo - paiement simule'
    ]);
}

// POST /api/payments/webhook
if ($method === 'POST' && $sub === 'webhook') {
    $order_id = $body['order_id'] ?? '';
    $status = $body['status'] ?? '';
    $txnid = $body['txnid'] ?? '';

    $reservations = supabase_get('reservations?select=*,terrain:terrains(*)&payment_reference=eq.' . $order_id);
    if (empty($reservations)) {
        respond(404, ['error' => 'Reservation non trouvee']);
    }
    $reservation = $reservations[0];

    $payments = supabase_get('payments?select=*&reservation_id=eq.' . $reservation['id'] . '&order=created_at.desc&limit=1');
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

// GET /api/payments/receipt/:reservation_id
if ($method === 'GET' && $sub === 'receipt' && isset($parts[1])) {
    $user = require_auth();
    $reservation_id = $parts[1];

    $reservations = supabase_get('reservations?select=*,terrain:terrains(*)&id=eq.' . $reservation_id . '&user_id=eq.' . $user['id']);
    if (empty($reservations)) {
        respond(404, ['error' => 'Reservation non trouvee']);
    }

    $payments = supabase_get('payments?select=*&reservation_id=eq.' . $reservation_id . '&status=eq.successful');
    if (empty($payments)) {
        respond(404, ['error' => 'Paiement non trouve']);
    }

    respond(200, [
        'reservation' => $reservations[0],
        'payment' => $payments[0],
        'message' => 'Recu disponible (PDF non supporte sur hébergement gratuit)'
    ]);
}

respond(404, ['error' => 'Route non trouvee']);
