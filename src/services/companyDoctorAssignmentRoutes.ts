import { Doctor } from '../types';
import { registerCompanyAssignmentRoutes } from './companyDoctorAssignmentService';

export function registerCompanyDoctorAssignmentRoutes(app: any, doctors: Doctor[]): void {
  registerCompanyAssignmentRoutes(app, doctors);
}
