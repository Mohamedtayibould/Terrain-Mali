<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$uri = strtok($uri, '?');
$uri = preg_replace('#^/api#', '', $uri);

$parts = array_filter(explode('/', $uri));
$resource = $parts[1] ?? '';
$sub = $parts[2] ?? '';
$third = $parts[3] ?? '';

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
        respond(404, ['error' => 'Route non trouvee']);
}
