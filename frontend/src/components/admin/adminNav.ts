import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Clock,
  LayoutDashboard,
  Megaphone,
  Receipt,
  Settings2,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavLinkItem {
  label: string;
  icon: LucideIcon;
  to: string;
  end?: boolean;
}

export interface NavGroupItem {
  label: string;
  icon: LucideIcon;
  children: { label: string; to: string }[];
}

export type NavItem = NavLinkItem | NavGroupItem;

export const adminNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin', end: true },
  { label: 'Employees', icon: Users, to: '/admin/employees' },
  {
    label: 'System Management',
    icon: Settings2,
    children: [
      { label: 'Department', to: '/admin/departments' },
      { label: 'Unit Section', to: '/admin/unit-sections' },
      { label: 'Position', to: '/admin/positions' },
    ],
  },
  { label: 'Leave Management', icon: CalendarDays, to: '/admin/leave-management' },
  { label: 'Overtime', icon: Clock, to: '/admin/overtime' },
  { label: 'Payroll', icon: Wallet, to: '/admin/payroll' },
  { label: 'Payslip', icon: Receipt, to: '/admin/payslip' },
  { label: 'Scheduling', icon: CalendarClock, to: '/admin/scheduling' },
  { label: 'Attendance', icon: CalendarCheck, to: '/admin/attendance' },
  { label: 'Announcements', icon: Megaphone, to: '/admin/announcements' },
  { label: 'Account Settings', icon: UserCog, to: '/admin/account-settings' },
];