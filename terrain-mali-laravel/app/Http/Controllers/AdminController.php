<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SupabaseService;

class AdminController extends Controller
{
    private SupabaseService $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function stats(Request $request)
    {
        $adminId = $request->user->id;

        $terrainsResult = $this->supabase->get(
            'terrains?owner_id=eq.' . $adminId . '&select=id',
            true
        );

        $terrainIds = [];
        if ($terrainsResult['status'] === 200 && is_array($terrainsResult['data'])) {
            $terrainIds = array_column($terrainsResult['data'], 'id');
        }

        $totalTerrains = count($terrainIds);
        $totalReservations = 0;
        $confirmedReservations = 0;
        $totalRevenue = 0;

        if (!empty($terrainIds)) {
            $ids = implode(',', array_map(fn($id) => '"' . $id . '"', $terrainIds));

            $resResult = $this->supabase->get(
                'reservations?terrain_id=in.(' . $ids . ')&select=id,status,total_price',
                true
            );

            if ($resResult['status'] === 200 && is_array($resResult['data'])) {
                $totalReservations = count($resResult['data']);
                $confirmedReservations = count(array_filter($resResult['data'], fn($r) => $r['status'] === 'confirmed'));
                $totalRevenue = array_sum(array_map(fn($r) => (float) ($r['total_price'] ?? 0), array_filter($resResult['data'], fn($r) => $r['status'] === 'confirmed')));
            }
        }

        return response()->json([
            'total_terrains' => $totalTerrains,
            'total_reservations' => $totalReservations,
            'confirmed_reservations' => $confirmedReservations,
            'total_revenue' => $totalRevenue,
        ]);
    }

    public function terrains(Request $request)
    {
        $adminId = $request->user->id;

        $result = $this->supabase->get(
            'terrains?owner_id=eq.' . $adminId . '&order=created_at.desc&select=*',
            true
        );

        $terrains = ($result['status'] === 200 && is_array($result['data']))
            ? $result['data']
            : [];

        foreach ($terrains as &$terrain) {
            $photosResult = $this->supabase->get(
                'terrain_photos?terrain_id=eq.' . $terrain['id'] . '&order=is_primary.desc'
            );
            $terrain['photos'] = ($photosResult['status'] === 200 && is_array($photosResult['data']))
                ? $photosResult['data']
                : [];
        }

        return response()->json(['terrains' => $terrains]);
    }

    public function storeTerrain(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'price_per_hour' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'opening_time' => 'nullable|string',
            'closing_time' => 'nullable|string',
            'surface' => 'nullable|numeric',
            'has_lighting' => 'nullable|boolean',
            'has_dressing_room' => 'nullable|boolean',
        ]);

        $adminId = $request->user->id;

        $terrainData = [
            'name' => $request->name,
            'address' => $request->address,
            'city' => $request->city,
            'price_per_hour' => $request->price_per_hour,
            'description' => $request->description ?? '',
            'opening_time' => $request->opening_time ?? '08:00',
            'closing_time' => $request->closing_time ?? '22:00',
            'surface' => $request->surface ?? null,
            'has_lighting' => $request->has_lighting ?? false,
            'has_dressing_room' => $request->has_dressing_room ?? false,
            'owner_id' => $adminId,
            'is_active' => true,
        ];

        $result = $this->supabase->post('terrains', $terrainData, true);

        if ($result['status'] !== 201 && $result['status'] !== 200) {
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }

        $terrain = is_array($result['data'])
            ? (is_array($result['data'][0]) ? $result['data'][0] : $result['data'])
            : $result['data'];

        return response()->json(['terrain' => $terrain], 201);
    }

    public function updateTerrain(Request $request, string $id)
    {
        $adminId = $request->user->id;

        $existing = $this->supabase->get(
            'terrains?id=eq.' . $id . '&owner_id=eq.' . $adminId . '&select=id',
            true
        );

        if ($existing['status'] !== 200 || empty($existing['data'])) {
            return response()->json(['message' => 'Terrain non trouvé'], 404);
        }

        $data = $request->only([
            'name', 'address', 'city', 'price_per_hour', 'description',
            'opening_time', 'closing_time', 'surface', 'has_lighting',
            'has_dressing_room', 'is_active',
        ]);

        $data['updated_at'] = now()->toIso8601String();

        $result = $this->supabase->patch(
            'terrains?id=eq.' . $id,
            $data,
            true
        );

        if ($result['status'] !== 200) {
            return response()->json(['message' => 'Erreur lors de la mise à jour'], 500);
        }

        $terrain = is_array($result['data'])
            ? (is_array($result['data'][0]) ? $result['data'][0] : $result['data'])
            : $result['data'];

        return response()->json(['terrain' => $terrain]);
    }

    public function destroyTerrain(string $id, Request $request)
    {
        $adminId = $request->user->id;

        $existing = $this->supabase->get(
            'terrains?id=eq.' . $id . '&owner_id=eq.' . $adminId . '&select=id',
            true
        );

        if ($existing['status'] !== 200 || empty($existing['data'])) {
            return response()->json(['message' => 'Terrain non trouvé'], 404);
        }

        $result = $this->supabase->patch(
            'terrains?id=eq.' . $id,
            [
                'is_active' => false,
                'updated_at' => now()->toIso8601String(),
            ],
            true
        );

        if ($result['status'] !== 200) {
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }

        return response()->json(['message' => 'Terrain supprimé avec succès']);
    }

    public function addPhoto(Request $request)
    {
        $request->validate([
            'terrain_id' => 'required|uuid',
            'url' => 'required|string',
            'is_primary' => 'nullable|boolean',
        ]);

        $adminId = $request->user->id;

        $existing = $this->supabase->get(
            'terrains?id=eq.' . $request->terrain_id . '&owner_id=eq.' . $adminId . '&select=id',
            true
        );

        if ($existing['status'] !== 200 || empty($existing['data'])) {
            return response()->json(['message' => 'Terrain non trouvé'], 404);
        }

        if ($request->is_primary) {
            $this->supabase->patch(
                'terrain_photos?terrain_id=eq.' . $request->terrain_id,
                ['is_primary' => false],
                true
            );
        }

        $result = $this->supabase->post('terrain_photos', [
            'terrain_id' => $request->terrain_id,
            'url' => $request->url,
            'is_primary' => $request->is_primary ?? false,
        ], true);

        if ($result['status'] !== 201 && $result['status'] !== 200) {
            return response()->json(['message' => 'Erreur lors de l\'ajout de la photo'], 500);
        }

        $photo = is_array($result['data'])
            ? (is_array($result['data'][0]) ? $result['data'][0] : $result['data'])
            : $result['data'];

        return response()->json(['photo' => $photo], 201);
    }

    public function deletePhoto(string $id, Request $request)
    {
        $adminId = $request->user->id;

        $existing = $this->supabase->get(
            'terrain_photos?id=eq.' . $id . '&select=id,terrain_id',
            true
        );

        if ($existing['status'] !== 200 || empty($existing['data'])) {
            return response()->json(['message' => 'Photo non trouvée'], 404);
        }

        $photo = $existing['data'][0];

        $terrainCheck = $this->supabase->get(
            'terrains?id=eq.' . $photo['terrain_id'] . '&owner_id=eq.' . $adminId . '&select=id',
            true
        );

        if ($terrainCheck['status'] !== 200 || empty($terrainCheck['data'])) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $result = $this->supabase->delete('terrain_photos?id=eq.' . $id, true);

        if ($result['status'] !== 200 && $result['status'] !== 204) {
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }

        return response()->json(['message' => 'Photo supprimée']);
    }

    public function reservations(Request $request)
    {
        $adminId = $request->user->id;

        $terrainsResult = $this->supabase->get(
            'terrains?owner_id=eq.' . $adminId . '&select=id',
            true
        );

        $terrainIds = [];
        if ($terrainsResult['status'] === 200 && is_array($terrainsResult['data'])) {
            $terrainIds = array_column($terrainsResult['data'], 'id');
        }

        if (empty($terrainIds)) {
            return response()->json(['reservations' => []]);
        }

        $ids = implode(',', array_map(fn($id) => '"' . $id . '"', $terrainIds));

        $result = $this->supabase->get(
            'reservations?terrain_id=in.(' . $ids . ')&order=date.desc,start_time.desc&select=*,terrains(name,city),profiles:user_id(full_name,phone)',
            true
        );

        $reservations = ($result['status'] === 200 && is_array($result['data']))
            ? $result['data']
            : [];

        return response()->json(['reservations' => $reservations]);
    }

    public function payments(Request $request)
    {
        $adminId = $request->user->id;

        $terrainsResult = $this->supabase->get(
            'terrains?owner_id=eq.' . $adminId . '&select=id',
            true
        );

        $terrainIds = [];
        if ($terrainsResult['status'] === 200 && is_array($terrainsResult['data'])) {
            $terrainIds = array_column($terrainsResult['data'], 'id');
        }

        if (empty($terrainIds)) {
            return response()->json(['payments' => []]);
        }

        $ids = implode(',', array_map(fn($id) => '"' . $id . '"', $terrainIds));

        $result = $this->supabase->get(
            'payments?reservation_id=in.(select id from reservations where terrain_id in (' . $ids . '))&order=created_at.desc&select=*,reservations(date,terrains(name))',
            true
        );

        $payments = ($result['status'] === 200 && is_array($result['data']))
            ? $result['data']
            : [];

        return response()->json(['payments' => $payments]);
    }
}
