<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AnnouncementRequest;
use App\Models\Announcement;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Announcement management for authenticated employees/admin users.
 *
 * Handles creating, viewing, updating, and deleting announcements
 * together with their uploaded files.
 */
class AnnouncementController extends Controller
{
    use AuthorizesRequests;

    private const RELATIONS = [
        'employee_information',
        'announcement_files',
    ];

    /**
     * GET /announcements
     *
     * Retrieve announcements, newest first.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $announcements = Announcement::query()
                ->with(self::RELATIONS)
                ->orderByDesc('id')
                ->paginate($request->integer('per_page', 10));

            return response()->json([
                'status'  => 1,
                'message' => 'Announcements retrieved successfully.',
                'data'    => $announcements,
            ]);
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * POST /announcements
     *
     * Create a new announcement.
     */
    public function store(AnnouncementRequest $request): JsonResponse
    {
        try {
            $employee = $request->user()->employee_information;

            if (! $employee) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Your employment details have not been set up yet. Please contact HR.',
                ], 422);
            }

            $this->authorize('create', Announcement::class);

            $data = $request->validated();

            $announcement = DB::transaction(function () use ($employee, $data, $request) {
                $announcement = Announcement::create([
                    'employee_id'              => $employee->id,
                    'announcement_title'       => $data['announcement_title'],
                    'announcement_description' => $data['announcement_description'],
                ]);

                if ($request->hasFile('announcement_files')) {
                    foreach ($request->file('announcement_files') as $file) {
                        $fileName = $file->getClientOriginalName();

                        $filePath = $file->store(
                            'announcements',
                            'public'
                        );

                        $announcement->announcement_files()->create([
                            'file_name'         => $fileName,
                            'announcement_file' => $filePath,
                        ]);
                    }
                }

                return $announcement;
            });

            return response()->json([
                'status'  => 1,
                'message' => 'Announcement created successfully.',
                'data'    => $announcement->load(self::RELATIONS),
            ], 201);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * GET /announcements/{announcement}
     *
     * Retrieve a single announcement.
     */
    public function show(Announcement $announcement): JsonResponse
    {
        try {
            $this->authorize('view', $announcement);

            return response()->json([
                'status'  => 1,
                'message' => 'Announcement retrieved successfully.',
                'data'    => $announcement->load(self::RELATIONS),
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * PUT/PATCH /announcements/{announcement}
     *
     * Update an announcement.
     */
    public function update(
        AnnouncementRequest $request,
        Announcement $announcement
    ): JsonResponse {
        try {
            $this->authorize('update', $announcement);

            $data = $request->validated();

            DB::transaction(function () use ($announcement, $data, $request) {
                $announcement->update([
                    'announcement_title'       => $data['announcement_title'],
                    'announcement_description' => $data['announcement_description'],
                ]);

                /*
                 * If new files are uploaded, add them to the existing files.
                 * Existing files are not automatically deleted.
                 */
                if ($request->hasFile('announcement_files')) {
                    foreach ($request->file('announcement_files') as $file) {
                        $fileName = $file->getClientOriginalName();

                        $filePath = $file->store(
                            'announcements',
                            'public'
                        );

                        $announcement->announcement_files()->create([
                            'file_name'         => $fileName,
                            'announcement_file' => $filePath,
                        ]);
                    }
                }
            });

            return response()->json([
                'status'  => 1,
                'message' => 'Announcement updated successfully.',
                'data'    => $announcement->fresh()->load(self::RELATIONS),
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * DELETE /announcements/{announcement}
     *
     * Delete an announcement and its uploaded files.
     */
    public function destroy(Announcement $announcement): JsonResponse
    {
        try {
            $this->authorize('delete', $announcement);

            DB::transaction(function () use ($announcement) {
                $announcement->load('announcement_files');

                foreach ($announcement->announcement_files as $file) {
                    if ($file->announcement_file) {
                        Storage::disk('public')->delete(
                            $file->announcement_file
                        );
                    }
                }

                $announcement->delete();
            });

            return response()->json([
                'status'  => 1,
                'message' => 'Announcement deleted successfully.',
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * Return a forbidden JSON response.
     */
    private function forbidden(): JsonResponse
    {
        return response()->json([
            'status'  => 0,
            'message' => 'You are not authorized to perform this action.',
        ], 403);
    }

    /**
     * Return a server error JSON response.
     */
    private function serverError(\Throwable $e): JsonResponse
    {
        Log::error($e->getMessage(), [
            'exception' => $e,
        ]);

        return response()->json([
            'status'  => 0,
            'message' => 'server error',
        ], 500);
    }
}