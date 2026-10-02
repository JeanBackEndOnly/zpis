<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UnitSectionRequest;
use App\Models\UnitSection;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UnitSectionController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', UnitSection::class);

            $unitSections = UnitSection::query()
                ->with('department')
                ->when($request->filled('department_id'), function ($query) use ($request) {
                    $query->where('department_id', $request->department_id);
                })
                ->when($request->filled('search'), function ($query) use ($request) {
                    $search = '%' . $request->search . '%';
                    $query->where(function ($q) use ($search) {
                        $q->where('unit_section_name', 'like', $search)
                          ->orWhere('unit_section_code', 'like', $search);
                    });
                })
                ->orderBy('unit_section_name')
                ->paginate($request->integer('per_page', 10));

            return response()->json([
                'status' => 1,
                'message' => 'Unit sections retrieved successfully.',
                'data' => $unitSections,
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function store(UnitSectionRequest $request): JsonResponse
    {
        try {
            $this->authorize('create', UnitSection::class);

            $unitSection = UnitSection::create($request->validated());

            return response()->json([
                'status' => 1,
                'message' => $unitSection->unit_section_name . ' has been created successfully.',
                'data' => $unitSection->load('department'),
            ], 201);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function show(UnitSection $unitSection): JsonResponse
    {
        try {
            $this->authorize('view', $unitSection);

            return response()->json([
                'status' => 1,
                'message' => 'Unit section retrieved successfully.',
                'data' => $unitSection->load('department'),
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function update(UnitSectionRequest $request, UnitSection $unitSection): JsonResponse
    {
        try {
            $this->authorize('update', $unitSection);

            $unitSection->update($request->validated());

            return response()->json([
                'status' => 1,
                'message' => $unitSection->unit_section_name . ' has been updated successfully.',
                'data' => $unitSection->fresh('department'),
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function destroy(UnitSection $unitSection): JsonResponse
    {
        try {
            $this->authorize('delete', $unitSection);

            $name = $unitSection->unit_section_name;
            $unitSection->delete();

            return response()->json([
                'status' => 1,
                'message' => $name . ' has been deleted successfully.',
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (QueryException $e) {
            // SQLSTATE 23000 = foreign key constraint (other records still use this unit section)
            if ((string) $e->getCode() === '23000') {
                return response()->json([
                    'status' => 0,
                    'message' => 'Cannot delete this unit section because it is still in use.',
                ], 409);
            }

            return $this->serverError($e);
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