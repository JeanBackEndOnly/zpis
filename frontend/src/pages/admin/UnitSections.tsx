import Badge from '../../components/Badge/Badge';
import CrudPage from '../../components/admin/CrudPage';
import { unitSectionService } from '../../services/admin/unitSectionService';
import type { UnitSection, UnitSectionPayload } from '../../types/admin/organization';

export default function UnitSections() {
  return (
    <CrudPage<UnitSection, UnitSectionPayload>
      title="Unit section"
      service={unitSectionService}
      rowLabel={(r) => r.unit_section_name}
      columns={[
        { label: 'Code', render: (r) => <Badge>{r.unit_section_code}</Badge> },
        { label: 'Name', render: (r) => <span className="font-medium">{r.unit_section_name}</span> },
        { label: 'Department', render: (r) => <span className="text-gray-600">{r.department?.department_name ?? '—'}</span> },
      ]}
      fields={[
        { name: 'department_id', label: 'Department', type: 'department' },
        { name: 'unit_section_code', label: 'Unit section code', type: 'text' },
        { name: 'unit_section_name', label: 'Unit section name', type: 'text' },
      ]}
    />
  );
}