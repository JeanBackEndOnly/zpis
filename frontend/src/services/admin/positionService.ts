import type { Position, PositionPayload } from '../../types/admin/organization';
import { createCrudService } from './crudService';

export const positionService = createCrudService<Position, PositionPayload>('positions');