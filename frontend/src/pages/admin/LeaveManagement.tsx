import { Check, ChevronLeft, ChevronRight, Eye, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button/Button';
import LeaveDetailModal from '../../components/admin/leave/LeaveDetailModal';
import LeaveStatusBadge from '../../components/leave/LeaveStatusBadge';
import Modal from '../../components/Modal/Modal';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../lib/dateRange';
import { getErrorMessage } from '../../lib/getErrorMessage';
import {
  fullName,
  initials,
  leaveTypeLabels,
  leaveTypeText,
  leaveUsesCredits,
  summarizeDates,
} from '../../lib/leave';
import { departmentService } from '../../services/admin/departmentService';
import { leaveDetailService } from '../../services/admin/leaveDetailService';
import type { Department } from '../../types/admin/organization';
import type { PaginatedResponse } from '../../types/api';
import type { LeaveCounts, LeaveRequest, LeaveStatus, LeaveType } from '../../types/leave';

type Tab = '' | LeaveStatus;
type Action = 'approve' | 'disapprove' | 'delete';

const typeOptions = (Object.keys(leaveTypeLabels) as LeaveType[]).map((value) => ({
  value,
  label: leaveTypeLabels[value],
}));

function confirmCopy(action: Action, leave: LeaveRequest) {
  const who = fullName(leave.employee_information?.user);
  const what = `${leaveTypeText(leave)} request for ${leave.number_of_days} day${leave.number_of_days === 1 ? '' : 's'} (${summarizeDates(
    leave.leave_dates.map((d) => d.leave_date),
  )})`;

  if (action === 'approve') {
    return {
      title: 'Approve leave request',
      body: `Approve ${who}'s ${what}?`,
      note: leaveUsesCredits(leave.leave_type)
        ? 'The days will be deducted from their leave credits.'
        : 'This type of leave does not use leave credits.',
      button: 'Approve',
      variant: 'success' as const,
    };
  }

  if (action === 'disapprove') {
    return {
      title: 'Disapprove leave request',
      body: `Disapprove ${who}'s ${what}?`,
      note: 'Their leave credits will not change.',
      button: 'Disapprove',
      variant: 'primary' as const,
    };
  }

  return {
    title: 'Delete leave request',
    body: `Delete ${who}'s ${what}? This action cannot be undone.`,
    note: leave.leave_status === 'approve' ? 'The approved days will be returned to their leave credits.' : '',
    button: 'Delete',
    variant: 'primary' as const,
  };
}

export default function LeaveManagement() {
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('pending');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [leaveType, setLeaveType] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [data, setData] = useState<PaginatedResponse<LeaveRequest> | null>(null);
  const [counts, setCounts] = useState<LeaveCounts>({ pending: 0, approve: 0, disapproved: 0 });
  const [loading, setLoading] = useState(true);

  const [viewing, setViewing] = useState<LeaveRequest | null>(null);
  const [confirm, setConfirm] = useState<{ action: Action; leave: LeaveRequest } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // Only filter by dates when both are set and in the right order
  const dateReady = !!dateFrom && !!dateTo && dateFrom <= dateTo;

  const filters = useMemo(
    () => ({
      leave_status: tab || undefined,
      leave_type: leaveType || undefined,
      department_id: departmentId || undefined,
      search: debouncedSearch || undefined,
      date_from: dateReady ? dateFrom : undefined,
      date_to: dateReady ? dateTo : undefined,
    }),
    [tab, leaveType, departmentId, debouncedSearch, dateReady, dateFrom, dateTo],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveDetailService.list({ page, ...filters });
      setData(res.data);
      setCounts(res.counts);
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

  function openConfirm(action: Action, leave: LeaveRequest) {
    setConfirm({ action, leave });
    setConfirmError('');
  }

  async function runConfirm() {
    if (!confirm) return;
    const { action, leave } = confirm;

    setConfirmLoading(true);
    setConfirmError('');
    try {
      const res =
        action === 'approve'
          ? await leaveDetailService.approve(leave.id)
          : action === 'disapprove'
            ? await leaveDetailService.disapprove(leave.id)
            : await leaveDetailService.remove(leave.id);

      toast.success(res.message);
      setConfirm(null);
      setViewing(null);
      // The request leaves the current tab, so go back a page if it was the last row
      if (data && data.data.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch (err) {
      // For example "Not enough vacation leave credits ..."
      setConfirmError(getErrorMessage(err));
    } finally {
      setConfirmLoading(false);
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'approve', label: 'Approved', count: counts.approve },
    { key: 'disapproved', label: 'Disapproved', count: counts.disapproved },
    { key: '', label: 'All', count: counts.pending + counts.approve + counts.disapproved },
  ];

  const copy = confirm ? confirmCopy(confirm.action, confirm.leave) : null;

  return (
    <div className="overflow-x-clip">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Leave Management</h2>
        <p className="text-sm text-gray-500">Review, approve and disapprove leave requests.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 p-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                tab === t.key ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-xs ${
                  tab === t.key ? 'bg-white/20 text-white' : 'bg-white text-gray-500'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 border-b border-gray-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
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
            aria-label="Leave type"
            value={leaveType}
            onChange={(e) => {
              setLeaveType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All leave types</option>
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
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
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="input"
              aria-label="Leave dates from"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
            <span className="text-gray-400">–</span>
            <input
              type="date"
              className="input"
              aria-label="Leave dates to"
              min={dateFrom || undefined}
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {dateFrom && dateTo && dateFrom > dateTo && (
            <p className="text-xs text-red-600 lg:col-span-4">The end date must be on or after the start date.</p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Leave</th>
                <th className="px-4 py-3">Date(s)</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Status</th>
                <th className="w-40 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : data?.data.length ? (
                data.data.map((leave) => {
                  const info = leave.employee_information;
                  return (
                    <tr key={leave.id} className="border-t border-gray-100 align-top transition hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
                            {initials(info?.user)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{fullName(info?.user)}</p>
                            <p className="truncate text-xs text-gray-500">
                              {info?.employment_id ?? '—'} · {info?.department?.department_name ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{leaveTypeText(leave)}</p>
                        <p className="max-w-[16rem] truncate text-xs text-gray-500">{leave.purpose}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {summarizeDates(leave.leave_dates.map((d) => d.leave_date))}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{leave.number_of_days}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDate(leave.request_date)}</td>
                      <td className="px-4 py-3">
                        <LeaveStatusBadge status={leave.leave_status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title="View details"
                            aria-label="View details"
                            onClick={() => setViewing(leave)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {leave.leave_status === 'pending' && (
                            <>
                              <button
                                type="button"
                                title="Approve"
                                aria-label="Approve"
                                onClick={() => openConfirm('approve', leave)}
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-green-50 hover:text-green-600"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title="Disapprove"
                                aria-label="Disapprove"
                                onClick={() => openConfirm('disapprove', leave)}
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            title="Delete"
                            aria-label="Delete"
                            onClick={() => openConfirm('delete', leave)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No leave requests found.</td></tr>
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

      <LeaveDetailModal
        leave={viewing}
        onClose={() => setViewing(null)}
        onApprove={(leave) => openConfirm('approve', leave)}
        onDisapprove={(leave) => openConfirm('disapprove', leave)}
      />

      <Modal open={confirm !== null} title={copy?.title ?? ''} onClose={() => setConfirm(null)}>
        {copy && (
          <>
            <p className="text-sm text-gray-600">{copy.body}</p>
            {copy.note && <p className="mt-2 text-sm text-gray-500">{copy.note}</p>}
            {confirmError && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{confirmError}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button variant={copy.variant} onClick={runConfirm} loading={confirmLoading}>
                {copy.button}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}