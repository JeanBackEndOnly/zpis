import type { UnitSection, UnitSectionPayload } from '../../types/admin/organization';
import { createCrudService } from './crudService';

export const unitSectionService = createCrudService<UnitSection, UnitSectionPayload>('unit-sections');