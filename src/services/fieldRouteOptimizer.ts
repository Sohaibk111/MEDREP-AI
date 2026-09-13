import { Doctor, DoctorTiming, Visit } from '../types';
import { rankFieldCandidates, DoctorFieldCandidate } from './doctorMasterIntelligence';

export interface OptimizedRouteStop {
  sequence: number;
  doctorId: string;
  doctorName: string;
  facility: string;
  area: string;
  city: string;
  plannedTime?: string;
  timing?: DoctorTiming;
  priority: Doctor['priority'];
  score: number;
  reasons: string[];
  locked: boolean;
}

export interface OptimizedFieldRoute {
  date: string;
  stops: OptimizedRouteStop[];
  lockedVisitCount: number;
  recommendedCount: number;
  limitations: string[];
}

function minutes(time: string): number {
  const m = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 9999;
  let hour = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') hour += 12;
  return hour * 60 + Number(m[2]);
}

function timeForVisit(visit: Visit): number {
  return minutes(visit.scheduledTime || '11:59 PM');
}

export function optimizeFieldRoute(
  doctors: Doctor[],
  visits: Visit[],
  targetDate: string,
  maxStops = 8
): OptimizedFieldRoute {
  const limit = Math.max(1, Math.min(12, maxStops));
  const scheduled = visits
    .filter(v => v.scheduledDate === targetDate && ['planned', 'in_progress'].includes(v.status))
    .sort((a, b) => timeForVisit(a) - timeForVisit(b));

  const lockedIds = new Set(scheduled.map(v => v.doctorId));
  const candidates = rankFieldCandidates(doctors, targetDate, [...lockedIds]);
  const capacity = Math.max(0, limit - scheduled.length);

  const lockedStops: OptimizedRouteStop[] = scheduled.map((visit, index) => {
    const doctor = doctors.find(d => d.id === visit.doctorId);
    const timing = doctor?.timings.find(t => t.dayOfWeek === new Date(`${targetDate}T12:00:00`).getDay());
    return {
      sequence: index + 1,
      doctorId: visit.doctorId,
      doctorName: visit.doctorName,
      facility: visit.hospitalClinic,
      area: visit.area,
      city: doctor?.city || '',
      plannedTime: visit.scheduledTime,
      timing,
      priority: doctor?.priority || 'C',
      score: doctor ? rankFieldCandidates([doctor], targetDate)[0]?.score || 0 : 0,
      reasons: ['Scheduled CRM visit — immutable during optimization'],
      locked: true
    };
  });

  const recommended = candidates.slice(0, capacity).map((candidate: DoctorFieldCandidate, index) => ({
    sequence: lockedStops.length + index + 1,
    doctorId: candidate.doctor.id,
    doctorName: candidate.doctor.name,
    facility: candidate.facility,
    area: candidate.area,
    city: candidate.doctor.city,
    plannedTime: candidate.timing?.startTime,
    timing: candidate.timing,
    priority: candidate.doctor.priority,
    score: candidate.score,
    reasons: candidate.reasons,
    locked: false
  }));

  return {
    date: targetDate,
    stops: [...lockedStops, ...recommended],
    lockedVisitCount: lockedStops.length,
    recommendedCount: recommended.length,
    limitations: [
      'No coordinate/travel-time matrix is used in this deterministic v1.6.3 optimizer.',
      'Scheduled CRM visits are locked and never displaced by recommendations.',
      'Facility, area, priority, CGM potential, relationship status and verified calling windows drive ranking.'
    ]
  };
}
