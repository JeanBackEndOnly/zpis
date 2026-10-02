<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DepartmentRequest;
use App\Models\Department;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DepartmentsController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', Department::class);

            $departments = Department::query()
                ->when($request->filled('search'), function ($query) use ($request) {
                    $query->where('department_name', 'like', '%' . $request->search . '%');
                })
                ->orderBy('department_name')
                ->paginate($request->integer('per_page', 10));

            return response()->json([
                'status' => 1,
                'message' => 'Departments retrieved successfully.',
                'data' => $departments,
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function store(DepartmentRequest $request): JsonResponse
    {
        try {
            $this->authorize('create', Department::class);

            $department = Department::create($request->validated());

            return response()->json([
                'status' => 1,
                'message' => $department->department_name . ' has been created successfully.',
                'data' => $department,
            ], 201);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function show(Department $department): JsonResponse
    {
        try {
            $this->authorize('view', $department);

            return response()->json([
                'status' => 1,
                'message' => 'Department retrieved successfully.',
                'data' => $department,
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function update(DepartmentRequest $request, Department $department): JsonResponse
    {
        try {
            $this->authorize('update', $department);

            $department->update($request->validated());

            return response()->json([
                'status' => 1,
                'message' => $department->department_name . ' has been updated successfully.',
                'data' => $department->fresh(),
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function destroy(Department $department): JsonResponse
    {
        try {
            $this->authorize('delete', $department);

            // Block deletion while other records still depend on this department
            if ($department->unit_sections()->exists() || $department->positions()->exists()) {
                return response()->json([
                    'status' => 0,
                    'message' => 'Cannot delete ' . $department->department_name
                        . ' because it still has unit sections or positions.',
                ], 409);
            }

            $name = $department->department_name;
            $department->delete();

            return response()->json([
                'status' => 1,
                'message' => $name . ' has been deleted successfully.',
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    private function forbidden(): JsonResponse
    {
        return response()->json([
            'status' => 0,
            'message' => 'You are not authorized to perform this action.',
        ], 403);
    }

    private function serverError(\Throwable $e): JsonResponse
    {
        Log::error($e->getMessage(), ['exception' => $e]);

        return response()->json([
            'status' => 0,
            'message' => 'server error',
        ], 500);
    }
}