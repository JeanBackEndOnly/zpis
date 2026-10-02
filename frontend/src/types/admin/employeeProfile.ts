import type { Employee } from './employee';
import type { Department, Position, UnitSection } from './organization';

// Personal info comes from the users table
export interface ProfileUser extends Employee {
  contact: string | null;
  civil_status: string | null;
  citizenship: string | null;
  religion: string | null;
  birthPlace: string | null;
  profile_picture: string | null;
}

export interface SalaryRecord {
  id: number;
  basic_salary: string;
  salary_type: string;
  date_effective: string;
  is_current: boolean;
}

// employee_information row (null until employment details are saved once)
export interface EmploymentInfo {
  id: number;
  user_id: number;
  department_id: number;
  unit_section_id: number | null; // null when the department has no unit sections
  position_id: number;
  employment_id: string;
  employment_status: string;
  date_hired: string;
  sss_no: string | null;
  philhealth_no: string | null;
  pagibig_no: string | null;
  tin_no: string | null;
  houseBlock: string | null;
  street: string | null;
  subdivision: string | null;
  barangay: string | null;
  city_muntinlupa: string | null;
  province: string | null;
  zip_code: string | null;
  department: Department | null;
  unit_section: UnitSection | null;
  position: Position | null;
  current_employment_detail: SalaryRecord | null;
}

export type LeaveType = 'vacation' | 'sick' | 'special' | 'others';

export interface LeaveCreditRow {
  leave_type: LeaveType;
  used: string;
  remaining: string;
}

export interface EmployeeProfile {
  user: ProfileUser;
  employment: EmploymentInfo | null;
  leave_credits: LeaveCreditRow[];
}

export interface LeavePayload {
  credits: { leave_type: LeaveType; used: number; remaining: number }[];
}