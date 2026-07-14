<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Services\SupabaseService;

class AuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = null;

        $bearer = $request->bearerToken();
        if ($bearer) {
            $token = $bearer;
        }

        if (!$token) {
            return response()->json(['message' => 'Token manquant'], 401);
        }

        try {
            $key = config('supabase.anon_key');
            $decoded = JWT::decode($token, new Key($key, 'HS256'));

            $userId = $decoded->sub ?? null;
            $email = $decoded->email ?? null;
            $userMetadata = $decoded->user_metadata ?? [];

            $role = $userMetadata['role'] ?? null;

            if (!$role) {
                $supabase = app(SupabaseService::class);
                $result = $supabase->get(
                    'profiles?id=' . $userId . '&select=role',
                    true
                );

                if ($result['status'] === 200 && !empty($result['data'])) {
                    $role = $result['data'][0]['role'] ?? 'user';
                } else {
                    $role = 'user';
                }
            }

            $request->merge([
                'user' => [
                    'id' => $userId,
                    'email' => $email,
                    'role' => $role,
                    'user_metadata' => $userMetadata,
                ],
            ]);

            $request->user = (object) [
                'id' => $userId,
                'email' => $email,
                'role' => $role,
                'user_metadata' => $userMetadata,
            ];

        } catch (\Exception $e) {
            return response()->json(['message' => 'Token invalide'], 401);
        }

        return $next($request);
    }
}
