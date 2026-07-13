<?php
// auth.php
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?: [];

// Parse sub-action from URI
$uri = $_SERVER['REQUEST_URI'];
$uri = strtok($uri, '?');
$parts = array_filter(explode('/', preg_replace('#^/api/auth#', '', $uri)));
$sub = $parts[0] ?? '';

// POST /api/auth/register
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

    if (isset($result['message']) && $result['message'] !== 'Signup requires') {
        respond(201, ['message' => 'Compte cree avec succes', 'user' => $result['user'] ?? null]);
    }
    if (isset($result['error'])) {
        respond(400, ['error' => $result['message'] ?? $result['error']]);
    }
    respond(201, ['message' => 'Compte cree avec succes', 'user' => $result['user'] ?? null]);
}

// POST /api/auth/login
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

    // Get profile
    $meta = $user['raw_user_meta_data'] ?? $user['user_metadata'] ?? [];
    $profile = [
        'id' => $user['id'],
        'full_name' => $meta['full_name'] ?? $user['email'],
        'phone' => $meta['phone'] ?? null,
        'role' => $meta['role'] ?? 'user'
    ];

    $profiles = supabase_get('profiles?id=eq.' . $user['id']);
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

// GET /api/auth/profile
if ($method === 'GET' && $sub === 'profile') {
    $user = require_auth();

    $profile = null;
    $profiles = supabase_get('profiles?id=eq.' . $user['id']);
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

// PUT /api/auth/profile
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

respond(404, ['error' => 'Route non trouvee']);
