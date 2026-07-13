<?php
header('Content-Type: application/json');
include_once __DIR__ . '/../config.php';

$result = ['step' => 'config_loaded'];

$token = get_bearer_token();
$result['token_found'] = ($token !== null);
$result['token_length'] = $token ? strlen($token) : 0;

echo json_encode($result, JSON_PRETTY_PRINT);
