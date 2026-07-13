<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

// Remove /api prefix
if (preg_match('#^(/[^/]*?)?/api#', $uri, $m)) {
    $prefix = $m[1] ?? '';
    $uri = preg_replace('#^' . preg_quote($prefix) . '/api#', '', $uri);
}

$uri = rtrim($uri, '/');
if ($uri === '') $uri = '/';

// Parse resource and sub-resource
$segments = array_values(array_filter(explode('/', $uri)));
$resource = $segments[0] ?? '';
$sub = $segments[1] ?? '';
$id = $segments[2] ?? '';

// Also check query params as fallback
if (!$resource && isset($_GET['action'])) {
    $resource = $_GET['action'];
}
if (!$sub && isset($_GET['sub'])) {
    $sub = $_GET['sub'];
}
if (!$id && isset($_GET['id'])) {
    $id = $_GET['id'];
}

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
        respond(404, ['error' => 'Route non trouvee: ' . $uri]);
}
