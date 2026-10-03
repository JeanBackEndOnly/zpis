export type PersonnelFileType =
  | 'communication'
  | 'certification'
  | 'training_certificates'
  | 'license_eligibility'
  | 'academic_credentials'
  | 'prescreening_requirements'
  | 'medical_certificate';

export interface PersonnelFile {
  id: number;
  employee_id: number;
  file_name: string;
  file_type: PersonnelFileType;
  extension: string; // "pdf", "jpg", ...
  created_at: string;
  updated_at: string;
}

interface PersonnelUser {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  email: string;
}

// One row of GET /admin/personnel-201-files
export interface PersonnelEmployee {
  id: number; // employee_information id
  user_id: number;
  employment_id: string;
  personnel_files_count: number;
  user?: PersonnelUser | null;
  department?: { id: number; department_name: string } | null;
  unit_section?: { id: number; unit_section_name: string } | null;
  position?: { id: number; position_title: string } | null;
}

// GET /admin/personnel-201-files/employee/{id}
export interface PersonnelEmployeeFiles {
  employee: PersonnelEmployee;
  files: PersonnelFile[];
}