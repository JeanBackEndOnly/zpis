export interface Department {
  id: number;
  department_name: string;
  department_code: string;
}

export interface UnitSection {
  id: number;
  department_id: number;
  unit_section_name: string;
  unit_section_code: string;
  department?: Department;
}

export interface Position {
  id: number;
  department_id: number;
  position_title: string;
  department?: Department;
}

export type DepartmentPayload = Omit<Department, 'id'>;
export type UnitSectionPayload = Omit<UnitSection, 'id' | 'department'>;
export type PositionPayload = Omit<Position, 'id' | 'department'>;