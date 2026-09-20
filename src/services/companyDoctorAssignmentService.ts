import { Doctor, DoctorTiming } from '../types';
import {
  COMPANY_DOCTOR_ASSIGNMENTS,
  CompanyDoctorAssignment,
  isOutstationAssignment,
  isTwinCityAssignment
} from '../data/companyDoctorAssignments';
import { rankDoctorForFieldCall } from './doctorMasterIntelligence';

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
      const haystack = [
        doctor.companyDoctorId,
        doctor.name,
        doctor.specialty,
        doctor.city,
        doctor.locality,
        doctor.locationName
      ].map(normalize).join(' ');
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

export function reconcileCompanyAssignmentToCRM<T extends {
  id: string;
  doctorId?: string;
  companyCode?: string;
}>(assignment: CompanyDoctorAssignment, doctors: T[]): T | undefined {
  return doctors.find(
    (doctor) =>
      doctor.companyCode === assignment.companyDoctorId ||
      doctor.doctorId === assignment.companyDoctorId
  );
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
      const score =
        (assignment.class === 'A' ? 30 : 20) +
        (isTwinCityAssignment(assignment) ? 10 : 0) +
        specialtyScore(assignment.specialty) +
        (crmRank?.score ?? 0);

      const reasons = [
        `${assignment.class}-class company assignment`,
        `${assignment.specialty} specialty relevance`,
        isTwinCityAssignment(assignment) ? 'Twin Cities territory' : 'Outstation assignment'
      ];

      if (crmRank?.timing) {
        reasons.push(
          `Verified CRM calling window: ${crmRank.timing.startTime}-${crmRank.timing.endTime}`
        );
      } else {
        reasons.push('No verified CRM timing linked to this company assignment');
      }

      if (crmDoctor) reasons.push('Explicit company-to-CRM identity match');

      return {
        assignment,
        crmDoctorId: crmDoctor?.id,
        crmLinked: Boolean(crmDoctor),
        timing: crmRank?.timing,
        score,
        reasons
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.assignment.locality.localeCompare(b.assignment.locality) ||
        a.assignment.name.localeCompare(b.assignment.name)
    )
    .slice(0, limit);
}

export function registerCompanyAssignmentRoutes(app: any, doctors: Doctor[]): void {
  if (app.__medrepCompanyAssignmentRoutesRegistered) return;
  app.__medrepCompanyAssignmentRoutesRegistered = true;

  app.get('/api/v1/company/doctor-assignments', (req: any, res: any) => {
    const { search, city, locality, specialty, class: doctorClass, outstation } = req.query;
    const parsedOutstation =
      typeof outstation === 'string' && outstation !== 'all'
        ? outstation.toLowerCase() === 'true'
        : undefined;

    const data = listCompanyDoctorAssignments({
      search: typeof search === 'string' ? search : undefined,
      city: typeof city === 'string' && city !== 'all' ? city : undefined,
      locality: typeof locality === 'string' && locality !== 'all' ? locality : undefined,
      specialty: typeof specialty === 'string' && specialty !== 'all' ? specialty : undefined,
      class: doctorClass === 'A' || doctorClass === 'B' ? doctorClass : undefined,
      outstation: parsedOutstation
    });

    res.json({
      success: true,
      data,
      count: data.length,
      source: 'COMPANY_WORKBOOK',
      assignmentSummary: summarizeCompanyDoctorAssignments()
    });
  });

  app.get('/api/v1/company/doctor-assignments/:companyDoctorId', (req: any, res: any) => {
    const assignment = getCompanyDoctorAssignment(req.params.companyDoctorId);
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, error: 'Company doctor assignment not found' });
    }

    const crmDoctor = reconcileCompanyAssignmentToCRM(assignment, doctors);
    const linkedTiming = crmDoctor ? rankDoctorForFieldCall(crmDoctor, new Date().toISOString().slice(0, 10))?.timing : undefined;

    return res.json({
      success: true,
      data: {
        ...assignment,
        crmLinked: Boolean(crmDoctor),
        crmDoctorId: crmDoctor?.id,
        timingStatus: linkedTiming ? 'VERIFIED_CRM' : 'UNKNOWN',
        timingSource: linkedTiming ? [linkedTiming.source] : []
      }
    });
  });

  app.get('/api/v1/company/doctor-summary', (_req: any, res: any) => {
    res.json({
      success: true,
      data: summarizeCompanyDoctorAssignments(),
      crmLinkedCount: COMPANY_DOCTOR_ASSIGNMENTS.filter((assignment) =>
        Boolean(reconcileCompanyAssignmentToCRM(assignment, doctors))
      ).length
    });
  });

  app.get('/api/v1/company/field-route-candidates', (req: any, res: any) => {
    const targetDate =
      typeof req.query.date === 'string'
        ? req.query.date
        : new Date().toISOString().slice(0, 10);
    const maxStopsRaw =
      typeof req.query.maxStops === 'string' ? Number(req.query.maxStops) : 8;
    const maxStops = Number.isFinite(maxStopsRaw) ? maxStopsRaw : 8;
    const outstation =
      typeof req.query.outstation === 'string' && req.query.outstation !== 'all'
        ? req.query.outstation.toLowerCase() === 'true'
        : undefined;

    const candidates = rankCompanyFieldCandidates(
      doctors,
      targetDate,
      {
        city:
          typeof req.query.city === 'string' && req.query.city !== 'all'
            ? req.query.city
            : undefined,
        locality:
          typeof req.query.locality === 'string' && req.query.locality !== 'all'
            ? req.query.locality
            : undefined,
        specialty:
          typeof req.query.specialty === 'string' && req.query.specialty !== 'all'
            ? req.query.specialty
            : undefined,
        class: req.query.class === 'A' || req.query.class === 'B' ? req.query.class : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        outstation
      },
      maxStops
    );

    res.json({
      success: true,
      data: candidates,
      count: candidates.length,
      date: targetDate,
      limitations: [
        'Company assignments are not converted into CRM doctors automatically.',
        'No calling window is fabricated for an unlinked company assignment.',
        'This endpoint ranks field candidates; it does not infer geographic travel time or traffic.'
      ]
    });
  });
}
