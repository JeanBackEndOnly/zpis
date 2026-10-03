import type { ApiResponse, PaginatedResponse } from './api';

export type LeaveType = 'vacation_leave' | 'sick_leave' | 'special_leave' | 'others_leave';

// Values match the leave_details.leave_status enum on the backend
export type LeaveStatus = 'pending' | 'approve' | 'disapproved';

export interface LeaveDate {
  id: number;
  leave_id: number;
  leave_date: string; // "YYYY-MM-DD"
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: LeaveType;
  others_specify: string | null;
  purpose: string;
  number_of_days: number;
  contact: string;
  section_head: string | null;
  department_head: string | null;
  request_date: string; // "YYYY-MM-DD"
  leave_status: LeaveStatus;
  leave_dates: LeaveDate[];
  // Only returned by the admin endpoints
  employee_information?: {
    id: number;
    user_id: number;
    employment_id: string;
    user?: {
      id: number;
      first_name: string;
      middle_name: string | null;
      last_name: string;
      suffix: string | null;
      email: string;
    } | null;
    department?: { id: number; department_name: string } | null;
    unit_section?: { id: number; unit_section_name: string } | null;
  } | null;
}

// Body of POST /leave-requests (the number of days is counted by the server)
export interface LeaveRequestPayload {
  leave_type: LeaveType;
  others_specify: string | null;
  purpose: string;
  dates: string[];
  contact: string;
  section_head: string | null;
  department_head: string | null;
}

export interface LeaveCounts {
  pending: number;
  approve: number;
  disapproved: number;
}

// GET /admin/leave-details also returns the number of requests per status
export interface LeaveListResponse extends ApiResponse<PaginatedResponse<LeaveRequest>> {
  counts: LeaveCounts;
}

export interface LeaveRequestPayload {
  leave_type: LeaveType;
  others_specify: string | null;
  purpose: string;
  dates: string[];
  contact: string;
  section_head: string | null;
  department_head: string | null;
  medical_proof: File | null; // <-- add this
}