<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SupabaseService;

class TerrainController extends Controller
{
    private SupabaseService $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function index(Request $request)
    {
        $query = 'terrains?is_active=eq.true&order=created_at.desc';

        if ($request->has('city') && $request->city !== '') {
            $query .= '&city=eq.' . urlencode($request->city);
        }

        if ($request->has('search') && $request->search !== '') {
            $search = urlencode($request->search);
            $query .= '&or=(name.ilike.*' . $search . '*,address.ilike.*' . $search . '*)';
        }

        $page = max(1, (int) $request->input('page', 1));
        $limit = max(1, min(50, (int) $request->input('limit', 20)));
        $offset = ($page - 1) * $limit;

        $query .= '&limit=' . $limit . '&offset=' . $offset;

        $result = $this->supabase->get($query);

        $countQuery = 'terrains?is_active=eq.true&select=count';
        if ($request->has('city') && $request->city !== '') {
            $countQuery .= '&city=eq.' . urlencode($request->city);
        }
        if ($request->has('search') && $request->search !== '') {
            $search = urlencode($request->search);
            $countQuery .= '&or=(name.ilike.*' . $search . '*,address.ilike.*' . $search . '*)';
        }
        $countResult = $this->supabase->get($countQuery, true);

        $terrains = [];
        if ($result['status'] === 200 && is_array($result['data'])) {
            $terrainIds = array_column($result['data'], 'id');
            foreach ($result['data'] as $terrain) {
                $photosResult = $this->supabase->get(
                    'terrain_photos?terrain_id=eq.' . $terrain['id'] . '&order=is_primary.desc'
                );
                $terrain['photos'] = ($photosResult['status'] === 200 && is_array($photosResult['data']))
                    ? $photosResult['data']
                    : [];
                $terrains[] = $terrain;
            }
        }

        $total = 0;
        if ($countResult['status'] === 200 && is_array($countResult['data'])) {
            $total = (int) ($countResult['data'][0]['count'] ?? count($terrains));
        }

        return response()->json([
            'terrains' => $terrains,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => (int) ceil($total / $limit),
        ]);
    }

    public function cities()
    {
        $result = $this->supabase->get('terrains?is_active=eq.true&select=city');

        $cities = [];
        if ($result['status'] === 200 && is_array($result['data'])) {
            $cities = array_unique(array_column($result['data'], 'city'));
            $cities = array_values(array_filter($cities));
            sort($cities);
        }

        return response()->json(['cities' => $cities]);
    }

    public function show(string $id)
    {
        $result = $this->supabase->get('terrains?id=eq.' . $id . '&is_active=eq.true&select=*');

        if ($result['status'] !== 200 || empty($result['data'])) {
            return response()->json(['message' => 'Terrain non trouvé'], 404);
        }

        $terrain = $result['data'][0];

        $photosResult = $this->supabase->get(
            'terrain_photos?terrain_id=eq.' . $id . '&order=is_primary.desc'
        );
        $terrain['photos'] = ($photosResult['status'] === 200 && is_array($photosResult['data']))
            ? $photosResult['data']
            : [];

        return response()->json(['terrain' => $terrain]);
    }

    public function slots(string $id, Request $request)
    {
        $date = $request->input('date', now()->format('Y-m-d'));

        $terrainResult = $this->supabase->get('terrains?id=eq.' . $id . '&select=id,opening_time,closing_time');
        if ($terrainResult['status'] !== 200 || empty($terrainResult['data'])) {
            return response()->json(['message' => 'Terrain non trouvé'], 404);
        }

        $terrain = $terrainResult['data'][0];

        $result = $this->supabase->rpc('get_available_slots', [
            'p_terrain_id' => $id,
            'p_date' => $date,
        ]);

        return response()->json([
            'terrain_id' => $id,
            'date' => $date,
            'opening_time' => $terrain['opening_time'] ?? null,
            'closing_time' => $terrain['closing_time'] ?? null,
            'slots' => ($result['status'] === 200 && is_array($result['data']))
                ? $result['data']
                : [],
        ]);
    }
}
