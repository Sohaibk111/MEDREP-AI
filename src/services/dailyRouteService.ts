import { DailyRoutePlan, Doctor, FollowupTask, RouteStopIntelligence, SampleTransaction, Visit, VisitOutcomeRecord, WeeklyFieldPlan, AnonymousPatientOpportunity } from '../types';
import { FieldIntelligenceInput, buildFieldIntelligence, getCallingWindows } from './fieldIntelligenceService';
import { generateRoutePlan } from './routeEngine';

export function buildDailyRoutePlan(input: FieldIntelligenceInput & { fieldPlan: WeeklyFieldPlan; samples?: SampleTransaction[]; maxStops?: number }): DailyRoutePlan {
  const maxStops = Math.min(12, Math.max(1, input.maxStops || 8));
  const route = generateRoutePlan(input.doctors, input.visits, input.followups, input.opportunities, input.targetDate);
  const scheduledVisits = input.visits.filter(v => v.scheduledDate === input.targetDate && ['planned', 'in_progress'].includes(v.status));
  const immutableScheduledStops: RouteStopIntelligence[] = route.stops.filter(s => scheduledVisits.some(v => v.id === s.visitId));
  const intelligence = buildFieldIntelligence(input);
  const scheduledIds = new Set(scheduledVisits.map(v => v.doctorId));
  const days = Array.isArray(input.fieldPlan.days) ? input.fieldPlan.days : Object.values(input.fieldPlan.days || {});
  const day: any = (days as any[]).find(d => d.date === input.targetDate);
  const clusterFor = (doctor: Doctor) => day?.stops?.find((s: any) => s.doctorId === doctor.id)?.areaCluster || day?.areaCluster || doctor.area;
  const available = intelligence.candidates.filter(a => !scheduledIds.has(a.doctorId) && a.eligibility === 'ELIGIBLE').slice(0, Math.max(0, maxStops - immutableScheduledStops.length));
  const recommendedStops = available.map(a => {
    const doctor = input.doctors.find(d => d.id === a.doctorId)!;
    const window = getCallingWindows(doctor, input.targetDate)[0];
    return { ...a, routeSequence: 0, areaClusterKey: clusterFor(doctor), callingWindow: window && { startTime: window.startTime, endTime: window.endTime, locationName: window.locationName } };
  });
  recommendedStops.forEach((stop, index) => stop.routeSequence = immutableScheduledStops.length + index + 1);
  return {
    date: input.targetDate,
    method: 'SCHEDULE_AND_AREA_CLUSTERING',
    geographyStatus: 'AREA_ONLY_NO_COORDINATES',
    immutableScheduledStops,
    recommendedStops,
    deferredCandidates: intelligence.deferredCandidates,
    routeReasoning: ['Scheduled visits remain fixed.', 'Additional doctors are ranked from CRM facts and date-aware calling windows.', 'Recommended stops retain deterministic field-intelligence order; area labels are descriptive only.'],
    limitations: ['No verified geographic coordinates, travel-time matrix, distance, or traffic data is available. Area labels and calling windows only are used.']
  };
}
