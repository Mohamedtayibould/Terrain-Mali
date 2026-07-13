<?php
define('SUPABASE_URL', 'https://ydavntxdjgooomoqcbqc.supabase.co');
define('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYXZudHhkamdvb29tb3FjYnFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzg3NzM0OCwiZXhwIjoyMDk5NDUzMzQ4fQ.81KWdTuhr46FKnw8XvZIVE8cdr4TR2oR6CU3Pdqz6BA');
define('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYXZudHhkamdvb29tb3FjYnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NzczNDgsImV4cCI6MjA5OTQ1MzM0OH0.1aNvQtV7DSSo2D6xhq3hodx_HA2we9Q4ChhHuTaV5K8');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function http_request($url, $method, $headers, $body = null) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        $opts = [
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false
        ];
        if ($method === 'POST') {
            $opts[CURLOPT_POST] = true;
            if ($body !== null) $opts[CURLOPT_POSTFIELDS] = $body;
        } elseif ($method === 'PATCH') {
            $opts[CURLOPT_CUSTOMREQUEST] = 'PATCH';
            if ($body !== null) $opts[CURLOPT_POSTFIELDS] = $body;
        } elseif ($method === 'DELETE') {
            $opts[CURLOPT_CUSTOMREQUEST] = 'DELETE';
        }
        curl_setopt_array($ch, $opts);
        $result = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if ($err) {
            error_log('Curl error: ' . $err);
        }
        return $result;
    } else {
        $stream_opts = [
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers),
                'timeout' => 30,
                'ignore_errors' => true
            ]
        ];
        if ($body !== null) {
            $stream_opts['http']['content'] = $body;
        }
        $ctx = stream_context_create($stream_opts);
        return @file_get_contents($url, false, $ctx);
    }
}

function supabase_get($endpoint, $use_service = false) {
    $url = SUPABASE_URL . '/rest/v1/' . $endpoint;
    $key = $use_service ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;
    $headers = [
        'apikey: ' . SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . $key,
        'Content-Type: application/json'
    ];
    $result = http_request($url, 'GET', $headers);
    return json_decode($result, true);
}

function supabase_insert($endpoint, $data) {
    $url = SUPABASE_URL . '/rest/v1/' . $endpoint;
    $headers = [
        'apikey: ' . SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ];
    $result = http_request($url, 'POST', $headers, json_encode($data));
    return json_decode($result, true);
}

function supabase_update($endpoint, $data) {
    $url = SUPABASE_URL . '/rest/v1/' . $endpoint;
    $headers = [
        'apikey: ' . SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ];
    $result = http_request($url, 'PATCH', $headers, json_encode($data));
    return json_decode($result, true);
}

function supabase_rpc($function_name, $params) {
    $url = SUPABASE_URL . '/rest/v1/rpc/' . $function_name;
    $headers = [
        'apikey: ' . SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
        'Content-Type: application/json'
    ];
    $result = http_request($url, 'POST', $headers, json_encode($params));
    return json_decode($result, true);
}

function supabase_auth_action($action, $data, $token = null) {
    $url = SUPABASE_URL . '/auth/v1/' . $action;
    $headers = [
        'apikey: ' . SUPABASE_ANON_KEY,
        'Content-Type: application/json'
    ];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    $is_get = ($action === 'user');
    $method = $is_get ? 'GET' : 'POST';
    $result = http_request($url, $method, $headers, $is_get ? null : json_encode($data));
    return json_decode($result, true);
}

function get_bearer_token() {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!$auth) {
        foreach ($_SERVER as $key => $value) {
            if (strtolower($key) === 'http_authorization') {
                $auth = $value;
                break;
            }
        }
    }
    if (preg_match('/Bearer\s+(.+)/i', $auth, $m)) {
        return trim($m[1]);
    }
    return null;
}

function get_user_from_token($token) {
    $url = SUPABASE_URL . '/auth/v1/user';
    $headers = [
        'apikey: ' . SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . $token
    ];
    $result = http_request($url, 'GET', $headers);
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
    $meta = $user['raw_user_meta_data'] ?? $user['user_metadata'] ?? $user['app_metadata'] ?? [];
    $role = $meta['role'] ?? '';
    if ($role !== 'admin') {
        $profiles = supabase_get('profiles?id=eq.' . $user['id'] . '&select=role', true);
        if (!empty($profiles[0]['role']) && $profiles[0]['role'] === 'admin') {
            return $user;
        }
        respond(403, ['error' => 'Acces reserve aux administrateurs. Role actuel: ' . ($role ?: 'user')]);
    }
    return $user;
}
