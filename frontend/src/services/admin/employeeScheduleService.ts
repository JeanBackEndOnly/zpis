import { isAxiosError } from 'axios';
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

  // CSV of the filtered schedules (same filters as list, but every page)
  exportCsv: async (params: Record<string, string | number | undefined>) => {
    try {
      const res = await api.get<Blob>('/admin/employee-schedules/export', {
        params,
        responseType: 'blob',
      });
      return res.data;
    } catch (err) {
      // With responseType "blob" the error body is a Blob too, so turn it back into JSON
      // to let getErrorMessage() read the server's message
      if (isAxiosError(err) && err.response?.data instanceof Blob) {
        try {
          err.response.data = JSON.parse(await err.response.data.text());
        } catch {
          // keep the blob if it is not JSON
        }
      }
      throw err;
    }
  },
};