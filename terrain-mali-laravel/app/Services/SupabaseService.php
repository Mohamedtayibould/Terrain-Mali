<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SupabaseService
{
    private string $url;
    private string $anonKey;
    private string $serviceKey;

    public function __construct()
    {
        $this->url = config('supabase.url');
        $this->anonKey = config('supabase.anon_key');
        $this->serviceKey = config('supabase.service_key');
    }

    public function get(string $endpoint, bool $useService = false): array
    {
        $key = $useService ? $this->serviceKey : $this->anonKey;

        $response = Http::withHeaders([
            'apikey' => $key,
            'Authorization' => 'Bearer ' . $key,
            'Content-Type' => 'application/json',
        ])->get($this->url . '/rest/v1/' . $endpoint);

        return [
            'status' => $response->status(),
            'data' => $response->json(),
        ];
    }

    public function post(string $endpoint, array $data = [], bool $useService = false): array
    {
        $key = $useService ? $this->serviceKey : $this->anonKey;

        $response = Http::withHeaders([
            'apikey' => $key,
            'Authorization' => 'Bearer ' . $key,
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation',
        ])->post($this->url . '/rest/v1/' . $endpoint, $data);

        return [
            'status' => $response->status(),
            'data' => $response->json(),
        ];
    }

    public function patch(string $endpoint, array $data, bool $useService = false): array
    {
        $key = $useService ? $this->serviceKey : $this->anonKey;

        $response = Http::withHeaders([
            'apikey' => $key,
            'Authorization' => 'Bearer ' . $key,
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation',
        ])->patch($this->url . '/rest/v1/' . $endpoint, $data);

        return [
            'status' => $response->status(),
            'data' => $response->json(),
        ];
    }

    public function delete(string $endpoint, bool $useService = false): array
    {
        $key = $useService ? $this->serviceKey : $this->anonKey;

        $response = Http::withHeaders([
            'apikey' => $key,
            'Authorization' => 'Bearer ' . $key,
            'Content-Type' => 'application/json',
        ])->delete($this->url . '/rest/v1/' . $endpoint);

        return [
            'status' => $response->status(),
            'data' => $response->json(),
        ];
    }

    public function rpc(string $function, array $params = [], bool $useService = false): array
    {
        $key = $useService ? $this->serviceKey : $this->anonKey;

        $response = Http::withHeaders([
            'apikey' => $key,
            'Authorization' => 'Bearer ' . $key,
            'Content-Type' => 'application/json',
        ])->post($this->url . '/rest/v1/rpc/' . $function, $params);

        return [
            'status' => $response->status(),
            'data' => $response->json(),
        ];
    }

    public function auth(string $action, array $data = []): array
    {
        $response = Http::withHeaders([
            'apikey' => $this->anonKey,
            'Content-Type' => 'application/json',
        ])->post($this->url . '/auth/v1/' . $action, $data);

        return [
            'status' => $response->status(),
            'data' => $response->json(),
        ];
    }

    public function authGet(string $action, string $token): array
    {
        $response = Http::withHeaders([
            'apikey' => $this->anonKey,
            'Authorization' => 'Bearer ' . $token,
            'Content-Type' => 'application/json',
        ])->get($this->url . '/auth/v1/' . $action);

        return [
            'status' => $response->status(),
            'data' => $response->json(),
        ];
    }

    public function adminPatch(string $userId, array $data): array
    {
        $response = Http::withHeaders([
            'apikey' => $this->serviceKey,
            'Authorization' => 'Bearer ' . $this->serviceKey,
            'Content-Type' => 'application/json',
        ])->patch($this->url . '/auth/v1/admin/users/' . $userId, $data);

        return [
            'status' => $response->status(),
            'data' => $response->json(),
        ];
    }
}
