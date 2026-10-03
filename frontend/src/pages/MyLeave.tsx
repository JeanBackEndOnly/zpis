import { ArrowLeft, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button/Button';
import PortalLayout from '../components/layout/PortalLayout';
import LeaveRequestModal from '../components/leave/LeaveRequestModal';
import LeaveStatusBadge from '../components/leave/LeaveStatusBadge';
import Modal from '../components/Modal/Modal';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../lib/dateRange';
import { getErrorMessage } from '../lib/getErrorMessage';
import { leaveTypeText, summarizeDates } from '../lib/leave';
import { leaveRequestService } from '../services/leaveRequestService';
import type { PaginatedResponse } from '../types/api';
import type { LeaveRequest, LeaveStatus } from '../types/leave';

type Tab = '' | LeaveStatus;

const tabs: { key: Tab; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approve', label: 'Approved' },
  { key: 'disapproved', label: 'Disapproved' },
];

export default function MyLeave() {
  const toast = useToast();

  const [data, setData] = useState<PaginatedResponse<LeaveRequest> | null>(null);
  const [tab, setTab] = useState<Tab>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [cancelling, setCancelling] = useState<LeaveRequest | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveRequestService.list({ page, leave_status: tab || undefined });
      setData(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, tab, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSubmitted(message: string) {
    toast.success(message);
    setFormOpen(false);
    if (page !== 1 || tab === 'approve' || tab === 'disapproved') {
      setTab('');
      setPage(1);
    } else {
      load();
    }
  }

  async function handleCancel() {
    if (!cancelling) return;
    setCancelLoading(true);
    setCancelError('');
    try {
      const res = await leaveRequestService.cancel(cancelling.id);
      toast.success(res.message);
      setCancelling(null);
      if (data && data.data.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch (err) {
      setCancelError(getErrorMessage(err));
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <PortalLayout>
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-red-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">My leave requests</h2>
          <p className="text-sm text-gray-500">{data ? `${data.total} total` : 'Loading...'}</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Request a leave
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-gray-100 p-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                tab === t.key ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Leave</th>
                <th className="px-4 py-3">Date(s)</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Status</th>
                <th className="w-16 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : data?.data.length ? (
                data.data.map((leave) => (
                  <tr key={leave.id} className="border-t border-gray-100 align-top transition hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDate(leave.request_date)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{leaveTypeText(leave)}</p>
                      <p className="max-w-xs truncate text-xs text-gray-500">{leave.purpose}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {summarizeDates(leave.leave_dates.map((d) => d.leave_date))}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{leave.number_of_days}</td>
                    <td className="px-4 py-3">
                      <LeaveStatusBadge status={leave.leave_status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {leave.leave_status === 'pending' && (
                        <button
                          type="button"
                          title="Cancel request"
                          aria-label="Cancel request"
                          onClick={() => {
                            setCancelling(leave);
                            setCancelError('');
                          }}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {tab ? 'No requests with this status.' : "You haven't requested any leave yet."}
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

      <LeaveRequestModal open={formOpen} onClose={() => setFormOpen(false)} onSubmitted={handleSubmitted} />

      <Modal open={cancelling !== null} title="Cancel leave request" onClose={() => setCancelling(null)}>
        <p className="text-sm text-gray-600">
          Cancel your{' '}
          <span className="font-semibold text-gray-900">{cancelling ? leaveTypeText(cancelling) : ''}</span> request
          for{' '}
          <span className="font-semibold text-gray-900">
            {cancelling ? summarizeDates(cancelling.leave_dates.map((d) => d.leave_date)) : ''}
          </span>
          ? This cannot be undone.
        </p>
        {cancelError && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{cancelError}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCancelling(null)}>Keep request</Button>
          <Button onClick={handleCancel} loading={cancelLoading}>Cancel request</Button>
        </div>
      </Modal>
    </PortalLayout>
  );
}