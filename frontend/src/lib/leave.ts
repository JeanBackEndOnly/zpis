import type { LeaveRequest, LeaveStatus, LeaveType } from '../types/leave';

export const leaveTypeLabels: Record<LeaveType, string> = {
  vacation_leave: 'Vacation Leave',
  sick_leave: 'Sick Leave',
  special_leave: 'Special Leave',
  others_leave: 'Others',
};

export const leaveStatusLabels: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approve: 'Approved',
  disapproved: 'Disapproved',
};

// Vacation, sick and special leave are deducted from leave credits, "others" is not
export const leaveUsesCredits = (type: LeaveType) => type !== 'others_leave';

// "Others: Maternity" or "Vacation Leave"
export function leaveTypeText(leave: Pick<LeaveRequest, 'leave_type' | 'others_specify'>) {
  if (leave.leave_type === 'others_leave' && leave.others_specify) {
    return `Others: ${leave.others_specify}`;
  }
  return leaveTypeLabels[leave.leave_type];
}

interface NameParts {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
}

export function fullName(user?: NameParts | null) {
  if (!user) return 'Unknown employee';
  return [user.first_name, user.middle_name, user.last_name, user.suffix].filter(Boolean).join(' ');
}

export function initials(user?: NameParts | null) {
  if (!user) return '?';
  return `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase();
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 86_400_000;

const parts = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return { year, month, day };
};

const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / DAY_MS);

function rangeLabel(from: string, to: string) {
  const a = parts(from);
  const b = parts(to);

  if (from === to) return `${MONTHS[a.month - 1]} ${a.day}, ${a.year}`;
  if (a.year === b.year && a.month === b.month) return `${MONTHS[a.month - 1]} ${a.day}–${b.day}, ${a.year}`;
  if (a.year === b.year) return `${MONTHS[a.month - 1]} ${a.day} – ${MONTHS[b.month - 1]} ${b.day}, ${a.year}`;
  return `${MONTHS[a.month - 1]} ${a.day}, ${a.year} – ${MONTHS[b.month - 1]} ${b.day}, ${b.year}`;
}

// ["2026-10-05","2026-10-06","2026-10-07","2026-10-12"] -> "Oct 5–7, 2026, Oct 12, 2026"
export function summarizeDates(values: string[]) {
  const dates = [...new Set(values.map((v) => v.slice(0, 10)))].sort();
  const groups: [string, string][] = [];

  for (const date of dates) {
    const last = groups[groups.length - 1];
    if (last && daysBetween(last[1], date) === 1) last[1] = date;
    else groups.push([date, date]);
  }

  return groups.map(([from, to]) => rangeLabel(from, to)).join(', ');
}

// "2026-10-05" -> "Mon, Oct 5, 2026"
export function formatLongDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}