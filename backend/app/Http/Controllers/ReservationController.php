<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SupabaseService;

class ReservationController extends Controller
{
    private SupabaseService $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function store(Request $request)
    {
        $request->validate([
            'terrain_id' => 'required|uuid',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
        ]);

        $userId = $request->user->id;

        $slotCheck = $this->supabase->rpc('check_slot_availability', [
            'p_terrain_id' => $request->terrain_id,
            'p_date' => $request->date,
            'p_start_time' => $request->start_time,
            'p_end_time' => $request->end_time,
        ]);

        if ($slotCheck['status'] !== 200 || $slotCheck['data'] !== true) {
            return response()->json([
                'message' => 'Ce créneau n\'est pas disponible',
            ], 400);
        }

        $terrainResult = $this->supabase->get(
            'terrains?id=eq.' . $request->terrain_id . '&select=id,price_per_hour'
        );

        if ($terrainResult['status'] !== 200 || empty($terrainResult['data'])) {
            return response()->json(['message' => 'Terrain non trouvé'], 404);
        }

        $terrain = $terrainResult['data'][0];
        $startMinutes = (int) substr($request->start_time, 0, 2) * 60 + (int) substr($request->start_time, 3, 2);
        $endMinutes = (int) substr($request->end_time, 0, 2) * 60 + (int) substr($request->end_time, 3, 2);
        $hours = ($endMinutes - $startMinutes) / 60;
        $totalPrice = $hours * ($terrain['price_per_hour'] ?? 0);

        $result = $this->supabase->post('reservations', [
            'user_id' => $userId,
            'terrain_id' => $request->terrain_id,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'total_price' => $totalPrice,
            'status' => 'pending',
        ], true);

        if ($result['status'] !== 201 && $result['status'] !== 200) {
            return response()->json([
                'message' => 'Erreur lors de la création de la réservation',
            ], 500);
        }

        $reservation = is_array($result['data']) ? (is_array($result['data'][0]) ? $result['data'][0] : $result['data']) : $result['data'];

        return response()->json(['reservation' => $reservation], 201);
    }

    public function myReservations(Request $request)
    {
        $userId = $request->user->id;

        $result = $this->supabase->get(
            'reservations?user_id=eq.' . $userId . '&order=date.desc,start_time.desc&select=*,terrains(name,city,address,photos:terrain_photos(url,is_primary))',
            true
        );

        $reservations = ($result['status'] === 200 && is_array($result['data']))
            ? $result['data']
            : [];

        return response()->json(['reservations' => $reservations]);
    }

    public function cancel(string $id, Request $request)
    {
        $userId = $request->user->id;

        $existing = $this->supabase->get(
            'reservations?id=eq.' . $id . '&user_id=eq.' . $userId . '&select=id,status',
            true
        );

        if ($existing['status'] !== 200 || empty($existing['data'])) {
            return response()->json(['message' => 'Réservation non trouvée'], 404);
        }

        $reservation = $existing['data'][0];

        if ($reservation['status'] === 'cancelled') {
            return response()->json(['message' => 'Réservation déjà annulée'], 400);
        }

        if ($reservation['status'] === 'completed') {
            return response()->json(['message' => 'Impossible d\'annuler une réservation terminée'], 400);
        }

        $result = $this->supabase->patch(
            'reservations?id=eq.' . $id,
            [
                'status' => 'cancelled',
                'updated_at' => now()->toIso8601String(),
            ],
            true
        );

        if ($result['status'] !== 200) {
            return response()->json(['message' => 'Erreur lors de l\'annulation'], 500);
        }

        return response()->json(['message' => 'Réservation annulée avec succès']);
    }
}
