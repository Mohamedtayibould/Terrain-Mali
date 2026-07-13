<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$token = get_bearer_token();
if (!$token) {
    echo json_encode(['error' => 'No token']);
    exit;
}

$user = get_user_from_token($token);
$meta = $user['raw_user_meta_data'] ?? null;
$meta2 = $user['user_metadata'] ?? null;
$meta3 = $user['app_metadata'] ?? null;

$profile = null;
if (isset($user['id'])) {
    $profile = supabase_get('profiles?id=eq.' . $user['id'] . '&select=role,full_name', true);
}

echo json_encode([
    'user_id' => $user['id'] ?? null,
    'email' => $user['email'] ?? null,
    'raw_user_meta_data' => $meta,
    'user_metadata' => $meta2,
    'app_metadata' => $meta3,
    'profile_from_db' => $profile,
], JSON_PRETTY_PRINT);
