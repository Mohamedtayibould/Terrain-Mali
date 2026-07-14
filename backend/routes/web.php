<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function ($any = null) {
    $segments = request()->segments();

    if (isset($segments[0]) && $segments[0] === 'admin') {
        $path = public_path('admin.html');
        if (file_exists($path)) {
            return response()->file($path);
        }
        return response()->file(public_path('index.html'));
    }

    if ($segments && file_exists(public_path($segments[0]))) {
        return false;
    }

    $path = public_path('index.html');
    if (file_exists($path)) {
        return response()->file($path);
    }

    return response()->view('welcome');
})->where('any', '.*');
