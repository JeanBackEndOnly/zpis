import type { PersonnelFileType } from '../types/admin/personnel';

export const personnelFileTypeLabels: Record<PersonnelFileType, string> = {
  communication: 'Communication',
  certification: 'Certification',
  training_certificates: 'Training Certificates',
  license_eligibility: 'License / Eligibility',
  academic_credentials: 'Academic Credentials',
  prescreening_requirements: 'Pre-screening Requirements',
  medical_certificate: 'Medical Certificate',
};

export const personnelFileTypes = Object.keys(personnelFileTypeLabels) as PersonnelFileType[];

// Files the browser can show in a tab; everything else is downloaded
export const canPreview = (extension: string) => ['pdf', 'jpg', 'jpeg', 'png'].includes(extension);