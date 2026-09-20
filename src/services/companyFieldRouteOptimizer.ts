import { CompanyDoctorAssignment, isTwinCityAssignment } from '../data/companyDoctorAssignments';

export type CompanyRouteStop = {
  companyDoctorId: string;
  name: string;
  specialty: string;
  city: string;
  locality: string;
  locationName: string;
  class: 'A' | 'B';
  stopType: 'recommended';
};

export type CompanyFieldRoute = {
  date: string;
  stops: CompanyRouteStop[];
  recommendedCount: number;
  lockedVisitCount: number;
  limitations: string[];
};

function localityRank(locality: string): number {
  const value = locality.trim().toLowerCase();
  const ranks: Record<string, number> = {
    'saidpur road': 50,
    'commercial market': 45,
    'i-10': 40,
    'h-8': 35,
    'i-11': 30
  };
  return ranks[value] ?? 10;
}

export function optimizeCompanyFieldRoute(
  assignments: CompanyDoctorAssignment[],
  date: string,
  maxStops = 8
): CompanyFieldRoute {
  const limit = Math.max(1, Math.min(12, Math.floor(maxStops)));
  const stops = [...assignments]
    .sort((a, b) =>
      (b.class === 'A' ? 30 : 20) - (a.class === 'A' ? 30 : 20) ||
      (isTwinCityAssignment(b) ? 10 : 0) - (isTwinCityAssignment(a) ? 10 : 0) ||
      localityRank(b.locality) - localityRank(a.locality) ||
      a.locality.localeCompare(b.locality) ||
      a.name.localeCompare(b.name)
    )
    .slice(0, limit)
    .map<CompanyRouteStop>((assignment) => ({
      companyDoctorId: assignment.companyDoctorId,
      name: assignment.name,
      specialty: assignment.specialty,
      city: assignment.city,
      locality: assignment.locality,
      locationName: assignment.locationName,
      class: assignment.class,
      stopType: 'recommended'
    }));

  return {
    date,
    stops,
    recommendedCount: stops.length,
    lockedVisitCount: 0,
    limitations: [
      'Company assignment records remain separate from CRM doctor records unless an explicit identity match exists.',
      'No calling window or travel time is fabricated by this optimizer.',
      'maxStops limits recommendations; this function does not lock scheduled CRM visits.'
    ]
  };
}
