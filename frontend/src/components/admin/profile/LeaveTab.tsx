import { useSectionForm } from '../../../hooks/useSectionForm';
import { employeeProfileService } from '../../../services/admin/employeeProfileService';
import type { EmployeeProfile, LeaveType } from '../../../types/admin/employeeProfile';
import type { ApiResponse } from '../../../types/api';
import Button from '../../Button/Button';
import ProfileField from './ProfileField';

interface Props {
  profile: EmployeeProfile;
  onSaved: (res: ApiResponse<EmployeeProfile>) => void;
}

const leaveTypes: { type: LeaveType; label: string }[] = [
  { type: 'vacation', label: 'Vacation leave' },
  { type: 'sick', label: 'Sick leave' },
  { type: 'special', label: 'Special leave' },
  { type: 'others', label: 'Other leave' },
];

export default function LeaveTab({ profile, onSaved }: Props) {
  const userId = profile.user.id;
  const hasEmployment = profile.employment !== null;

  const initial: Record<string, string> = {};
  profile.leave_credits.forEach((c) => {
    initial[`${c.leave_type}_used`] = c.used;
    initial[`${c.leave_type}_remaining`] = c.remaining;
  });

  const form = useSectionForm(initial, async (values) => {
    const credits = leaveTypes.map(({ type }) => ({
      leave_type: type,
      used: Number(values[`${type}_used`] || 0),
      remaining: Number(values[`${type}_remaining`] || 0),
    }));
    onSaved(await employeeProfileService.updateLeave(userId, { credits }));
  });

  return (
    <form onSubmit={form.submit}>
      {!hasEmployment && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Save this employee&apos;s <strong>Employment Details</strong> first, then you can set leave credits.
        </p>
      )}
      {form.formError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{form.formError}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {leaveTypes.map(({ type, label }, i) => {
          const used = Number(form.values[`${type}_used`] || 0);
          const remaining = Number(form.values[`${type}_remaining`] || 0);
          const total = used + remaining;
          const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0;

          return (
            <div key={type} className="rounded-xl border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium">{label}</h4>
                <span className="text-xs text-gray-500">
                  {Number(remaining.toFixed(2))} of {Number(total.toFixed(2))} days left
                </span>
              </div>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${percent}%` }} />
              </div>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <ProfileField
                  form={form}
                  name={`${type}_used`}
                  label="Used"
                  type="number"
                  errorKey={`credits.${i}.used`}
                />
                <ProfileField
                  form={form}
                  name={`${type}_remaining`}
                  label="Remaining"
                  type="number"
                  errorKey={`credits.${i}.remaining`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" loading={form.saving} disabled={!hasEmployment}>
          Save changes
        </Button>
      </div>
    </form>
  );
}