import type { ScheduleTemplate, ScheduleTemplatePayload } from '../../types/admin/schedule';
import { createCrudService } from './crudService';

export const scheduleTemplateService = createCrudService<ScheduleTemplate, ScheduleTemplatePayload>('schedules');