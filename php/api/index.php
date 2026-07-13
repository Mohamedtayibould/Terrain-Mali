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

switch ($resource) {
    case 'health':
        respond(200, ['status' => 'ok', 'timestamp' => date('c')]);

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
