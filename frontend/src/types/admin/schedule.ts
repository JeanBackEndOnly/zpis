import type { ApiResponse } from '../api';

export interface ScheduleTemplate {
  id: number;
  schedule_name: string;
  schedule_from: string; // "HH:mm:ss" from Laravel's time column
  schedule_to: string;
  shift: string;
}

export type ScheduleTemplatePayload = Omit<ScheduleTemplate, 'id'>;

// Shape returned by GET /admin/employee-schedules
export interface EmployeeSchedule {
  id: number;
  employee_id: number;
  schedule_id: number;
  effective_date: string; // "YYYY-MM-DD"
  next_effective_date?: string | null; // when the employee's next schedule starts (null = no end date)
  employee_information?: {
    id: number;
    employment_id: string;
    department_id: number;
    unit_section_id: number | null;
    user?: {
      first_name: string;
      middle_name: string | null;
      last_name: string;
      suffix: string | null;
      email: string;
    };
    department?: { department_name: string } | null;
    unit_section?: { unit_section_name: string } | null;
  };
  schedule_template?: ScheduleTemplate;
}

export interface EmployeeSchedulePayload {
  employee_id: number;
  schedule_id: number;
  effective_date: string;
}

// One assignable employee (id = employee_information id)
export interface EmployeeOption {
  id: number;
  employment_id: string;
  name: string;
  department_id: number;
  unit_section_id: number | null;
}

// Active user who has not had Employment Details saved yet
export interface IncompleteEmployee {
  user_id: number;
  name: string;
}

// Shape returned by GET /admin/employee-schedules/employees
export interface EmployeeOptionsResponse extends ApiResponse<EmployeeOption[]> {
  incomplete: IncompleteEmployee[];
}