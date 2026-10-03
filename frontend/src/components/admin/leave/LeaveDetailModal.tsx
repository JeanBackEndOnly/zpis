import type { ReactNode } from 'react';
import { formatDate } from '../../../lib/dateRange';
import { formatLongDate, fullName, leaveTypeText } from '../../../lib/leave';
import type { LeaveRequest } from '../../../types/leave';
import Button from '../../Button/Button';
import LeaveStatusBadge from '../../leave/LeaveStatusBadge';
import Modal from '../../Modal/Modal';

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

interface Props {
  leave: LeaveRequest | null;
  onClose: () => void;
  onApprove: (leave: LeaveRequest) => void;
  onDisapprove: (leave: LeaveRequest) => void;
}

export default function LeaveDetailModal({ leave, onClose, onApprove, onDisapprove }: Props) {
  const info = leave?.employee_information;

  return (
    <Modal open={leave !== null} title="Leave request" size="lg" onClose={onClose}>
      {leave && (
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold [overflow-wrap:anywhere]">{fullName(info?.user)}</p>
              <p className="text-sm text-gray-500">
                {info?.employment_id ?? '—'} · {info?.department?.department_name ?? '—'}
                {info?.unit_section ? ` · ${info.unit_section.unit_section_name}` : ''}
              </p>
            </div>
            <LeaveStatusBadge status={leave.leave_status} />
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Item label="Leave applied for">{leaveTypeText(leave)}</Item>
            <Item label="Requested on">{formatDate(leave.request_date)}</Item>
            <div className="sm:col-span-2">
              <Item label="Course / purpose">{leave.purpose}</Item>
            </div>
            <Item label="No. of days">{leave.number_of_days}</Item>
            <Item label="Contact no. while on leave">{leave.contact}</Item>
            <Item label="Section head">{leave.section_head || '—'}</Item>
            <Item label="Department head">{leave.department_head || '—'}</Item>
          </dl>

          <div className="mt-5">
            <p className="mb-2 text-xs text-gray-500">Inclusive dates</p>
            <div className="flex flex-wrap gap-2">
              {leave.leave_dates.map((d) => (
                <span key={d.id} className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  {formatLongDate(d.leave_date)}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            {leave.leave_status === 'pending' && (
              <>
                <Button variant="danger" onClick={() => onDisapprove(leave)}>Disapprove</Button>
                <Button variant="success" onClick={() => onApprove(leave)}>Approve</Button>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}