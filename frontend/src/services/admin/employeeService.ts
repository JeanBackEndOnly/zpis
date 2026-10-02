import type { Employee, EmployeePayload } from '../../types/admin/employee';
import { createCrudService } from './crudService';

export const employeeService = createCrudService<Employee, EmployeePayload>('users');