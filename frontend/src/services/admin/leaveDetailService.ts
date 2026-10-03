import api from '../../lib/axios';
import type { LeaveListResponse, LeaveRequest } from '../../types/leave';
import type { ApiResponse } from '../../types/api';

// Admin / HR: review, approve, disapprove and delete leave requests
export const leaveDetailService = {
  list: async (params: Record<string, string | number | undefined> = {}) =>
    (await api.get<LeaveListResponse>('/admin/leave-details', { params })).data,

  get: async (id: number) => (await api.get<ApiResponse<LeaveRequest>>(`/admin/leave-details/${id}`)).data,

  approve: async (id: number) =>
    (await api.put<ApiResponse<LeaveRequest>>(`/admin/leave-details/${id}/approve`)).data,

  disapprove: async (id: number) =>
    (await api.put<ApiResponse<LeaveRequest>>(`/admin/leave-details/${id}/disapprove`)).data,

  remove: async (id: number) => (await api.delete<ApiResponse<null>>(`/admin/leave-details/${id}`)).data,
};