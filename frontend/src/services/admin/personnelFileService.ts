import api from '../../lib/axios';
import type { ApiResponse, PaginatedResponse } from '../../types/api';
import type {
  PersonnelEmployee,
  PersonnelEmployeeFiles,
  PersonnelFile,
  PersonnelFileType,
} from '../../types/admin/personnel';

export interface PersonnelFileUpload {
  file_type: PersonnelFileType;
  file_name: string;
  file: File;
}

// Admin / HR: the 201 files of every employee
export const personnelFileService = {
  employees: async (params: Record<string, string | number | undefined> = {}) =>
    (await api.get<ApiResponse<PaginatedResponse<PersonnelEmployee>>>('/admin/personnel-201-files', { params })).data,

  get: async (employeeId: number) =>
    (await api.get<ApiResponse<PersonnelEmployeeFiles>>(`/admin/personnel-201-files/employee/${employeeId}`)).data,

  upload: async (employeeId: number, payload: PersonnelFileUpload) => {
    const form = new FormData();
    form.append('file_type', payload.file_type);
    if (payload.file_name.trim()) form.append('file_name', payload.file_name.trim());
    form.append('file', payload.file);

    return (
      await api.post<ApiResponse<PersonnelFile>>(`/admin/personnel-201-files/employee/${employeeId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data;
  },

    // file is optional: without it the current file is kept
  update: async (id: number, payload: { file_type: PersonnelFileType; file_name: string; file: File | null }) => {
    const form = new FormData();
    form.append('file_type', payload.file_type);
    form.append('file_name', payload.file_name.trim());
    if (payload.file) form.append('file', payload.file);

    return (
      await api.post<ApiResponse<PersonnelFile>>(`/admin/personnel-201-files/${id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data;
  },

  download: async (id: number) =>
    (await api.get<Blob>(`/admin/personnel-201-files/${id}/download`, { responseType: 'blob' })).data,

  remove: async (id: number) => (await api.delete<ApiResponse<null>>(`/admin/personnel-201-files/${id}`)).data,
};