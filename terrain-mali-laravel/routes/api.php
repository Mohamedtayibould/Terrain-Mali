<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TerrainController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\AdminController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth')->group(function () {
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::get('/reservations/my', [ReservationController::class, 'myReservations']);
    Route::patch('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);
    Route::post('/payments/pay', [PaymentController::class, 'pay']);
    Route::get('/payments/receipt/{id}', [PaymentController::class, 'receipt']);
});

Route::get('/terrains/cities', [TerrainController::class, 'cities']);
Route::get('/terrains', [TerrainController::class, 'index']);
Route::get('/terrains/{id}/slots', [TerrainController::class, 'slots']);
Route::get('/terrains/{id}', [TerrainController::class, 'show']);

Route::post('/payments/webhook', [PaymentController::class, 'webhook']);

Route::prefix('admin')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/stats', [AdminController::class, 'stats']);
    Route::get('/terrains', [AdminController::class, 'terrains']);
    Route::post('/terrains', [AdminController::class, 'storeTerrain']);
    Route::put('/terrains/{id}', [AdminController::class, 'updateTerrain']);
    Route::delete('/terrains/{id}', [AdminController::class, 'destroyTerrain']);
    Route::post('/photos', [AdminController::class, 'addPhoto']);
    Route::delete('/photos/{id}', [AdminController::class, 'deletePhoto']);
    Route::get('/reservations', [AdminController::class, 'reservations']);
    Route::get('/payments', [AdminController::class, 'payments']);
});
