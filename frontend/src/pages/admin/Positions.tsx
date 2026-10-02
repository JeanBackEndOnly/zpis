import CrudPage from '../../components/admin/CrudPage';
import { positionService } from '../../services/admin/positionService';
import type { Position, PositionPayload } from '../../types/admin/organization';

export default function Positions() {
  return (
    <CrudPage<Position, PositionPayload>
      title="Position"
      service={positionService}
      rowLabel={(r) => r.position_title}
      columns={[
        { label: 'Title', render: (r) => <span className="font-medium">{r.position_title}</span> },
        { label: 'Department', render: (r) => <span className="text-gray-600">{r.department?.department_name ?? '—'}</span> },
      ]}
      fields={[
        { name: 'department_id', label: 'Department', type: 'department' },
        { name: 'position_title', label: 'Position title', type: 'text' },
      ]}
    />
  );
}