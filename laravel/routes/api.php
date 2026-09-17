<?php

use App\Http\Controllers\Api\NoteSyncController;
use Illuminate\Support\Facades\Route;

Route::get('/notes', [NoteSyncController::class, 'index']);
Route::post('/notes/sync', [NoteSyncController::class, 'sync']);
