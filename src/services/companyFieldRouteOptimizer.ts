import { CompanyDoctorAssignment } from '../data/companyDoctorAssignments';

export type CompanyRouteStop = {
  companyDoctorId: string;
  name: string;
  specialty: string;
  city: string;
  locality: string;
  locationName: string;
  class: 'A' | 'B';
  reason: string;
};

export type CompanyFieldRoute = {
  date: string;
  stops: CompanyRouteStop[];
  recommendedCount: number;
  lockedVisitCount: number;
  limitations: string[];
};

export function optimizeCompanyFieldRoute(
  assignments: readonly CompanyDoctorAssignment[],
  date: string,
  maxStops = 8
): CompanyFieldRoute {
  const limit = Math.max(1, Math.min(12, Number.isFinite(maxStops) ? maxStops : 8));
  const ranked = [...assignments].sort((a, b) =>
    (a.class === 'A' ? 0 : 1) - (b.class === 'A' ? 0 : 1) ||
    a.locality.localeCompare(b.locality) ||
    a.name.localeCompare(b.name)
  );
  const stops = ranked.slice(0, limit).map((assignment) => ({
    companyDoctorId: assignment.companyDoctorId,
    name: assignment.name,
    specialty: assignment.specialty,
    city: assignment.city,
    locality: assignment.locality,
    locationName: assignment.locationName,
    class: assignment.class,
    reason: assignment.class === 'A' ? 'A-class company assignment' : 'B-class company assignment'
  }));
  return {
    date,
    stops,
    recommendedCount: stops.length,
    lockedVisitCount: 0,
    limitations: [
      'Company assignments are not automatically converted into CRM doctors.',
      'No calling time, traffic, distance, or travel duration is inferred.',
      'Only explicit company-assignment facts are used for this route.'
    ]
  };
}
