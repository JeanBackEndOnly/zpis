<?php

use App\Http\Controllers\Admin\DepartmentsController;
use App\Http\Controllers\Admin\UnitSectionController;
use App\Http\Controllers\Admin\PositionController;
use App\Http\Controllers\Admin\UsersController;
use App\Http\Controllers\AuthenticationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthenticationController::class, 'login'])
    ->middleware('throttle:login');

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/logout', [AuthenticationController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::middleware(['admin', 'throttle:admin'])
        ->prefix('admin')
        ->group(function () {
            Route::apiResource('departments', DepartmentsController::class)
                ->only(['index', 'store', 'show', 'update', 'destroy']);

            Route::apiResource('unit-sections', UnitSectionController::class)
                ->only(['index', 'store', 'show', 'update', 'destroy']);

            Route::apiResource('positions', PositionController::class)
                ->only(['index', 'store', 'show', 'update', 'destroy']);

            Route::apiResource('users', UsersController::class)
                ->only(['index', 'store', 'show', 'update', 'destroy']);
        });
});