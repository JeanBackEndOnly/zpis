import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge/Badge';
import StatusBadge from '../../components/Badge/StatusBadge';
import CrudPage, { type Option } from '../../components/admin/CrudPage';
import { employeeService } from '../../services/admin/employeeService';
import type { Employee, EmployeePayload } from '../../types/admin/employee';

const roleOptions: Option[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'hr', label: 'HR' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'head', label: 'Head' },
  { value: 'employee', label: 'Employee' },
];

const statusOptions: Option[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Deactivated', label: 'Deactivated' },
  { value: 'Inactive', label: 'Inactive' },
];

const sexOptions: Option[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const roleLabel = (role: string) => roleOptions.find((o) => o.value === role)?.label ?? role;

export default function Employees() {
  return (
    <CrudPage<Employee, EmployeePayload>
      title="Employee"
      service={employeeService}
      rowLabel={(r) => r.full_name}
      twoColumn
      rowActions={(r) => (
        <Link
          to={`/admin/employees/${r.id}`}
          aria-label="View profile"
          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <Eye className="h-4 w-4" />
        </Link>
      )}
      filters={[
        { name: 'user_role', label: 'Roles', options: roleOptions },
        { name: 'status', label: 'Statuses', options: statusOptions },
      ]}
      columns={[
        {
          label: 'Employee',
          render: (r) => (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
                {`${r.first_name[0] ?? ''}${r.last_name[0] ?? ''}`.toUpperCase()}
              </div>
              <div className="min-w-0">
                <Link to={`/admin/employees/${r.id}`} className="block truncate font-medium transition hover:text-red-600">
                  {r.full_name}
                </Link>
                <p className="truncate text-xs text-gray-500">{r.email}</p>
              </div>
            </div>
          ),
        },
        { label: 'Role', render: (r) => <Badge>{roleLabel(r.user_role)}</Badge> },
        { label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      ]}
      fields={[
        { name: 'first_name', label: 'First name', type: 'text' },
        { name: 'middle_name', label: 'Middle name', type: 'text', required: false },
        { name: 'last_name', label: 'Last name', type: 'text' },
        { name: 'suffix', label: 'Suffix', type: 'text', required: false, placeholder: 'Jr., III' },
        { name: 'sex', label: 'Sex', type: 'select', options: sexOptions },
        { name: 'birthday', label: 'Birthday', type: 'date' },
        { name: 'email', label: 'Email', type: 'email', full: true, placeholder: 'name@company.com' },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          required: 'create',
          full: true,
          placeholder: 'At least 8 characters',
          editHint: 'Leave blank to keep the current password.',
        },
        { name: 'user_role', label: 'Role', type: 'select', options: roleOptions },
        { name: 'status', label: 'Status', type: 'select', options: statusOptions },
      ]}
    />
  );
}