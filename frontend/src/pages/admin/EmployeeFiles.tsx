import { ArrowLeft, Download, Eye, Paperclip, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../lib/dateRange';
import { downloadBlob } from '../../lib/downloadFile';
import { getErrorMessage, getValidationErrors } from '../../lib/getErrorMessage';
import { fullName, initials } from '../../lib/leave';
import { canPreview, personnelFileTypeLabels, personnelFileTypes } from '../../lib/personnel';
import { personnelFileService } from '../../services/admin/personnelFileService';
import type { PersonnelEmployee, PersonnelFile, PersonnelFileType } from '../../types/admin/personnel';
import type { ValidationErrors } from '../../types/api';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'];

const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700';

function FieldError({ message }: { message?: string }) {
  return message ? <span className="mt-1 block text-xs text-red-600">{message}</span> : null;
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Add / edit form                                                     */
/* ------------------------------------------------------------------ */

function FileForm({
  employeeId,
  existing,
  onDone,
  onCancel,
}: {
  employeeId: number;
  existing?: PersonnelFile; // set when editing
  onDone: () => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const editing = !!existing;

  const [fileType, setFileType] = useState<PersonnelFileType | ''>(existing?.file_type ?? '');
  const [fileName, setFileName] = useState(existing?.file_name ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const error = (key: string) => errors[key]?.[0];

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!picked) return;

    const extension = picked.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setFile(null);
      setErrors({ file: ['The file must be a PDF, JPG, PNG, DOC or DOCX file.'] });
      return;
    }
    if (picked.size > MAX_BYTES) {
      setFile(null);
      setErrors({ file: ['The file may not be larger than 5 MB.'] });
      return;
    }

    setErrors({});
    setFile(picked);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError('');

    if (!fileType) {
      setErrors({ file_type: ['Please choose the type of document.'] });
      return;
    }
    if (editing && !fileName.trim()) {
      setErrors({ file_name: ['The file name is required.'] });
      return;
    }
    if (!editing && !file) {
      setErrors({ file: ['Please choose a file to upload.'] });
      return;
    }

    setSaving(true);
    try {
      const res = existing
        ? await personnelFileService.update(existing.id, { file_type: fileType, file_name: fileName, file })
        : await personnelFileService.upload(employeeId, { file_type: fileType, file_name: fileName, file: file! });
      toast.success(res.message);
      onDone();
    } catch (err) {
      const validation = getValidationErrors(err);
      if (Object.keys(validation).length) setErrors(validation);
      else setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {formError && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

      <label className="mb-4 block">
        <span className={labelClass}>Document type</span>
        <select className="input" value={fileType} onChange={(e) => setFileType(e.target.value as PersonnelFileType | '')}>
          <option value="">Select a type</option>
          {personnelFileTypes.map((type) => (
            <option key={type} value={type}>{personnelFileTypeLabels[type]}</option>
          ))}
        </select>
        <FieldError message={error('file_type')} />
      </label>

      <label className="mb-4 block">
        <span className={labelClass}>File name{editing ? '' : ' (optional)'}</span>
        <input
          className="input"
          value={fileName}
          placeholder={editing ? '' : 'Defaults to the name of the uploaded file'}
          onChange={(e) => setFileName(e.target.value)}
        />
        <FieldError message={error('file_name')} />
      </label>

      <div className="mb-6">
        <span className={labelClass}>{editing ? 'Replace file (optional)' : 'File'}</span>
        <input
          ref={input}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={pick}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={() => input.current?.click()}>
            <Paperclip className="h-4 w-4" />
            {file ? 'Change file' : editing ? 'Choose new file' : 'Choose file'}
          </Button>
          {file && (
            <span className="flex min-w-0 items-center gap-1 text-sm text-gray-700">
              <span className="truncate [overflow-wrap:anywhere]">{file.name}</span>
              <button
                type="button"
                aria-label="Remove file"
                onClick={() => setFile(null)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {editing
            ? `Leave empty to keep the current ${existing?.extension.toUpperCase()} file. `
            : ''}
          PDF, JPG, PNG, DOC or DOCX, up to 5 MB.
        </p>
        <FieldError message={error('file')} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add file'}</Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* View details + preview                                              */
/* ------------------------------------------------------------------ */

function FileViewer({
  file,
  onDownload,
  onEdit,
  onClose,
}: {
  file: PersonnelFile;
  onDownload: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(canPreview(file.extension));
  const [error, setError] = useState('');

  // Load the file for the inline preview (PDF and images only)
  useEffect(() => {
    if (!canPreview(file.extension)) return;

    let objectUrl = '';
    let cancelled = false;

    personnelFileService
      .download(file.id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, file.extension]);

  return (
    <div>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Item label="File name">{file.file_name}</Item>
        </div>
        <Item label="Document type">
          <Badge>{personnelFileTypeLabels[file.file_type]}</Badge>
        </Item>
        <Item label="Format">{file.extension.toUpperCase()}</Item>
        <Item label="Added">{formatDate(file.created_at)}</Item>
        <Item label="Last updated">{formatDate(file.updated_at)}</Item>
      </dl>

      <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        {!canPreview(file.extension) ? (
          <p className="px-4 py-10 text-center text-sm text-gray-500">
            A preview is not available for {file.extension.toUpperCase()} files. Download the file to open it.
          </p>
        ) : loading ? (
          <p className="px-4 py-10 text-center text-sm text-gray-400">Loading preview...</p>
        ) : error ? (
          <p className="px-4 py-10 text-center text-sm text-red-600">{error}</p>
        ) : IMAGE_EXTENSIONS.includes(file.extension) ? (
          <img src={url} alt={file.file_name} className="mx-auto max-h-[60vh] w-auto max-w-full object-contain" />
        ) : (
          <iframe src={url} title={file.file_name} className="h-[60vh] w-full bg-white" />
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button variant="secondary" onClick={onDownload}>
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function EmployeeFiles() {
  const { id } = useParams();
  const employeeId = Number(id);
  const toast = useToast();

  const [employee, setEmployee] = useState<PersonnelEmployee | null>(null);
  const [files, setFiles] = useState<PersonnelFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<'' | PersonnelFileType>('');

  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<PersonnelFile | null>(null);
  const [editing, setEditing] = useState<PersonnelFile | null>(null);
  const [deleting, setDeleting] = useState<PersonnelFile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await personnelFileService.get(employeeId);
      setEmployee(res.data.employee);
      setFiles(res.data.files);
    } catch (err) {
      setNotFound(true);
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [employeeId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function download(file: PersonnelFile) {
    setBusyId(file.id);
    try {
      const blob = await personnelFileService.download(file.id);
      downloadBlob(blob, `${file.file_name}.${file.extension}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await personnelFileService.remove(deleting.id);
      toast.success(res.message);
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  }

  const shown = tab ? files.filter((f) => f.file_type === tab) : files;
  const countOf = (type: PersonnelFileType) => files.filter((f) => f.file_type === type).length;

  if (loading) return <p className="py-10 text-center text-gray-400">Loading...</p>;

  if (notFound || !employee) {
    return (
      <div>
        <Link to="/admin/personnel-201-files" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
          <ArrowLeft className="h-4 w-4" />
          Back to 201 files
        </Link>
        <p className="mt-6 text-gray-500">This employee could not be found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-clip">
      <Link to="/admin/personnel-201-files" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-red-600">
        <ArrowLeft className="h-4 w-4" />
        Back to 201 files
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700">
            {initials(employee.user)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold tracking-tight">{fullName(employee.user)}</h2>
            <p className="truncate text-sm text-gray-500">
              {employee.employment_id} · {employee.department?.department_name ?? '—'}
              {employee.position ? ` · ${employee.position.position_title}` : ''}
            </p>
          </div>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          Add file
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-gray-100 p-4">
          <button
            type="button"
            onClick={() => setTab('')}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              tab === '' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
            <span className={`rounded-full px-1.5 text-xs ${tab === '' ? 'bg-white/20 text-white' : 'bg-white text-gray-500'}`}>
              {files.length}
            </span>
          </button>
          {personnelFileTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTab(type)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                tab === type ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {personnelFileTypeLabels[type]}
              <span className={`rounded-full px-1.5 text-xs ${tab === type ? 'bg-white/20 text-white' : 'bg-white text-gray-500'}`}>
                {countOf(type)}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3">File name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Added</th>
                <th className="w-44 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {shown.length ? (
                shown.map((file) => (
                  <tr key={file.id} className="border-t border-gray-100 transition hover:bg-gray-50">
                    <td className="max-w-xs px-4 py-3 font-medium [overflow-wrap:anywhere]">{file.file_name}</td>
                    <td className="px-4 py-3"><Badge>{personnelFileTypeLabels[file.file_type]}</Badge></td>
                    <td className="px-4 py-3 uppercase text-gray-600">{file.extension}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDate(file.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="View"
                          aria-label="View"
                          onClick={() => setViewing(file)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Edit"
                          aria-label="Edit"
                          onClick={() => setEditing(file)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Download"
                          aria-label="Download"
                          disabled={busyId === file.id}
                          onClick={() => download(file)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          aria-label="Delete"
                          onClick={() => setDeleting(file)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    {tab ? 'No files of this type yet.' : 'No files in this 201 file yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add */}
      <Modal open={adding} title="Add file to 201 file" onClose={() => setAdding(false)}>
        <FileForm
          employeeId={employeeId}
          onCancel={() => setAdding(false)}
          onDone={() => {
            setAdding(false);
            load();
          }}
        />
      </Modal>

      {/* View */}
      <Modal open={viewing !== null} title="201 file document" size="lg" onClose={() => setViewing(null)}>
        {viewing && (
          <FileViewer
            file={viewing}
            onClose={() => setViewing(null)}
            onDownload={() => download(viewing)}
            onEdit={() => {
              setEditing(viewing);
              setViewing(null);
            }}
          />
        )}
      </Modal>

      {/* Edit */}
      <Modal open={editing !== null} title="Edit file" onClose={() => setEditing(null)}>
        {editing && (
          <FileForm
            key={editing.id}
            employeeId={employeeId}
            existing={editing}
            onCancel={() => setEditing(null)}
            onDone={() => {
              setEditing(null);
              load();
            }}
          />
        )}
      </Modal>

      {/* Delete */}
      <Modal open={deleting !== null} title="Delete file" onClose={() => setDeleting(null)}>
        <p className="text-sm text-gray-600">
          Delete <span className="font-semibold text-gray-900">{deleting?.file_name}</span> from {fullName(employee.user)}'s
          201 file? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button onClick={confirmDelete} loading={deleteLoading}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}