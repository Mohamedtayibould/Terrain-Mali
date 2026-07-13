<?php
header('Content-Type: application/json');

$curl = function_exists('curl_init');
$fopen = ini_get('allow_url_fopen');

echo json_encode([
    'php_version' => PHP_VERSION,
    'curl_available' => $curl,
    'allow_url_fopen' => $fopen,
    'message' => 'PHP fonctionne sur ce serveur'
], JSON_PRETTY_PRINT);
