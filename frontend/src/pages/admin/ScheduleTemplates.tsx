import Badge from '../../components/Badge/Badge';
import CrudPage from '../../components/admin/CrudPage';
import { scheduleTemplateService } from '../../services/admin/scheduleTemplateService';
import type { ScheduleTemplate, ScheduleTemplatePayload } from '../../types/admin/schedule';

const shiftOptions = [
  { value: 'Day', label: 'Day' },
  { value: 'Mid', label: 'Mid' },
  { value: 'Night', label: 'Night' },
];

// "08:00:00" -> "8:00 AM"
function formatTime(value: string) {
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default function ScheduleTemplates() {
  return (
    <CrudPage<ScheduleTemplate, ScheduleTemplatePayload>
      title="Schedule template"
      service={scheduleTemplateService}
      rowLabel={(r) => r.schedule_name}
      filters={[{ name: 'shift', label: 'Shifts', options: shiftOptions }]}
      columns={[
        { label: 'Name', render: (r) => <span className="font-medium">{r.schedule_name}</span> },
        { label: 'Shift', render: (r) => <Badge>{r.shift}</Badge> },
        { label: 'From', render: (r) => <span className="text-gray-600">{formatTime(r.schedule_from)}</span> },
        { label: 'To', render: (r) => <span className="text-gray-600">{formatTime(r.schedule_to)}</span> },
      ]}
      fields={[
        { name: 'schedule_name', label: 'Schedule name', type: 'text', placeholder: 'e.g. SHIFT-A (max 10 characters)' },
        { name: 'shift', label: 'Shift', type: 'select', options: shiftOptions },
        { name: 'schedule_from', label: 'Time in', type: 'time' },
        { name: 'schedule_to', label: 'Time out', type: 'time' },
      ]}
    />
  );
}