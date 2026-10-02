import api from '../../lib/axios';
import type { EmployeeProfile, LeavePayload } from '../../types/admin/employeeProfile';
import type { ApiResponse } from '../../types/api';

type ProfileResponse = ApiResponse<EmployeeProfile>;

export const employeeProfileService = {
  get: async (id: number) => (await api.get<ProfileResponse>(`/admin/employees/${id}`)).data,

  updatePersonal: async (id: number, payload: Record<string, string>) =>
    (await api.put<ProfileResponse>(`/admin/employees/${id}/personal`, payload)).data,

  updateEmployment: async (id: number, payload: Record<string, string | number>) =>
    (await api.put<ProfileResponse>(`/admin/employees/${id}/employment`, payload)).data,

  updateLeave: async (id: number, payload: LeavePayload) =>
    (await api.put<ProfileResponse>(`/admin/employees/${id}/leave`, payload)).data,
};