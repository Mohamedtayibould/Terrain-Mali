<?php
require_once __DIR__ . '/../config.php';

$path = $_SERVER['PATH_INFO'] ?? '';
if ($path) {
    $path = '/' . ltrim($path, '/');
} else {
    $route = $_GET['route'] ?? '';
    $path = $route ? '/' . $route : '';
}
$parts = array_values(array_filter(explode('/', $path)));
$resource = $parts[0] ?? '';

// Set PATH_INFO so sub-files can read it
$_SERVER['PATH_INFO'] = $path;

switch ($resource) {
    case 'health':
        respond(200, ['status' => 'ok', 'timestamp' => date('c')]);

    case 'debug':
        $user = require_auth();
        $meta_raw = $user['raw_user_meta_data'] ?? null;
        $meta_user = $user['user_metadata'] ?? null;
        $meta_app = $user['app_metadata'] ?? null;
        $profiles = supabase_get('profiles?id=eq.' . $user['id'] . '&select=*', true);
        respond(200, [
            'user_id' => $user['id'] ?? null,
            'email' => $user['email'] ?? null,
            'raw_user_meta_data' => $meta_raw,
            'user_metadata' => $meta_user,
            'app_metadata' => $meta_app,
            'profile_from_db' => $profiles
        ]);

    case 'debug-db':
        $profiles = supabase_get('profiles?select=*', true);
        respond(200, ['profiles' => $profiles]);

    case 'test-supabase':
        $terrains = supabase_get('terrains?select=id,name,city,price_per_hour&is_active=eq.true&limit=3');
        respond(200, ['terrains' => $terrains, 'count' => is_array($terrains) ? count($terrains) : 0]);

    case 'auth':
        require __DIR__ . '/auth.php';
        break;

    case 'terrains':
        require __DIR__ . '/terrains.php';
        break;

    case 'reservations':
        require __DIR__ . '/reservations.php';
        break;

    case 'payments':
        require __DIR__ . '/payments.php';
        break;

    case 'admin':
        require __DIR__ . '/admin.php';
        break;

    default:
        respond(404, ['error' => 'Route non trouvee: ' . $path]);
}
