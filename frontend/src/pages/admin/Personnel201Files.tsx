import { ChevronLeft, ChevronRight, FolderOpen, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button/Button';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { getErrorMessage } from '../../lib/getErrorMessage';
import { fullName, initials } from '../../lib/leave';
import { departmentService } from '../../services/admin/departmentService';
import { personnelFileService } from '../../services/admin/personnelFileService';
import type { PersonnelEmployee } from '../../types/admin/personnel';
import type { Department } from '../../types/admin/organization';
import type { PaginatedResponse } from '../../types/api';

export default function Personnel201Files() {
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [departmentId, setDepartmentId] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [data, setData] = useState<PaginatedResponse<PersonnelEmployee> | null>(null);
  const [loading, setLoading] = useState(true);

  const filters = useMemo(
    () => ({ search: debouncedSearch || undefined, department_id: departmentId || undefined }),
    [debouncedSearch, departmentId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await personnelFileService.employees({ page, ...filters });
      setData(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, filters, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    departmentService
      .list({ per_page: 100 })
      .then((res) => setDepartments(res.data.data))
      .catch(() => setDepartments([]));
  }, []);

  return (
    <div className="overflow-x-clip">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Personnel 201 Files</h2>
        <p className="text-sm text-gray-500">Open an employee to see and add the documents in their 201 file.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 border-b border-gray-100 p-4 sm:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search name or employee ID"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="input"
            aria-label="Department"
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.department_name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Files</th>
                <th className="w-32 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : data?.data.length ? (
                data.data.map((employee) => (
                  <tr key={employee.id} className="border-t border-gray-100 transition hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
                          {initials(employee.user)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/admin/personnel-201-files/${employee.id}`}
                            className="block truncate font-medium transition hover:text-red-600"
                          >
                            {fullName(employee.user)}
                          </Link>
                          <p className="truncate text-xs text-gray-500">{employee.employment_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {employee.department?.department_name ?? '—'}
                      {employee.unit_section ? (
                        <p className="text-xs text-gray-400">{employee.unit_section.unit_section_name}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{employee.position?.position_title ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {employee.personnel_files_count} file{employee.personnel_files_count === 1 ? '' : 's'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Link
                          to={`/admin/personnel-201-files/${employee.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          <FolderOpen className="h-4 w-4" />
                          Open
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    No employees found. Only employees with saved Employment Details have a 201 file.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
            <span>Page {data.current_page} of {data.last_page}</span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button variant="secondary" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}