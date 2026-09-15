import { Doctor, DoctorTiming } from '../types';
import { rankDoctorForFieldCall } from './doctorMasterIntelligence';
import {
  COMPANY_DOCTOR_ASSIGNMENTS,
  CompanyDoctorAssignment,
  isOutstationAssignment,
  isTwinCityAssignment
} from '../data/companyDoctorAssignments';

export type CompanyAssignmentFilters = {
  city?: string;
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
    if (filters.city && normalize(doctor.city) !== normalize(filters.city)) return false;
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
  return { total: COMPANY_DOCTOR_ASSIGNMENTS.length, assignedMso: 'Sohaib', twinCities: local.length, outstation: outstation.length, byCity, byLocality };
}

/**
 * Safe reconciliation helper. It only reconciles an assignment to a CRM Doctor
 * when the CRM record explicitly carries the same companyCode/doctorId.
 * Names, facilities, or specialties alone are never treated as identity keys.
 */
export function reconcileCompanyAssignmentToCRM<T extends { id: string; doctorId?: string; companyCode?: string }>(assignment: CompanyDoctorAssignment, doctors: T[]): T | undefined {
  return doctors.find((doctor) => doctor.companyCode === assignment.companyDoctorId || doctor.doctorId === assignment.companyDoctorId);
}

export type CompanyFieldCandidate = {
  assignment: CompanyDoctorAssignment;
  crmDoctorId?: string;
  crmLinked: boolean;
  timing?: DoctorTiming;
  score: number;
  reasons: string[];
};

function specialtyScore(specialty: string): number {
  const value = normalize(specialty);
  if (value.includes('endocrin')) return 25;
  if (value.includes('diabet')) return 25;
  if (value.includes('medicine')) return 20;
  if (value.includes('cardio')) return 15;
  if (value.includes('nephro')) return 15;
  if (value.includes('gastero') || value.includes('gastro')) return 10;
  return 5;
}

export function rankCompanyFieldCandidates(
  doctors: Doctor[],
  targetDate: string,
  filters: CompanyAssignmentFilters = {},
  maxStops = 8
): CompanyFieldCandidate[] {
  const limit = Math.max(1, Math.min(12, maxStops));
  return listCompanyDoctorAssignments(filters)
    .map((assignment) => {
      const crmDoctor = reconcileCompanyAssignmentToCRM(assignment, doctors);
      const crmRank = crmDoctor ? rankDoctorForFieldCall(crmDoctor, targetDate) : undefined;
      const score = (assignment.class === 'A' ? 30 : 20)
        + (isTwinCityAssignment(assignment) ? 10 : 0)
        + specialtyScore(assignment.specialty)
        + (crmRank?.score || 0);
      const reasons = [
        `${assignment.class}-class company assignment`,
        `${assignment.specialty} specialty relevance`,
        isTwinCityAssignment(assignment) ? 'Twin Cities territory' : 'Outstation assignment'
      ];
      if (crmRank?.timing) reasons.push(`Verified CRM calling window: ${crmRank.timing.startTime}-${crmRank.timing.endTime}`);
      else reasons.push('No verified CRM timing linked to this company assignment');
      if (crmDoctor) reasons.push('Explicit company-to-CRM identity match');
      return { assignment, crmDoctorId: crmDoctor?.id, crmLinked: !!crmDoctor, timing: crmRank?.timing, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.assignment.locality.localeCompare(b.assignment.locality) || a.assignment.name.localeCompare(b.assignment.name))
    .slice(0, limit);
}
