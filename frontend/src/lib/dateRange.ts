export type RangeKey = 'all' | 'first' | 'second' | 'month' | 'custom';

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

const pad = (n: number) => String(n).padStart(2, '0');

const parseMonth = (month: string) => {
  const [year, m] = month.split('-').map(Number);
  return { year, m };
};

// Date -> "2026-09-15" (local time, no timezone shifting)
export const toIso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Today's month as "2026-09"
export function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

// "2026-09" + 1 -> "2026-10"
export function shiftMonth(month: string, delta: number) {
  const { year, m } = parseMonth(month);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function lastDayOfMonth(month: string) {
  const { year, m } = parseMonth(month);
  return new Date(year, m, 0).getDate();
}

// "2026-09" -> "September 2026"
export function monthName(month: string) {
  const { year, m } = parseMonth(month);
  return new Date(year, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// "2026-09-01" -> "09/01/2026"
export function formatShortDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${month}/${day}/${year}`;
}

// "2026-10-02" -> "Oct 2, 2026"
export function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// "2026-09-16" -> "2026-09-15"
export function dayBefore(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return toIso(date);
}

// The two pay-period style halves of a month, the whole month, or a custom range
export function rangeFor(key: RangeKey, month: string, customFrom: string, customTo: string): DateRange | null {
  const last = pad(lastDayOfMonth(month));

  switch (key) {
    case 'first':
      return { from: `${month}-01`, to: `${month}-15` };
    case 'second':
      return { from: `${month}-16`, to: `${month}-${last}` };
    case 'month':
      return { from: `${month}-01`, to: `${month}-${last}` };
    case 'custom':
      return customFrom && customTo && customFrom <= customTo ? { from: customFrom, to: customTo } : null;
    default:
      return null;
  }
}