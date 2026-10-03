import api from '../lib/axios';
import type { LeaveRequest, LeaveRequestPayload } from '../types/leave';
import type { ApiResponse, PaginatedResponse } from '../types/api';

// Employee self-service: the logged-in employee's own leave requests
export const leaveRequestService = {
  list: async (params: Record<string, string | number | undefined> = {}) =>
    (await api.get<ApiResponse<PaginatedResponse<LeaveRequest>>>('/leave-requests', { params })).data,

    create: async (payload: LeaveRequestPayload) => {
    const form = new FormData();
    form.append('leave_type', payload.leave_type);
    if (payload.others_specify) form.append('others_specify', payload.others_specify);
    form.append('purpose', payload.purpose);
    payload.dates.forEach((date) => form.append('dates[]', date));
    form.append('contact', payload.contact);
    if (payload.section_head) form.append('section_head', payload.section_head);
    if (payload.department_head) form.append('department_head', payload.department_head);
    if (payload.medical_proof) form.append('medical_proof', payload.medical_proof);

    return (
      await api.post<ApiResponse<LeaveRequest>>('/leave-requests', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data;
  },
  // Withdraw a request that is still pending
  cancel: async (id: number) => (await api.delete<ApiResponse<null>>(`/leave-requests/${id}`)).data,
};