<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SupabaseService;

class PaymentController extends Controller
{
    private SupabaseService $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function pay(Request $request)
    {
        $request->validate([
            'reservation_id' => 'required|uuid',
        ]);

        $userId = $request->user->id;

        $reservationResult = $this->supabase->get(
            'reservations?id=eq.' . $request->reservation_id . '&user_id=eq.' . $userId . '&select=*,terrains(name)',
            true
        );

        if ($reservationResult['status'] !== 200 || empty($reservationResult['data'])) {
            return response()->json(['message' => 'Réservation non trouvée'], 404);
        }

        $reservation = $reservationResult['data'][0];

        if ($reservation['status'] === 'cancelled') {
            return response()->json(['message' => 'Réservation annulée'], 400);
        }

        $existingPayment = $this->supabase->get(
            'payments?reservation_id=eq.' . $request->reservation_id . '&status=eq.paid&select=id',
            true
        );

        if ($existingPayment['status'] === 200 && !empty($existingPayment['data'])) {
            return response()->json(['message' => 'Déjà payé'], 400);
        }

        $paymentResult = $this->supabase->post('payments', [
            'reservation_id' => $request->reservation_id,
            'user_id' => $userId,
            'amount' => $reservation['total_price'],
            'currency' => 'XOF',
            'status' => 'pending',
            'payment_method' => 'orange_money',
            'transaction_id' => 'DEMO_' . strtoupper(uniqid()),
        ], true);

        if ($paymentResult['status'] !== 201 && $paymentResult['status'] !== 200) {
            return response()->json(['message' => 'Erreur lors de la création du paiement'], 500);
        }

        $payment = is_array($paymentResult['data'])
            ? (is_array($paymentResult['data'][0]) ? $paymentResult['data'][0] : $paymentResult['data'])
            : $paymentResult['data'];

        $paymentUrl = url('/api/payments/webhook')
            . '?payment_id=' . ($payment['id'] ?? '')
            . '&status=completed';

        return response()->json([
            'payment' => $payment,
            'payment_url' => $paymentUrl,
            'message' => 'Redirigez vers payment_url pour simuler le paiement',
        ]);
    }

    public function webhook(Request $request)
    {
        $paymentId = $request->input('payment_id');
        $status = $request->input('status', 'completed');

        if (!$paymentId) {
            return response()->json(['message' => 'payment_id requis'], 400);
        }

        $paymentResult = $this->supabase->get(
            'payments?id=eq.' . $paymentId . '&select=*',
            true
        );

        if ($paymentResult['status'] !== 200 || empty($paymentResult['data'])) {
            return response()->json(['message' => 'Paiement non trouvé'], 404);
        }

        $payment = $paymentResult['data'][0];

        $paymentStatus = $status === 'completed' ? 'paid' : 'failed';

        $this->supabase->patch(
            'payments?id=eq.' . $paymentId,
            [
                'status' => $paymentStatus,
                'updated_at' => now()->toIso8601String(),
            ],
            true
        );

        if ($paymentStatus === 'paid') {
            $this->supabase->patch(
                'reservations?id=eq.' . $payment['reservation_id'],
                [
                    'status' => 'confirmed',
                    'updated_at' => now()->toIso8601String(),
                ],
                true
            );
        }

        return response()->json([
            'message' => 'Paiement traité',
            'status' => $paymentStatus,
        ]);
    }

    public function receipt(string $id, Request $request)
    {
        $userId = $request->user->id;

        $result = $this->supabase->get(
            'payments?id=eq.' . $id . '&user_id=eq.' . $userId . '&select=*,reservations(date,start_time,end_time,terrains(name,city,address))',
            true
        );

        if ($result['status'] !== 200 || empty($result['data'])) {
            return response()->json(['message' => 'Paiement non trouvé'], 404);
        }

        $payment = $result['data'][0];

        $profileResult = $this->supabase->get(
            'profiles?id=eq.' . $userId . '&select=full_name,phone,email',
            true
        );

        $profile = ($profileResult['status'] === 200 && !empty($profileResult['data']))
            ? $profileResult['data'][0]
            : null;

        return response()->json([
            'receipt' => [
                'payment' => $payment,
                'user' => $profile,
            ],
        ]);
    }
}
