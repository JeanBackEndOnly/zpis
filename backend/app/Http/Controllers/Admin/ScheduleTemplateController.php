<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ScheduleTemplateRequest;
use App\Models\ScheduleTemplate;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ScheduleTemplateController extends Controller
{
    use AuthorizesRequests;

    /**
     * GET /schedules?search=&shift=&per_page=15
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', ScheduleTemplate::class);

            $perPage = min((int) $request->input('per_page', 15), 100);

            $schedule_templates = ScheduleTemplate::query()
                ->when($request->filled('search'), function ($query) use ($request) {
                    $query->where('schedule_name', 'like', '%' . $request->input('search') . '%');
                })
                ->when($request->filled('shift'), function ($query) use ($request) {
                    $query->where('shift', $request->input('shift'));
                })
                ->orderBy('schedule_name')
                ->paginate($perPage);

            return response()->json([
                'status' => 1,
                'data'   => $schedule_templates,
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * POST /schedules
     */
    public function store(ScheduleTemplateRequest $request): JsonResponse
    {
        try {
            $this->authorize('create', ScheduleTemplate::class);

            $schedule_template = ScheduleTemplate::create($request->validated());

            return response()->json([
                'status'  => 1,
                'message' => $schedule_template->schedule_name . ' has been created successfully.',
                'data'    => $schedule_template,
            ], 201);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * GET /schedules/{schedule_template}
     */
    public function show(ScheduleTemplate $schedule_template): JsonResponse
    {
        try {
            $this->authorize('view', $schedule_template);

            return response()->json([
                'status' => 1,
                'data'   => $schedule_template,
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * PUT|PATCH /schedules/{schedule_template}
     */
    public function update(ScheduleTemplateRequest $request, ScheduleTemplate $schedule_template): JsonResponse
    {
        try {
            $this->authorize('update', $schedule_template);

            $schedule_template->update($request->validated());

            return response()->json([
                'status'  => 1,
                'message' => $schedule_template->schedule_name . ' has been updated successfully.',
                'data'    => $schedule_template->fresh(),
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * DELETE /schedules/{schedule_template}
     */
    public function destroy(ScheduleTemplate $schedule_template): JsonResponse
    {
        try {
            $this->authorize('delete', $schedule_template);

            $name = $schedule_template->schedule_name;
            $schedule_template->delete();

            return response()->json([
                'status'  => 1,
                'message' => $name . ' has been deleted successfully.',
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    private function forbidden(): JsonResponse
    {
        return response()->json([
            'status'  => 0,
            'message' => 'You are not authorized to perform this action.',
        ], 403);
    }

    private function serverError(\Throwable $e): JsonResponse
    {
        Log::error($e->getMessage(), ['exception' => $e]);

        return response()->json([
            'status'  => 0,
            'message' => 'server error',
        ], 500);
    }
}