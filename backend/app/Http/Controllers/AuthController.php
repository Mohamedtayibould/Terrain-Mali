<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SupabaseService;

class AuthController extends Controller
{
    private SupabaseService $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $result = $this->supabase->auth('token?grant_type=password', [
            'email' => $request->email,
            'password' => $request->password,
        ]);

        if ($result['status'] !== 200 || isset($result['data']['error'])) {
            return response()->json([
                'message' => $result['data']['error_description'] ?? $result['data']['error'] ?? 'Email ou mot de passe incorrect',
            ], 401);
        }

        $user = $result['data']['user'] ?? null;
        $session = $result['data'] ?? null;

        $profile = null;
        if ($user) {
            $profileResult = $this->supabase->get(
                'profiles?id=' . $user['id'] . '&select=*',
                true
            );
            if ($profileResult['status'] === 200 && !empty($profileResult['data'])) {
                $profile = $profileResult['data'][0];
            }
        }

        return response()->json([
            'user' => $user,
            'session' => $session,
            'profile' => $profile,
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'full_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $result = $this->supabase->auth('signup', [
            'email' => $request->email,
            'password' => $request->password,
            'data' => [
                'full_name' => $request->full_name,
                'phone' => $request->phone ?? '',
            ],
        ]);

        if ($result['status'] !== 200 || isset($result['data']['error'])) {
            return response()->json([
                'message' => $result['data']['error_description'] ?? $result['data']['error'] ?? "Erreur lors de l'inscription",
            ], 400);
        }

        $user = $result['data']['user'] ?? null;
        $session = $result['data'] ?? null;

        if ($user) {
            $this->supabase->post('profiles', [
                'id' => $user['id'],
                'full_name' => $request->full_name,
                'phone' => $request->phone ?? '',
                'role' => 'user',
                'avatar_url' => null,
            ], true);
        }

        $profile = null;
        if ($user) {
            $profileResult = $this->supabase->get(
                'profiles?id=' . $user['id'] . '&select=*',
                true
            );
            if ($profileResult['status'] === 200 && !empty($profileResult['data'])) {
                $profile = $profileResult['data'][0];
            }
        }

        return response()->json([
            'user' => $user,
            'session' => $session,
            'profile' => $profile,
        ], 201);
    }

    public function profile(Request $request)
    {
        $userId = $request->user->id;

        $result = $this->supabase->get(
            'profiles?id=' . $userId . '&select=*',
            true
        );

        if ($result['status'] !== 200 || empty($result['data'])) {
            return response()->json(['message' => 'Profil non trouvé'], 404);
        }

        return response()->json(['profile' => $result['data'][0]]);
    }

    public function updateProfile(Request $request)
    {
        $userId = $request->user->id;

        $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'avatar_url' => 'sometimes|nullable|string',
        ]);

        $data = $request->only(['full_name', 'phone', 'avatar_url']);
        $data['updated_at'] = now()->toIso8601String();

        $result = $this->supabase->patch(
            'profiles?id=eq.' . $userId,
            $data,
            true
        );

        if ($result['status'] !== 200) {
            return response()->json(['message' => 'Erreur lors de la mise à jour'], 500);
        }

        $profileResult = $this->supabase->get(
            'profiles?id=' . $userId . '&select=*',
            true
        );

        return response()->json([
            'profile' => $profileResult['data'][0] ?? null,
        ]);
    }
}
