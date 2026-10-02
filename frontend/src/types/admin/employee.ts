import type { UserRole, UserStatus } from '../user';

// Shape returned by GET /admin/users
export interface Employee {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  full_name: string;
  sex: 'male' | 'female' | null;
  birthday: string | null;
  email: string;
  user_role: UserRole;
  status: UserStatus;
}

// Shape sent to POST / PUT /admin/users
export interface EmployeePayload {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  sex: string;
  birthday: string;
  email: string;
  password: string;
  user_role: string;
  status: string;
}