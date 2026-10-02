<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthenticationController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 401);
        }

        if (! $user->isActive()) {
            return response()->json([
                'message' => 'Your account is ' . strtolower($user->status) . '. Please contact HR or an administrator.',
            ], 403);
        }

        $token = $user->createToken('auth_token', [$user->user_role])->plainTextToken;

        return response()->json([
            'message'    => 'Login successful.',
            'token_type' => 'Bearer',
            'token'      => $token,
            'user'       => [
                'id'        => $user->id,
                'email'     => $user->email,
                'user_role' => $user->user_role,
                'status'    => $user->status,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}