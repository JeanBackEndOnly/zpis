<?php

use App\Http\Controllers\Admin\DepartmentsController;
use App\Http\Controllers\Admin\EmployeeProfileController;
use App\Http\Controllers\Admin\PositionController;
use App\Http\Controllers\Admin\UnitSectionController;
use App\Http\Controllers\Admin\UsersController;
use App\Http\Controllers\AuthenticationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes (strict limit to block brute-force login attempts)
Route::post('/login', [AuthenticationController::class, 'login'])
    ->middleware('throttle:login');

// Protected routes (require a valid Sanctum token)
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/logout', [AuthenticationController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Admin-only routes
    Route::middleware(['admin', 'throttle:admin'])
        ->prefix('admin')
        ->group(function () {
            Route::apiResource('departments', DepartmentsController::class)
                ->only(['index', 'store', 'show', 'update', 'destroy']);

            Route::apiResource('unit-sections', UnitSectionController::class)
                ->only(['index', 'store', 'show', 'update', 'destroy']);

            Route::apiResource('positions', PositionController::class)
                ->only(['index', 'store', 'show', 'update', 'destroy']);

            // Accounts (the Employees table: add, edit, delete)
            Route::apiResource('users', UsersController::class)
                ->only(['index', 'store', 'show', 'update', 'destroy']);

            // Employee profile page: one GET loads everything, one PUT per tab
            Route::prefix('employees/{user}')
                ->whereNumber('user')
                ->name('employees.')
                ->group(function () {
                    Route::get('/', [EmployeeProfileController::class, 'show'])->name('show');
                    Route::put('/personal', [EmployeeProfileController::class, 'updatePersonal'])->name('personal.update');
                    Route::put('/employment', [EmployeeProfileController::class, 'updateEmployment'])->name('employment.update');
                    Route::put('/leave', [EmployeeProfileController::class, 'updateLeave'])->name('leave.update');
                });
        });
});