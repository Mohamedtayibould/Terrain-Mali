<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?: [];

$secret = $body['secret'] ?? '';
if ($secret !== 'terrain-setup-2024') {
    respond(403, ['error' => 'Invalid secret']);
}

$admin_email = 'tayibould.mohamed.23@ump.ac.ma';

$users_result = supabase_auth_action('admin/users', null);
if (isset($users_result['users'])) {
    foreach ($users_result['users'] as $u) {
        if (($u['email'] ?? '') === $admin_email) {
            $user_id = $u['id'];

            $existing = supabase_get('profiles?id=eq.' . $user_id, true);
            if (empty($existing)) {
                supabase_insert('profiles', [
                    'id' => $user_id,
                    'email' => $admin_email,
                    'full_name' => 'Admin Terrain Mali',
                    'phone' => '0693603562',
                    'role' => 'admin',
                    'created_at' => date('c'),
                    'updated_at' => date('c')
                ]);
            } else {
                supabase_update('profiles?id=eq.' . $user_id, [
                    'role' => 'admin',
                    'updated_at' => date('c')
                ]);
            }

            $patch_result = http_request(
                SUPABASE_URL . '/auth/v1/admin/users/' . $user_id,
                'PATCH',
                [
                    'apikey: ' . SUPABASE_ANON_KEY,
                    'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
                    'Content-Type: application/json'
                ],
                json_encode(['user_metadata' => ['role' => 'admin', 'full_name' => 'Admin Terrain Mali']])
            );

            respond(200, [
                'message' => 'Admin user fixed',
                'user_id' => $user_id,
                'profile_updated' => true,
                'metadata_updated' => true
            ]);
        }
    }
}

respond(404, ['error' => 'Admin user not found in Supabase Auth']);
