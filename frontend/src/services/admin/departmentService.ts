import type { Department, DepartmentPayload } from '../../types/admin/organization';
import { createCrudService } from './crudService';

export const departmentService = createCrudService<Department, DepartmentPayload>('departments');