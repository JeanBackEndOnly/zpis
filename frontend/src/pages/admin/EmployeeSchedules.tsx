import { ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import FormField from '../../components/FormField/FormField';
import Modal from '../../components/Modal/Modal';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import {
  currentMonth,
  dayBefore,
  formatDate,
  formatShortDate,
  lastDayOfMonth,
  monthName,
  rangeFor,
  shiftMonth,
  type RangeKey,
} from '../../lib/dateRange';
import { downloadBlob } from '../../lib/downloadFile';
import { getErrorMessage, getValidationErrors } from '../../lib/getErrorMessage';
import { departmentService } from '../../services/admin/departmentService';
import { employeeScheduleService } from '../../services/admin/employeeScheduleService';
import { scheduleTemplateService } from '../../services/admin/scheduleTemplateService';
import { unitSectionService } from '../../services/admin/unitSectionService';
import type {
  EmployeeOption,
  EmployeeSchedule,
  EmployeeSchedulePayload,
  IncompleteEmployee,
  ScheduleTemplate,
} from '../../types/admin/schedule';
import type { Department, UnitSection } from '../../types/admin/organization';
import type { PaginatedResponse, ValidationErrors } from '../../types/api';

type ScheduleUser = NonNullable<EmployeeSchedule['employee_information']>['user'];

interface FormState {
  department_id: string;
  unit_section_id: string;
  employee_id: string;
  schedule_id: string;
  effective_date: string;
}

const emptyForm: FormState = {
  department_id: '',
  unit_section_id: '',
  employee_id: '',
  schedule_id: '',
  effective_date: '',
};

// "08:00:00" -> "8:00 AM"
function formatTime(value: string) {
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function fullName(user?: ScheduleUser) {
  if (!user) return '—';
  return [user.first_name, user.middle_name, user.last_name, user.suffix].filter(Boolean).join(' ');
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-red-600 text-white shadow-sm'
          : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

export default function EmployeeSchedules() {
  const toast = useToast();

  // Reference data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<UnitSection[]>([]);
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [incomplete, setIncomplete] = useState<IncompleteEmployee[]>([]);
  const [refLoaded, setRefLoaded] = useState(false);
  const [refError, setRefError] = useState('');

  // Categories and filters
  const [departmentId, setDepartmentId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);

  // Date range category (semi-monthly halves, whole month, or custom) + CSV export
  const [month, setMonth] = useState(currentMonth);
  const [rangeKey, setRangeKey] = useState<RangeKey>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [dateMode, setDateMode] = useState<'active' | 'starts'>('active');
  const [exporting, setExporting] = useState(false);

  // Table
  const [data, setData] = useState<PaginatedResponse<EmployeeSchedule> | null>(null);
  const [loading, setLoading] = useState(true);

  // Add / edit modal
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleting, setDeleting] = useState<EmployeeSchedule | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    Promise.all([
      departmentService.list({ per_page: 500 }),
      unitSectionService.list({ per_page: 500 }),
      scheduleTemplateService.list({ per_page: 100 }),
      employeeScheduleService.employeeOptions(),
    ])
      .then(([deptRes, unitRes, templateRes, employeeRes]) => {
        setDepartments(deptRes.data.data);
        setUnits(unitRes.data.data);
        setTemplates(templateRes.data.data);
        setEmployees(employeeRes.data);
        setIncomplete(employeeRes.incomplete ?? []);
      })
      .catch((err) => setRefError(getErrorMessage(err)))
      .finally(() => setRefLoaded(true));
  }, []);

  const unitsByDepartment = useMemo(() => {
    const map: Record<string, UnitSection[]> = {};
    units.forEach((u) => {
      const list = map[u.department_id] ?? [];
      list.push(u);
      map[u.department_id] = list;
    });
    return map;
  }, [units]);

  const range = useMemo(
    () => rangeFor(rangeKey, month, customFrom, customTo),
    [rangeKey, month, customFrom, customTo],
  );

  // The same filters feed the table and the CSV export
  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      department_id: departmentId || undefined,
      unit_section_id: unitId || undefined,
      schedule_id: scheduleFilter || undefined,
      date_from: range?.from,
      date_to: range?.to,
      date_mode: range ? dateMode : undefined,
    }),
    [debouncedSearch, departmentId, unitId, scheduleFilter, range, dateMode],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeScheduleService.list({ page, ...filters });
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

  // Category helpers
  const departmentUnits = departmentId ? unitsByDepartment[departmentId] ?? [] : [];

  function pickDepartment(id: string) {
    setDepartmentId(id);
    setUnitId('');
    setPage(1);
  }

  function pickUnit(id: string) {
    setUnitId(id);
    setPage(1);
  }

  function pickRange(key: RangeKey) {
    setRangeKey(key);
    setPage(1);
  }

  function changeMonth(delta: number) {
    setMonth((m) => shiftMonth(m, delta));
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await employeeScheduleService.exportCsv(filters);
      const suffix = range ? `_${range.from}_to_${range.to}` : '';
      downloadBlob(blob, `employee-schedules${suffix}.csv`);
      toast.success('CSV file downloaded.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  // Modal helpers
  const formUnits = form.department_id ? unitsByDepartment[form.department_id] ?? [] : [];
  const needsUnit = formUnits.length > 0;
  const employeeReady = form.department_id !== '' && (!needsUnit || form.unit_section_id !== '');
  const employeeChoices = employees.filter(
    (e) =>
      String(e.department_id) === form.department_id &&
      (!needsUnit || String(e.unit_section_id ?? '') === form.unit_section_id),
  );

  const setField = (name: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [name]: value }));

  function changeDepartment(value: string) {
    // A new department clears the unit section and employee
    setForm((prev) => ({ ...prev, department_id: value, unit_section_id: '', employee_id: '' }));
  }

  function changeUnit(value: string) {
    setForm((prev) => ({ ...prev, unit_section_id: value, employee_id: '' }));
  }

  function openCreate() {
    setEditingId(null);
    // Start from the category the admin is currently viewing
    setForm({ ...emptyForm, department_id: departmentId, unit_section_id: unitId });
    setFormErrors({});
    setFormError('');
    setOpen(true);
  }

  function openEdit(row: EmployeeSchedule) {
    const info = row.employee_information;
    setEditingId(row.id);
    setForm({
      department_id: info ? String(info.department_id) : '',
      unit_section_id: info?.unit_section_id ? String(info.unit_section_id) : '',
      employee_id: String(row.employee_id),
      schedule_id: String(row.schedule_id),
      effective_date: row.effective_date.slice(0, 10),
    });
    setFormErrors({});
    setFormError('');
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});
    setFormError('');

    const payload: EmployeeSchedulePayload = {
      employee_id: Number(form.employee_id),
      schedule_id: Number(form.schedule_id),
      effective_date: form.effective_date,
    };

    try {
      const res =
        editingId === null
          ? await employeeScheduleService.create(payload)
          : await employeeScheduleService.update(editingId, payload);
      toast.success(res.message);
      setOpen(false);
      load();
    } catch (err) {
      const validation = getValidationErrors(err);
      if (Object.keys(validation).length) setFormErrors(validation);
      else setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await employeeScheduleService.remove(deleting.id);
      toast.success(res.message);
      setDeleting(null);
      // If the last row on a page was deleted, go back one page
      if (data && data.data.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  }

  const deletingLabel = deleting ? `${fullName(deleting.employee_information?.user)}'s schedule` : 'this schedule';
  const colSpan = 6;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Employee Schedules</h2>
          <p className="text-sm text-gray-500">{data ? `${data.total} total` : 'Loading...'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={handleExport}
            loading={exporting}
            disabled={loading || data?.total === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Assign schedule
          </Button>
        </div>
      </div>

      {refLoaded && refError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load the page options: {refError}
        </div>
      )}

      {/* Categories: department, then unit section (only when the department has any) */}
      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Department</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={departmentId === ''} onClick={() => pickDepartment('')}>
            All departments
          </Chip>
          {departments.map((d) => (
            <Chip key={d.id} active={departmentId === String(d.id)} onClick={() => pickDepartment(String(d.id))}>
              {d.department_name}
            </Chip>
          ))}
        </div>

        {departmentUnits.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Unit section</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={unitId === ''} onClick={() => pickUnit('')}>
                All unit sections
              </Chip>
              {departmentUnits.map((u) => (
                <Chip key={u.id} active={unitId === String(u.id)} onClick={() => pickUnit(String(u.id))}>
                  {u.unit_section_name}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Date range category */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Date range</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => changeMonth(-1)}
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-36 text-center text-sm font-medium text-gray-700">{monthName(month)}</span>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => changeMonth(1)}
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip active={rangeKey === 'all'} onClick={() => pickRange('all')}>
              All dates
            </Chip>
            <Chip active={rangeKey === 'first'} onClick={() => pickRange('first')}>
              {`${formatShortDate(`${month}-01`)} – ${formatShortDate(`${month}-15`)}`}
            </Chip>
            <Chip active={rangeKey === 'second'} onClick={() => pickRange('second')}>
              {`${formatShortDate(`${month}-16`)} – ${formatShortDate(`${month}-${lastDayOfMonth(month)}`)}`}
            </Chip>
            <Chip active={rangeKey === 'month'} onClick={() => pickRange('month')}>
              Whole month
            </Chip>
            <Chip active={rangeKey === 'custom'} onClick={() => pickRange('custom')}>
              Custom range
            </Chip>
          </div>

          {rangeKey === 'custom' && (
            <div className="mt-3 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">From</span>
                <input
                  type="date"
                  className="input"
                  value={customFrom}
                  onChange={(e) => {
                    setCustomFrom(e.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">To</span>
                <input
                  type="date"
                  className="input"
                  min={customFrom || undefined}
                  value={customTo}
                  onChange={(e) => {
                    setCustomTo(e.target.value);
                    setPage(1);
                  }}
                />
              </label>
              {customFrom && customTo && customFrom > customTo && (
                <p className="text-xs text-red-600 sm:col-span-2">The end date must be on or after the start date.</p>
              )}
            </div>
          )}

          {range && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              <span>
                Showing schedules <strong>{dateMode === 'active' ? 'in effect during' : 'starting within'}</strong>{' '}
                {formatShortDate(range.from)} – {formatShortDate(range.to)}
              </span>
              <div className="ml-auto flex rounded-lg bg-white p-0.5 ring-1 ring-red-100">
                <button
                  type="button"
                  onClick={() => setDateMode('active')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    dateMode === 'active' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  In effect
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('starts')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    dateMode === 'starts' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Starts in range
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <div className="relative w-full max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search employee or ID"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="Schedules"
            className="input w-auto min-w-36"
            value={scheduleFilter}
            onChange={(e) => {
              setScheduleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All schedules</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.schedule_name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department / Unit</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Effective period</th>
                <th className="w-24 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : data?.data.length ? (
                data.data.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 transition hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="truncate font-medium">{fullName(row.employee_information?.user)}</p>
                      <p className="truncate text-xs text-gray-500">{row.employee_information?.employment_id ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{row.employee_information?.department?.department_name ?? '—'}</p>
                      {row.employee_information?.unit_section && (
                        <p className="text-xs text-gray-500">{row.employee_information.unit_section.unit_section_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.schedule_template ? (
                        <div className="flex items-center gap-2">
                          <Badge>{row.schedule_template.schedule_name}</Badge>
                          <span className="text-xs text-gray-500">{row.schedule_template.shift}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.schedule_template
                        ? `${formatTime(row.schedule_template.schedule_from)} – ${formatTime(row.schedule_template.schedule_to)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <p>{formatDate(row.effective_date)}</p>
                      <p className="text-xs text-gray-400">
                        {row.next_effective_date
                          ? `until ${formatDate(dayBefore(row.next_effective_date))}`
                          : 'No end date'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(row)}
                          aria-label="Edit"
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleting(row);
                            setDeleteError('');
                          }}
                          aria-label="Delete"
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400">No schedules assigned yet.</td></tr>
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

      {/* Assign / edit */}
      <Modal open={open} title={editingId === null ? 'Assign schedule' : 'Edit schedule'} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit}>
          {formError && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
          )}

          <FormField label="Department">
            <select
              className="input"
              value={form.department_id}
              onChange={(e) => changeDepartment(e.target.value)}
              required
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.department_name}</option>
              ))}
            </select>
          </FormField>

          {needsUnit && (
            <FormField label="Unit section">
              <select
                className="input"
                value={form.unit_section_id}
                onChange={(e) => changeUnit(e.target.value)}
                required
              >
                <option value="">Select unit section</option>
                {formUnits.map((u) => (
                  <option key={u.id} value={u.id}>{u.unit_section_name}</option>
                ))}
              </select>
            </FormField>
          )}

          <FormField
            label="Employee"
            error={formErrors.employee_id?.[0]}
            hint={
              !employeeReady
                ? needsUnit
                  ? 'Select a unit section first.'
                  : 'Select a department first.'
                : employeeChoices.length === 0
                  ? 'No employees with saved Employment Details in this selection.'
                  : undefined
            }
          >
            <select
              className="input"
              value={form.employee_id}
              onChange={(e) => setField('employee_id', e.target.value)}
              disabled={!employeeReady}
              required
            >
              <option value="">Select employee</option>
              {employeeChoices.map((e) => (
                <option key={e.id} value={e.id}>{`${e.name} (${e.employment_id})`}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Schedule" error={formErrors.schedule_id?.[0]}>
            <select
              className="input"
              value={form.schedule_id}
              onChange={(e) => setField('schedule_id', e.target.value)}
              required
            >
              <option value="">Select schedule</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {`${t.schedule_name} · ${t.shift} · ${formatTime(t.schedule_from)} – ${formatTime(t.schedule_to)}`}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Effective date" error={formErrors.effective_date?.[0]}>
            <input
              className="input"
              type="date"
              value={form.effective_date}
              onChange={(e) => setField('effective_date', e.target.value)}
              required
            />
          </FormField>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Delete */}
      <Modal open={deleting !== null} title="Remove schedule" onClose={() => setDeleting(null)}>
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-600">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-gray-900">{deletingLabel}</span>? This action cannot be undone.
          </p>
        </div>
        {deleteError && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button onClick={handleDelete} loading={deleteLoading}>
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}