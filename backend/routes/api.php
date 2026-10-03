<?php

use App\Http\Controllers\Admin\DepartmentsController;
use App\Http\Controllers\Admin\EmployeeProfileController;
use App\Http\Controllers\Admin\PositionController;
use App\Http\Controllers\Admin\UnitSectionController;
use App\Http\Controllers\Admin\ScheduleTemplateController;
use App\Http\Controllers\Admin\EmployeeScheduleController;
use App\Http\Controllers\Admin\LeaveDetailsController;
use App\Http\Controllers\Admin\Personnel201FilesController;
use App\Http\Controllers\Admin\UsersController;
use App\Http\Controllers\AuthenticationController;
use App\Http\Controllers\LeaveRequestController;
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

    // Employee self-service: file and follow your own leave requests
    Route::apiResource('leave-requests', LeaveRequestController::class)
        ->parameters(['leave-requests' => 'leave_detail'])
        ->only(['index', 'store', 'show', 'destroy']);

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

            Route::apiResource('schedules', ScheduleTemplateController::class)
                ->parameters(['schedules' => 'schedule_template'])
                ->only(['index', 'store', 'show', 'update', 'destroy']);

            // Leave requests: review, approve, disapprove, delete
            Route::apiResource('leave-details', LeaveDetailsController::class)
                ->parameters(['leave-details' => 'leave_detail'])
                ->only(['index', 'show', 'destroy']);

            Route::put('leave-details/{leave_detail}/approve', [LeaveDetailsController::class, 'approve'])
                ->whereNumber('leave_detail')
                ->name('leave-details.approve');

            Route::put('leave-details/{leave_detail}/disapprove', [LeaveDetailsController::class, 'disapprove'])
                ->whereNumber('leave_detail')
                ->name('leave-details.disapprove');

            // Personnel 201 files: every employee's documents
            Route::prefix('personnel-201-files')
                ->name('personnel-201-files.')
                ->group(function () {
                    Route::get('/', [Personnel201FilesController::class, 'index'])->name('index');
                    Route::get('employee/{employee_information}', [Personnel201FilesController::class, 'show'])
                        ->whereNumber('employee_information')->name('show');
                    Route::post('employee/{employee_information}', [Personnel201FilesController::class, 'store'])
                        ->whereNumber('employee_information')->name('store');
                    Route::post('{personnel_file}', [Personnel201FilesController::class, 'update'])
                        ->whereNumber('personnel_file')->name('update');
                    Route::get('{personnel_file}/download', [Personnel201FilesController::class, 'download'])
                        ->whereNumber('personnel_file')->name('download');
                    Route::delete('{personnel_file}', [Personnel201FilesController::class, 'destroy'])
                        ->whereNumber('personnel_file')->name('destroy');
                });

            Route::get('employee-schedules/employees', [EmployeeScheduleController::class, 'employees']);
            Route::get('employee-schedules/export', [EmployeeScheduleController::class, 'export']);

            Route::apiResource('employee-schedules', EmployeeScheduleController::class)
                ->parameters(['employee-schedules' => 'employee_schedule'])
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