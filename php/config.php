<?php
define('SUPABASE_URL', 'https://ydavntxdjgooomoqcbqc.supabase.co');
define('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYXZudHhkamdvb29tb3FjYnFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzg3NzM0OCwiZXhwIjoyMDk5NDUzMzQ4fQ.81KWdTuhr46FKnw8XvZIVE8cdr4TR2oR6CU3Pdqz6BA');
define('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYXZudHhkamdvb29tb3FjYnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NzczNDgsImV4cCI6MjA5OTQ1MzM0OH0.1aNvQtV7DSSo2D6xhq3hodx_HA2we9Q4ChhHuTaV5K8');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function supabase_get($endpoint, $use_service = false) {
    $url = SUPABASE_URL . '/rest/v1/' . $endpoint;
    $ch = curl_init($url);
    $key = $use_service ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => [
            'apikey: ' . SUPABASE_ANON_KEY,
            'Authorization: Bearer ' . $key,
            'Content-Type: application/json'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result, true);
}

function supabase_insert($endpoint, $data) {
    $url = SUPABASE_URL . '/rest/v1/' . $endpoint;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'apikey: ' . SUPABASE_ANON_KEY,
            'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
            'Content-Type: application/json',
            'Prefer: return=representation'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result, true);
}

function supabase_update($endpoint, $data) {
    $url = SUPABASE_URL . '/rest/v1/' . $endpoint;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'apikey: ' . SUPABASE_ANON_KEY,
            'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
            'Content-Type: application/json',
            'Prefer: return=representation'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result, true);
}

function supabase_rpc($function_name, $params) {
    $url = SUPABASE_URL . '/rest/v1/rpc/' . $function_name;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($params),
        CURLOPT_HTTPHEADER => [
            'apikey: ' . SUPABASE_ANON_KEY,
            'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
            'Content-Type: application/json'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result, true);
}

function supabase_auth_action($action, $data, $token = null) {
    $url = SUPABASE_URL . '/auth/v1/' . $action;
    $ch = curl_init($url);
    $headers = [
        'apikey: ' . SUPABASE_ANON_KEY,
        'Content-Type: application/json'
    ];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt_array($ch, [
        CURLOPT_POST => ($action !== 'user'),
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result, true);
}

function get_bearer_token() {
    $headers = [];
    foreach ($_SERVER as $key => $value) {
        if (substr($key, 0, 5) === 'HTTP_') {
            $name = strtolower(str_replace('_', '-', substr($key, 5)));
            $headers[$name] = $value;
        }
    }
    $auth = $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $auth, $m)) {
        return trim($m[1]);
    }
    return null;
}

function get_user_from_token($token) {
    $url = SUPABASE_URL . '/auth/v1/user';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => [
            'apikey: ' . SUPABASE_ANON_KEY,
            'Authorization: Bearer ' . $token
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result, true);
}

function respond($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function require_auth() {
    $token = get_bearer_token();
    if (!$token) respond(401, ['error' => 'Token manquant']);
    $user = get_user_from_token($token);
    if (!$user || !isset($user['id'])) respond(401, ['error' => 'Token invalide']);
    $user['_token'] = $token;
    return $user;
}

function require_admin($user) {
    $meta = $user['raw_user_meta_data'] ?? $user['user_metadata'] ?? [];
    $role = $meta['role'] ?? 'user';
    if ($role !== 'admin') {
        $profiles = supabase_get('profiles?id=eq.' . $user['id'] . '&select=role');
        if (!empty($profiles[0]['role']) && $profiles[0]['role'] === 'admin') {
            return $user;
        }
        respond(403, ['error' => 'Acces reserve aux administrateurs']);
    }
    return $user;
}

function cors_headers() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}
