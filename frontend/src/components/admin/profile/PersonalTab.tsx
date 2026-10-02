import { useSectionForm } from '../../../hooks/useSectionForm';
import { employeeProfileService } from '../../../services/admin/employeeProfileService';
import type { EmployeeProfile } from '../../../types/admin/employeeProfile';
import type { ApiResponse } from '../../../types/api';
import Button from '../../Button/Button';
import ProfileField from './ProfileField';

interface Props {
  profile: EmployeeProfile;
  onSaved: (res: ApiResponse<EmployeeProfile>) => void;
}

const sexOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const civilStatusOptions = ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'].map((v) => ({
  value: v,
  label: v,
}));

export default function PersonalTab({ profile, onSaved }: Props) {
  const u = profile.user;

  const form = useSectionForm(
    {
      first_name: u.first_name,
      middle_name: u.middle_name ?? '',
      last_name: u.last_name,
      suffix: u.suffix ?? '',
      contact: u.contact ?? '',
      sex: u.sex ?? '',
      civil_status: u.civil_status ?? '',
      citizenship: u.citizenship ?? '',
      religion: u.religion ?? '',
      birthday: u.birthday?.slice(0, 10) ?? '',
      birthPlace: u.birthPlace ?? '',
    },
    async (values) => onSaved(await employeeProfileService.updatePersonal(u.id, values)),
  );

  return (
    <form onSubmit={form.submit}>
      {form.formError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{form.formError}</p>
      )}

      <div className="grid gap-x-4 sm:grid-cols-2">
        <ProfileField form={form} name="first_name" label="First name" />
        <ProfileField form={form} name="middle_name" label="Middle name" optional />
        <ProfileField form={form} name="last_name" label="Last name" />
        <ProfileField form={form} name="suffix" label="Suffix" optional placeholder="Jr., III" />
        <ProfileField form={form} name="sex" label="Sex" type="select" options={sexOptions} />
        <ProfileField form={form} name="birthday" label="Birthday" type="date" />
        <ProfileField form={form} name="birthPlace" label="Birthplace" optional />
        <ProfileField form={form} name="contact" label="Contact number" optional placeholder="09XX XXX XXXX" />
        <ProfileField form={form} name="civil_status" label="Civil status" type="select" options={civilStatusOptions} optional />
        <ProfileField form={form} name="citizenship" label="Citizenship" optional />
        <ProfileField form={form} name="religion" label="Religion" optional />
      </div>

      <div className="mt-2 flex justify-end">
        <Button type="submit" loading={form.saving}>Save changes</Button>
      </div>
    </form>
  );
}