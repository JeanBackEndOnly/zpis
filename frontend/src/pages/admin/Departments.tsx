import Badge from '../../components/Badge/Badge';
import CrudPage from '../../components/admin/CrudPage';
import { departmentService } from '../../services/admin/departmentService';
import type { Department, DepartmentPayload } from '../../types/admin/organization';

export default function Departments() {
  return (
    <CrudPage<Department, DepartmentPayload>
      title="Department"
      service={departmentService}
      rowLabel={(r) => r.department_name}
      columns={[
        { label: 'Code', render: (r) => <Badge>{r.department_code}</Badge> },
        { label: 'Name', render: (r) => <span className="font-medium">{r.department_name}</span> },
      ]}
      fields={[
        { name: 'department_code', label: 'Department code', type: 'text' },
        { name: 'department_name', label: 'Department name', type: 'text' },
      ]}
    />
  );
}