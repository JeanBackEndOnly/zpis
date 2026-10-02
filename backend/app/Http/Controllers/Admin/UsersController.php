<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UsersRequest;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UsersController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', User::class);

            $users = User::query()
                ->when($request->filled('user_role'), function ($query) use ($request) {
                    $query->where('user_role', $request->user_role);
                })
                ->when($request->filled('status'), function ($query) use ($request) {
                    $query->where('status', $request->status);
                })
                ->when($request->filled('search'), function ($query) use ($request) {
                    $search = '%' . $request->search . '%';
                    $query->where(function ($q) use ($search) {
                        $q->where('first_name', 'like', $search)
                          ->orWhere('middle_name', 'like', $search)
                          ->orWhere('last_name', 'like', $search)
                          ->orWhere('email', 'like', $search);
                    });
                })
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->paginate($request->integer('per_page', 10));

            return response()->json([
                'status' => 1,
                'message' => 'Users retrieved successfully.',
                'data' => $users,
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function store(UsersRequest $request): JsonResponse
    {
        try {
            $this->authorize('create', User::class);

            // The password is hashed automatically by the model's 'hashed' cast
            $user = User::create($request->validated());

            return response()->json([
                'status' => 1,
                'message' => $user->full_name . ' has been created successfully.',
                'data' => $user,
            ], 201);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function show(User $user): JsonResponse
    {
        try {
            $this->authorize('view', $user);

            return response()->json([
                'status' => 1,
                'message' => 'User retrieved successfully.',
                'data' => $user,
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function update(UsersRequest $request, User $user): JsonResponse
    {
        try {
            $this->authorize('update', $user);

            $data = $request->validated();

            // Leaving the password blank means "keep the current password"
            if (empty($data['password'])) {
                unset($data['password']);
            }

            // Prevent an admin from locking themselves out
            $newRole = $data['user_role'] ?? $user->user_role;
            $newStatus = $data['status'] ?? $user->status;

            if ($request->user()->is($user)
                && ($newRole !== User::ROLE_ADMIN || $newStatus !== User::STATUS_ACTIVE)) {
                return response()->json([
                    'status' => 0,
                    'message' => 'You cannot remove your own admin role or deactivate your own account.',
                ], 422);
            }

            $user->update($data);

            // A deactivated/inactive user must not keep a working token
            if ($user->status !== User::STATUS_ACTIVE) {
                $user->tokens()->delete();
            }

            return response()->json([
                'status' => 1,
                'message' => $user->full_name . ' has been updated successfully.',
                'data' => $user->fresh(),
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        try {
            $this->authorize('delete', $user);

            if ($request->user()->is($user)) {
                return response()->json([
                    'status' => 0,
                    'message' => 'You cannot delete your own account.',
                ], 422);
            }

            $name = $user->full_name;

            $user->tokens()->delete();
            $user->delete();

            return response()->json([
                'status' => 1,
                'message' => $name . ' has been deleted successfully.',
            ], 200);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (QueryException $e) {
            // SQLSTATE 23000 = foreign key constraint (other records still use this user)
            if ((string) $e->getCode() === '23000') {
                return response()->json([
                    'status' => 0,
                    'message' => 'Cannot delete this user because they still have related records. Deactivate the account instead.',
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