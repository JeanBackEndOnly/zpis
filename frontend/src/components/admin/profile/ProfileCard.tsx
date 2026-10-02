import { Building2, Hash, Mail, Network, type LucideIcon } from 'lucide-react';
import Badge from '../../Badge/Badge';
import StatusBadge from '../../Badge/StatusBadge';
import type { EmployeeProfile } from '../../../types/admin/employeeProfile';

function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="wrap-break-word font-medium text-gray-900">{value}</dd>
      </div>
    </div>
  );
}

const roleLabel = (role: string) => (role === 'hr' ? 'HR' : role.charAt(0).toUpperCase() + role.slice(1));

export default function ProfileCard({ profile }: { profile: EmployeeProfile }) {
  const { user, employment } = profile;
  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase();

  return (
    <div className="self-start rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-3xl font-semibold text-red-700 ring-4 ring-red-50">
          {initials}
        </div>
        <h2 className="mt-4 text-lg font-semibold">{user.full_name}</h2>
        <p className="text-sm text-gray-500">{employment?.position?.position_title ?? 'No position yet'}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Badge>{roleLabel(user.user_role)}</Badge>
          <StatusBadge status={user.status} />
        </div>
      </div>

      <dl className="mt-6 space-y-4 border-t border-gray-100 pt-6 text-sm">
        <Row icon={Hash} label="Employee ID" value={employment?.employment_id ?? '—'} />
        <Row icon={Building2} label="Department" value={employment?.department?.department_name ?? '—'} />
        <Row icon={Network} label="Unit" value={employment?.unit_section?.unit_section_name ?? '—'} />
        <Row icon={Mail} label="Email" value={user.email} />
      </dl>
    </div>
  );
}