import api from '../../lib/axios';
import type {
  EmployeeOptionsResponse,
  EmployeeSchedule,
  EmployeeSchedulePayload,
} from '../../types/admin/schedule';
import { createCrudService } from './crudService';

const crud = createCrudService<EmployeeSchedule, EmployeeSchedulePayload>('employee-schedules');

export const employeeScheduleService = {
  ...crud,

  // Assignable employees (ids are employee_information ids) + users missing Employment Details
  employeeOptions: async () =>
    (await api.get<EmployeeOptionsResponse>('/admin/employee-schedules/employees')).data,
};