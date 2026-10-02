<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PositionRequest;
use App\Models\Position;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PositionController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', Position::class);

            $positions = Position::query()
                ->with('department')
                ->when($request->filled('department_id'), function ($query) use ($request) {
                    $query->where('department_id', $request->department_id);
                })
                ->when($request->filled('search'), function ($query) use ($request) {
                    $query->where('position_title', 'like', '%' . $request->search . '%');
                })
                ->orderBy('position_title')
                ->paginate($request->integer('per_page', 10));

            return response()->json([
                'status' => 1,
                'message' => 'Positions retrieved successfully.',
                'data' => $positions,
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function store(PositionRequest $request): JsonResponse
    {
        try {
            $this->authorize('create', Position::class);

            $position = Position::create($request->validated());

            return response()->json([
                'status' => 1,
                'message' => $position->position_title . ' has been created successfully.',
                'data' => $position->load('department'),
            ], 201);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function show(Position $position): JsonResponse
    {
        try {
            $this->authorize('view', $position);

            return response()->json([
                'status' => 1,
                'message' => 'Position retrieved successfully.',
                'data' => $position->load('department'),
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function update(PositionRequest $request, Position $position): JsonResponse
    {
        try {
            $this->authorize('update', $position);

            $position->update($request->validated());

            return response()->json([
                'status' => 1,
                'message' => $position->position_title . ' has been updated successfully.',
                'data' => $position->fresh('department'),
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function destroy(Position $position): JsonResponse
    {
        try {
            $this->authorize('delete', $position);

            $title = $position->position_title;
            $position->delete();

            return response()->json([
                'status' => 1,
                'message' => $title . ' has been deleted successfully.',
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (QueryException $e) {
            // SQLSTATE 23000 = foreign key constraint (other records still use this position)
            if ((string) $e->getCode() === '23000') {
                return response()->json([
                    'status' => 0,
                    'message' => 'Cannot delete this position because it is still in use.',
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