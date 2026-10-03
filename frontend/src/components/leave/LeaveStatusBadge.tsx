import { leaveStatusLabels } from '../../lib/leave';
import type { LeaveStatus } from '../../types/leave';

const colors: Record<LeaveStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  approve: 'bg-green-50 text-green-700 ring-green-600/20',
  disapproved: 'bg-red-50 text-red-700 ring-red-600/20',
};

export default function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colors[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {leaveStatusLabels[status]}
    </span>
  );
}