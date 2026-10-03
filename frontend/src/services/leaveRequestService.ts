import api from '../lib/axios';
import type { LeaveRequest, LeaveRequestPayload } from '../types/leave';
import type { ApiResponse, PaginatedResponse } from '../types/api';

// Employee self-service: the logged-in employee's own leave requests
export const leaveRequestService = {
  list: async (params: Record<string, string | number | undefined> = {}) =>
    (await api.get<ApiResponse<PaginatedResponse<LeaveRequest>>>('/leave-requests', { params })).data,

  create: async (payload: LeaveRequestPayload) =>
    (await api.post<ApiResponse<LeaveRequest>>('/leave-requests', payload)).data,

  // Withdraw a request that is still pending
  cancel: async (id: number) => (await api.delete<ApiResponse<null>>(`/leave-requests/${id}`)).data,
};