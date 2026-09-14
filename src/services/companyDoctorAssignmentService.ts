import {
  COMPANY_DOCTOR_ASSIGNMENTS,
  CompanyDoctorAssignment,
  isOutstationAssignment,
  isTwinCityAssignment
} from '../data/companyDoctorAssignments';

export type CompanyAssignmentFilters = {
  city?: CompanyDoctorAssignment['city'];
  locality?: string;
  specialty?: string;
  class?: CompanyDoctorAssignment['class'];
  outstation?: boolean;
  search?: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

export function listCompanyDoctorAssignments(filters: CompanyAssignmentFilters = {}): CompanyDoctorAssignment[] {
  const search = filters.search ? normalize(filters.search) : undefined;
  return COMPANY_DOCTOR_ASSIGNMENTS.filter((doctor) => {
    if (filters.city && doctor.city !== filters.city) return false;
    if (filters.locality && normalize(doctor.locality) !== normalize(filters.locality)) return false;
    if (filters.specialty && normalize(doctor.specialty) !== normalize(filters.specialty)) return false;
    if (filters.class && doctor.class !== filters.class) return false;
    if (filters.outstation !== undefined && isOutstationAssignment(doctor) !== filters.outstation) return false;
    if (search) {
      const haystack = [doctor.companyDoctorId, doctor.name, doctor.specialty, doctor.city, doctor.locality, doctor.locationName].map(normalize).join(' ');
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function getCompanyDoctorAssignment(companyDoctorId: string): CompanyDoctorAssignment | undefined {
  return COMPANY_DOCTOR_ASSIGNMENTS.find((doctor) => doctor.companyDoctorId === companyDoctorId);
}

export function summarizeCompanyDoctorAssignments() {
  const local = COMPANY_DOCTOR_ASSIGNMENTS.filter(isTwinCityAssignment);
  const outstation = COMPANY_DOCTOR_ASSIGNMENTS.filter(isOutstationAssignment);
  const byCity = COMPANY_DOCTOR_ASSIGNMENTS.reduce<Record<string, number>>((acc, doctor) => {
    acc[doctor.city] = (acc[doctor.city] ?? 0) + 1;
    return acc;
  }, {});
  const byLocality = COMPANY_DOCTOR_ASSIGNMENTS.reduce<Record<string, number>>((acc, doctor) => {
    acc[doctor.locality] = (acc[doctor.locality] ?? 0) + 1;
    return acc;
  }, {});
  return {
    total: COMPANY_DOCTOR_ASSIGNMENTS.length,
    assignedMso: 'Sohaib',
    twinCities: local.length,
    outstation: outstation.length,
    byCity,
    byLocality
  };
}

/**
 * Safe reconciliation helper. It only reconciles an assignment to a CRM Doctor
 * when the CRM record explicitly carries the same companyCode/doctorId.
 * Names, facilities, or specialties alone are never treated as identity keys.
 */
export function reconcileCompanyAssignmentToCRM<T extends { id: string; doctorId?: string; companyCode?: string }>(
  assignment: CompanyDoctorAssignment,
  doctors: T[]
): T | undefined {
  return doctors.find((doctor) =>
    doctor.companyCode === assignment.companyDoctorId || doctor.doctorId === assignment.companyDoctorId
  );
}
