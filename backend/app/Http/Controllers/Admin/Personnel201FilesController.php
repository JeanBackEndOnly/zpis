<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Personnel201FilesRequest;
use App\Models\EmployeeInformation;
use App\Models\Personnel201File;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Http\Requests\Admin\Personnel201FileUpdateRequest;

/**
 * Admin / HR: the 201 files of every employee.
 */
class Personnel201FilesController extends Controller
{
    use AuthorizesRequests;

    private const EMPLOYEE_RELATIONS = [
        'user:id,first_name,middle_name,last_name,suffix,email',
        'department:id,department_name',
        'unit_section:id,unit_section_name',
        'position:id,position_title',
    ];

    /**
     * GET /admin/personnel-201-files?search=&department_id=&page=
     * Every employee with the number of documents in their 201 file.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', Personnel201File::class);

            $employees = EmployeeInformation::query()
                ->with([
                    'user:id,first_name,middle_name,last_name,suffix,email',
                    'department:id,department_name',
                    'unit_section:id,unit_section_name',
                    'position:id,position_title',
                ])
                ->withCount('personnel_files')
                ->when($request->filled('department_id'), function ($query) use ($request) {
                    $query->where('department_id', $request->department_id);
                })
                ->when($request->filled('search'), function ($query) use ($request) {
                    $search = '%' . $request->search . '%';
                    $query->where(function ($q) use ($search) {
                        $q->where('employment_id', 'like', $search)
                            ->orWhereHas('user', function ($u) use ($search) {
                                $u->where('first_name', 'like', $search)
                                    ->orWhere('middle_name', 'like', $search)
                                    ->orWhere('last_name', 'like', $search);
                            });
                    });
                })
                ->orderBy('employment_id')
                ->paginate($request->integer('per_page', 10));

            return response()->json([
                'status'  => 1,
                'message' => 'Employees retrieved successfully.',
                'data'    => $employees,
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * GET /admin/personnel-201-files/employee/{employee_information}
     * One employee and all the documents in their 201 file.
     */
    public function show(EmployeeInformation $employee_information): JsonResponse
    {
        try {
            $this->authorize('viewAny', Personnel201File::class);

            return response()->json([
                'status'  => 1,
                'message' => '201 file retrieved successfully.',
                'data'    => [
                    'employee' => $employee_information->load(self::EMPLOYEE_RELATIONS),
                    'files'    => $employee_information->personnel_files()
                        ->orderByDesc('created_at')
                        ->orderByDesc('id')
                        ->get(),
                ],
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * POST /admin/personnel-201-files/employee/{employee_information}
     * multipart/form-data: file_type, file_name (optional), file
     */
    public function store(Personnel201FilesRequest $request, EmployeeInformation $employee_information): JsonResponse
    {
        $path = null;

        try {
            $this->authorize('create', Personnel201File::class);

            $upload = $request->file('file');
            $name = trim((string) $request->input('file_name'));

            if ($name === '') {
                $name = pathinfo($upload->getClientOriginalName(), PATHINFO_FILENAME);
            }

            $path = $upload->store('personnel-201-files/' . $employee_information->id, 'local');

            $file = $employee_information->personnel_files()->create([
                'file_name' => $name,
                'file_type' => $request->input('file_type'),
                'file'      => $path,
            ]);

            return response()->json([
                'status'  => 1,
                'message' => 'The file has been added to the 201 file.',
                'data'    => $file,
            ], 201);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            // Do not leave an orphan file behind when saving fails
            if ($path) {
                Storage::disk('local')->delete($path);
            }

            return $this->serverError($e);
        }
    }

        /**
     * POST /admin/personnel-201-files/{personnel_file}
     * multipart/form-data: file_type, file_name, file (optional, replaces the current file)
     * (POST because PHP does not read multipart bodies sent with PUT)
     */
    public function update(Personnel201FileUpdateRequest $request, Personnel201File $personnel_file): JsonResponse
    {
        $newPath = null;

        try {
            $this->authorize('update', $personnel_file);

            $oldPath = $personnel_file->file;

            $data = [
                'file_name' => trim((string) $request->input('file_name')),
                'file_type' => $request->input('file_type'),
            ];

            if ($request->hasFile('file')) {
                $newPath = $request->file('file')->store('personnel-201-files/' . $personnel_file->employee_id, 'local');
                $data['file'] = $newPath;
            }

            $personnel_file->update($data);

            // The record points to the new file now, so the old one can go
            if ($newPath) {
                $newPath = null;
                Storage::disk('local')->delete($oldPath);
            }

            return response()->json([
                'status'  => 1,
                'message' => 'The file has been updated.',
                'data'    => $personnel_file->fresh(),
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            // Do not leave an orphan file behind when saving fails
            if ($newPath) {
                Storage::disk('local')->delete($newPath);
            }

            return $this->serverError($e);
        }
    }

    /**
     * GET /admin/personnel-201-files/{personnel_file}/download
     */
    public function download(Personnel201File $personnel_file)
    {
        try {
            $this->authorize('view', $personnel_file);

            if (! Storage::disk('local')->exists($personnel_file->file)) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'The file could not be found on the server.',
                ], 404);
            }

            return Storage::disk('local')->response($personnel_file->file);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * DELETE /admin/personnel-201-files/{personnel_file}
     */
    public function destroy(Personnel201File $personnel_file): JsonResponse
    {
        try {
            $this->authorize('delete', $personnel_file);

            $path = $personnel_file->file;
            $personnel_file->delete();
            Storage::disk('local')->delete($path);

            return response()->json([
                'status'  => 1,
                'message' => 'The file has been deleted.',
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