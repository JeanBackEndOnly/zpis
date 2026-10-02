import { useEffect, useState, type ReactNode } from 'react';
import { useSectionForm } from '../../../hooks/useSectionForm';
import { departmentService } from '../../../services/admin/departmentService';
import { employeeProfileService } from '../../../services/admin/employeeProfileService';
import { positionService } from '../../../services/admin/positionService';
import { unitSectionService } from '../../../services/admin/unitSectionService';
import type { EmployeeProfile } from '../../../types/admin/employeeProfile';
import type { Department, Position, UnitSection } from '../../../types/admin/organization';
import type { ApiResponse } from '../../../types/api';
import Button from '../../Button/Button';
import ProfileField from './ProfileField';

interface Props {
  profile: EmployeeProfile;
  onSaved: (res: ApiResponse<EmployeeProfile>) => void;
}

// Keep in sync with EmployeeInformation::EMPLOYMENT_STATUSES on the backend
const statusOptions = ['Regular', 'Probationary', 'Contractual', 'Casual', 'Part-time'].map((v) => ({
  value: v,
  label: v,
}));

const salaryTypeOptions = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Hour', label: 'Hourly' },
  { value: 'Daily', label: 'Daily' },
  { value: 'Commission', label: 'Commission' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h4 className="mb-4 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-900">{title}</h4>
      <div className="grid gap-x-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export default function EmploymentTab({ profile, onSaved }: Props) {
  const userId = profile.user.id;
  const emp = profile.employment;
  const salary = emp?.current_employment_detail;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<UnitSection[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  const form = useSectionForm(
    {
      department_id: emp ? String(emp.department_id) : '',
      unit_section_id: emp ? String(emp.unit_section_id) : '',
      position_id: emp ? String(emp.position_id) : '',
      employment_id: emp?.employment_id ?? '',
      employment_status: emp?.employment_status ?? '',
      date_hired: emp?.date_hired?.slice(0, 10) ?? '',
      basic_salary: salary?.basic_salary ?? '',
      salary_type: salary?.salary_type ?? '',
      date_effective: salary?.date_effective?.slice(0, 10) ?? '',
      sss_no: emp?.sss_no ?? '',
      philhealth_no: emp?.philhealth_no ?? '',
      pagibig_no: emp?.pagibig_no ?? '',
      tin_no: emp?.tin_no ?? '',
      houseBlock: emp?.houseBlock ?? '',
      street: emp?.street ?? '',
      subdivision: emp?.subdivision ?? '',
      barangay: emp?.barangay ?? '',
      city_muntinlupa: emp?.city_muntinlupa ?? '',
      province: emp?.province ?? '',
      zip_code: emp?.zip_code ?? '',
    },
    async (values) => {
      const payload = {
        ...values,
        department_id: Number(values.department_id),
        unit_section_id: Number(values.unit_section_id),
        position_id: Number(values.position_id),
      };
      onSaved(await employeeProfileService.updateEmployment(userId, payload));
    },
  );

  const departmentId = form.values.department_id;

  useEffect(() => {
    departmentService
      .list({ per_page: 100 })
      .then((res) => setDepartments(res.data.data))
      .catch(() => setDepartments([]));
  }, []);

  // Unit sections and positions depend on the selected department
  useEffect(() => {
    if (!departmentId) {
      setUnits([]);
      setPositions([]);
      return;
    }
    Promise.all([
      unitSectionService.list({ department_id: departmentId, per_page: 100 }),
      positionService.list({ department_id: departmentId, per_page: 100 }),
    ])
      .then(([u, p]) => {
        setUnits(u.data.data);
        setPositions(p.data.data);
      })
      .catch(() => {
        setUnits([]);
        setPositions([]);
      });
  }, [departmentId]);

  function changeDepartment(value: string) {
    // Changing the department clears the unit section and position
    form.setValues((prev) => ({ ...prev, department_id: value, unit_section_id: '', position_id: '' }));
  }

  return (
    <form onSubmit={form.submit}>
      {form.formError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{form.formError}</p>
      )}

      <Section title="Employment">
        <ProfileField form={form} name="employment_id" label="Employee ID" />
        <ProfileField form={form} name="employment_status" label="Employment status" type="select" options={statusOptions} />
        <ProfileField
          form={form}
          name="department_id"
          label="Department"
          type="select"
          options={departments.map((d) => ({ value: String(d.id), label: d.department_name }))}
          onChange={changeDepartment}
        />
        <ProfileField
          form={form}
          name="unit_section_id"
          label="Unit section"
          type="select"
          options={units.map((u) => ({ value: String(u.id), label: u.unit_section_name }))}
        />
        <ProfileField
          form={form}
          name="position_id"
          label="Position"
          type="select"
          options={positions.map((p) => ({ value: String(p.id), label: p.position_title }))}
        />
        <ProfileField form={form} name="date_hired" label="Date hired" type="date" />
      </Section>

      <Section title="Compensation">
        <ProfileField form={form} name="basic_salary" label="Basic salary" type="number" placeholder="0.00" />
        <ProfileField form={form} name="salary_type" label="Salary type" type="select" options={salaryTypeOptions} />
        <ProfileField form={form} name="date_effective" label="Effective date" type="date" />
      </Section>

      <Section title="Government IDs">
        <ProfileField form={form} name="sss_no" label="SSS no." optional />
        <ProfileField form={form} name="philhealth_no" label="PhilHealth no." optional />
        <ProfileField form={form} name="pagibig_no" label="Pag-IBIG no." optional />
        <ProfileField form={form} name="tin_no" label="TIN no." optional />
      </Section>

      <Section title="Address">
        <ProfileField form={form} name="houseBlock" label="House / Block / Lot" optional />
        <ProfileField form={form} name="street" label="Street" optional />
        <ProfileField form={form} name="subdivision" label="Subdivision" optional />
        <ProfileField form={form} name="barangay" label="Barangay" optional />
        <ProfileField form={form} name="city_muntinlupa" label="City / Municipality" optional />
        <ProfileField form={form} name="province" label="Province" optional />
        <ProfileField form={form} name="zip_code" label="Zip code" optional />
      </Section>

      <div className="flex justify-end">
        <Button type="submit" loading={form.saving}>Save changes</Button>
      </div>
    </form>
  );
}