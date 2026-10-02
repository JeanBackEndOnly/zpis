import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { getErrorMessage, getValidationErrors } from '../../lib/getErrorMessage';
import { departmentService } from '../../services/admin/departmentService';
import type { CrudService } from '../../services/admin/crudService';
import type { Department } from '../../types/admin/organization';
import type { PaginatedResponse, ValidationErrors } from '../../types/api';
import Button from '../Button/Button';
import FormField from '../FormField/FormField';
import Modal from '../Modal/Modal';

export interface Column<T> {
  label: string;
  render: (row: T) => ReactNode;
}

export interface Option {
  value: string;
  label: string;
}

export interface Field {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'date' | 'time' | 'select' | 'department';
  options?: Option[]; // for type "select"
  required?: boolean | 'create'; // default true; 'create' = required only when adding
  placeholder?: string;
  editHint?: string; // helper text shown only when editing
  full?: boolean; // span both columns in a two-column form
}

export interface Filter {
  name: string; // query-string key sent to the API, e.g. "user_role"
  label: string;
  options: Option[];
}

interface Props<T, P> {
  title: string;
  service: CrudService<T, P>;
  columns: Column<T>[];
  fields: Field[];
  rowLabel?: (row: T) => string; // name shown in the delete confirmation
  filters?: Filter[]; // dropdown filters next to the search box
  twoColumn?: boolean; // wide, two-column form (for long forms)
  rowActions?: (row: T) => ReactNode; // extra buttons shown before Edit / Delete
}

export default function CrudPage<T extends { id: number }, P extends object>({
  title,
  service,
  columns,
  fields,
  rowLabel,
  filters = [],
  twoColumn = false,
  rowActions,
}: Props<T, P>) {
  const [data, setData] = useState<PaginatedResponse<T> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const needsDepartments = fields.some((f) => f.type === 'department');

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<T | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(Object.entries(filterValues).filter(([, v]) => v));
      const res = await service.list({ page, search: debouncedSearch || undefined, ...activeFilters });
      setData(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [service, page, debouncedSearch, filterValues, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!needsDepartments) return;
    departmentService
      .list({ per_page: 100 })
      .then((res) => setDepartments(res.data.data))
      .catch(() => setDepartments([]));
  }, [needsDepartments]);

  const setField = (name: string, value: string) => setForm((prev) => ({ ...prev, [name]: value }));

  const isRequired = (f: Field) =>
    f.required === undefined || f.required === true || (f.required === 'create' && editingId === null);

  function openCreate() {
    setEditingId(null);
    setForm(Object.fromEntries(fields.map((f) => [f.name, ''])));
    setFormErrors({});
    setFormError('');
    setOpen(true);
  }

  function openEdit(row: T) {
    const record = row as unknown as Record<string, unknown>;
    setEditingId(row.id);
    setForm(
      Object.fromEntries(
        fields.map((f) => {
          const value = String(record[f.name] ?? '');
          // Laravel returns "HH:mm:ss"; the API validates "HH:mm"
          return [f.name, f.type === 'time' ? value.slice(0, 5) : value];
        }),
      ),
    );
    setFormErrors({});
    setFormError('');
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});
    setFormError('');

    const payload = Object.fromEntries(
      fields.map((f) => [f.name, f.type === 'department' ? Number(form[f.name]) : form[f.name]]),
    ) as P;

    try {
      const res =
        editingId === null ? await service.create(payload) : await service.update(editingId, payload);
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

  function openDelete(row: T) {
    setDeleting(row);
    setDeleteError('');
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await service.remove(deleting.id);
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

  const deletingLabel = deleting && rowLabel ? rowLabel(deleting) : `this ${title.toLowerCase()}`;
  const colSpan = columns.length + 1;

  function renderControl(f: Field) {
    const value = form[f.name] ?? '';
    const required = isRequired(f);
    const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setField(f.name, e.target.value);

    if (f.type === 'department') {
      return (
        <select className="input" value={value} onChange={onChange} required={required}>
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.department_name}</option>
          ))}
        </select>
      );
    }

    if (f.type === 'select') {
      return (
        <select className="input" value={value} onChange={onChange} required={required}>
          <option value="">Select {f.label.toLowerCase()}</option>
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        className="input"
        type={f.type}
        value={value}
        placeholder={f.placeholder}
        onChange={onChange}
        required={required}
        autoComplete={f.type === 'password' ? 'new-password' : 'off'}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}s</h2>
          <p className="text-sm text-gray-500">{data ? `${data.total} total` : 'Loading...'}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add {title.toLowerCase()}
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <div className="relative w-full max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder={`Search ${title.toLowerCase()}s`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {filters.map((filter) => (
            <select
              key={filter.name}
              aria-label={filter.label}
              className="input w-auto min-w-36"
              value={filterValues[filter.name] ?? ''}
              onChange={(e) => {
                setFilterValues((prev) => ({ ...prev, [filter.name]: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">All {filter.label.toLowerCase()}</option>
              {filter.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                {columns.map((c) => (
                  <th key={c.label} className="px-4 py-3">{c.label}</th>
                ))}
                <th className="w-32 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : data?.data.length ? (
                data.data.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 transition hover:bg-gray-50">
                    {columns.map((c) => (
                      <td key={c.label} className="px-4 py-3">{c.render(row)}</td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {rowActions?.(row)}
                        <button
                          onClick={() => openEdit(row)}
                          aria-label="Edit"
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDelete(row)}
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
                <tr><td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400">No records found.</td></tr>
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

      <Modal
        open={open}
        title={editingId === null ? `Add ${title}` : `Edit ${title}`}
        size={twoColumn ? 'lg' : 'md'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
          )}
          <div className={twoColumn ? 'grid gap-x-4 sm:grid-cols-2' : ''}>
            {fields.map((f) => (
              <div key={f.name} className={twoColumn && f.full ? 'sm:col-span-2' : ''}>
                <FormField
                  label={isRequired(f) ? f.label : `${f.label} (optional)`}
                  error={formErrors[f.name]?.[0]}
                  hint={editingId !== null ? f.editHint : undefined}
                >
                  {renderControl(f)}
                </FormField>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleting !== null} title={`Delete ${title}`} onClose={() => setDeleting(null)}>
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{' '}
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
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}