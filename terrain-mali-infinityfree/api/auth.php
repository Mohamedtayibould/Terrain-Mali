<?php
// auth.php - called from index.php with PATH_INFO
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?: [];

$path = $_SERVER['PATH_INFO'] ?? '';
$path = '/' . ltrim($path, '/');
$parts = array_values(array_filter(explode('/', $path)));
// parts[0]=auth, parts[1]=sub, parts[2]=extra
$sub = $parts[1] ?? '';

// POST /api/index.php/auth/register
if ($method === 'POST' && $sub === 'register') {
    $email = $body['email'] ?? '';
    $password = $body['password'] ?? '';
    $full_name = $body['full_name'] ?? '';
    $phone = $body['phone'] ?? '';

    if (!$email || !$password || !$full_name) {
        respond(400, ['error' => 'Email, mot de passe et nom requis']);
    }

    $result = supabase_auth_action('signup', [
        'email' => $email,
        'password' => $password,
        'data' => ['full_name' => $full_name, 'phone' => $phone, 'role' => 'user']
    ]);

    if (isset($result['error']) && $result['error']) {
        respond(400, ['error' => $result['msg'] ?? $result['error_description'] ?? $result['error']]);
    }
    respond(201, ['message' => 'Compte cree avec succes', 'user' => $result['user'] ?? $result]);
}

// POST /api/index.php/auth or /api/index.php/auth/login
if ($method === 'POST' && ($sub === '' || $sub === 'login')) {
    $email = $body['email'] ?? '';
    $password = $body['password'] ?? '';

    if (!$email || !$password) {
        respond(400, ['error' => 'Email et mot de passe requis']);
    }

    $result = supabase_auth_action('token?grant_type=password', [
        'email' => $email,
        'password' => $password
    ]);

    if (isset($result['error'])) {
        respond(401, ['error' => 'Identifiants incorrects']);
    }

    $access_token = $result['access_token'] ?? null;
    $user = $result['user'] ?? null;

    if (!$access_token || !$user) {
        respond(401, ['error' => 'Identifiants incorrects']);
    }

    $meta = $user['raw_user_meta_data'] ?? $user['user_metadata'] ?? [];
    $profile = [
        'id' => $user['id'],
        'full_name' => $meta['full_name'] ?? $user['email'],
        'phone' => $meta['phone'] ?? null,
        'role' => $meta['role'] ?? 'user'
    ];

    $profiles = supabase_get('profiles?id=eq.' . $user['id'], true);
    if (!empty($profiles[0])) {
        $profile = $profiles[0];
    }

    respond(200, [
        'user' => $user,
        'profile' => $profile,
        'session' => [
            'access_token' => $access_token,
            'refresh_token' => $result['refresh_token'] ?? null,
            'expires_in' => $result['expires_in'] ?? 3600,
            'expires_at' => $result['expires_at'] ?? null
        ]
    ]);
}

// GET /api/index.php/auth/profile
if ($method === 'GET' && $sub === 'profile') {
    $user = require_auth();

    $profile = null;
    $profiles = supabase_get('profiles?id=eq.' . $user['id'], true);
    if (!empty($profiles[0])) {
        $profile = $profiles[0];
    }

    if (!$profile) {
        $meta = $user['raw_user_meta_data'] ?? $user['user_metadata'] ?? [];
        $profile = [
            'id' => $user['id'],
            'full_name' => $meta['full_name'] ?? $user['email'],
            'phone' => $meta['phone'] ?? null,
            'role' => $meta['role'] ?? 'user',
            'avatar_url' => $meta['avatar_url'] ?? null
        ];
    }

    respond(200, $profile);
}

// PUT /api/index.php/auth/profile
if ($method === 'PUT' && $sub === 'profile') {
    $user = require_auth();
    $full_name = $body['full_name'] ?? null;
    $phone = $body['phone'] ?? null;

    $result = supabase_update(
        'profiles?id=eq.' . $user['id'],
        ['full_name' => $full_name, 'phone' => $phone, 'updated_at' => date('c')]
    );

    if (!empty($result[0])) {
        respond(200, $result[0]);
    }
    respond(500, ['error' => 'Erreur de mise a jour']);
}

respond(404, ['error' => 'Route auth non trouvee']);
