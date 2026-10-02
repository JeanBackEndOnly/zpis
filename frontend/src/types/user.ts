export type UserRole = 'admin' | 'hr' | 'payroll' | 'head' | 'employee';
export type UserStatus = 'Active' | 'Deactivated' | 'Inactive';

export interface User {
  id: number;
  email: string;
  user_role: UserRole;
  status: UserStatus;
}

export interface LoginResponse {
  message: string;
  token_type: string;
  token: string;
  user: User;
}