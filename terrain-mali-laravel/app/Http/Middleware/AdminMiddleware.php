<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user ?? null;

        if (!$user) {
            return response()->json(['message' => 'Non autorisé'], 401);
        }

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        return $next($request);
    }
}
