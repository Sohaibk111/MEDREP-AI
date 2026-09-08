import {
  AnonymousPatientOpportunity, Doctor, DoctorPriorityAssessment, DoctorTimelineEvent, DoctorTiming,
  FieldIntelligenceEvidence, FollowupTask, NextBestAction, PreVisitIntelligence,
  PrescriberJourneyState, PrescriberLifecycleStatus, SampleTransaction, Visit, VisitOutcomeRecord, VisitObjection
} from '../types';
import { isValidISODate } from '../utils/dateUtils';
import { getPrescriberJourneyStage } from './routeEngine';

export function lifecycleForFieldIntelligence(doc: Doctor): PrescriberLifecycleStatus {
  if (doc.prescriberStatus === 'dormant') return 'DORMANT';
  if (doc.prescriberStatus === 'advocate' && doc.relationshipStrength >= 4) return 'CHAMPION';
  if (doc.prescriberStatus === 'active_prescriber') return 'ADOPTER';
  if (doc.prescriberStatus === 'trialing') return 'TRIAL';
  return doc.totalVisitsCount > 0 ? 'ENGAGED' : 'PROSPECT';
}

function weekday(date: string) { return new Date(`${date}T00:00:00Z`).getUTCDay(); }
function timeMinutes(value: string): number {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim());
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return hour * 60 + Number(match[2]);
}
function evidence(code: FieldIntelligenceEvidence['code'], label: string, points: number, source: FieldIntelligenceEvidence['source'], sourceIds: string[]): FieldIntelligenceEvidence {
  return { code, label, points, source, sourceIds, factual: true };
}
export function getCallingWindows(doc: Doctor, date: string): DoctorTiming[] {
  if (!isValidISODate(date)) return [];
  return (doc.timings || []).filter(t => t.dayOfWeek === weekday(date)).sort((a, b) => timeMinutes(a.startTime) - timeMinutes(b.startTime));
}
function activeOpportunities(opps: AnonymousPatientOpportunity[]) { return opps.filter(o => o.status !== 'declined'); }
function latest<T>(items: T[], stamp: (item: T) => string | undefined): T | undefined {
  return [...items].sort((a, b) => (stamp(b) || '').localeCompare(stamp(a) || ''))[0];
}

export interface FieldIntelligenceInput {
  doctors: Doctor[]; visits: Visit[]; followups: FollowupTask[]; opportunities: AnonymousPatientOpportunity[];
  outcomes?: VisitOutcomeRecord[]; samples?: SampleTransaction[]; targetDate: string;
}

export function assessDoctor(doc: Doctor, input: FieldIntelligenceInput): DoctorPriorityAssessment {
  const { visits, followups, opportunities, outcomes = [], targetDate } = input;
  const docVisits = visits.filter(v => v.doctorId === doc.id);
  const docTasks = followups.filter(f => f.doctorId === doc.id && f.status === 'pending');
  const docOpps = activeOpportunities(opportunities.filter(o => o.doctorId === doc.id));
  const docOutcomes = outcomes.filter(o => o.doctorId === doc.id);
  const scheduled = docVisits.find(v => v.scheduledDate === targetDate && v.status === 'in_progress') || docVisits.find(v => v.scheduledDate === targetDate && v.status === 'planned');
  const windows = getCallingWindows(doc, targetDate);
  const lifecycle = lifecycleForFieldIntelligence(doc);
  const journey = getPrescriberJourneyStage(doc, docVisits, docOpps);
  const reasons: FieldIntelligenceEvidence[] = [];
  const overdue = docTasks.filter(t => t.dueDate < targetDate);
  const dueToday = docTasks.filter(t => t.dueDate === targetDate);
  const recentOutcome = latest(docOutcomes, o => o.timestamp);
  const recentObjection = docVisits.flatMap(v => v.objections || []).find(o => !o.resolved) || docVisits.flatMap(v => v.objections || [])[0];
  let score = 0;
  if (scheduled?.status === 'in_progress') { score += 30; reasons.push(evidence('IN_PROGRESS_VISIT', 'Visit is currently in progress', 30, 'VISIT', [scheduled.id])); }
  else if (scheduled) { score += 20; reasons.push(evidence('SCHEDULED_VISIT', 'Visit is scheduled for this date', 20, 'VISIT', [scheduled.id])); }
  if (overdue.length) { score += 25; reasons.push(evidence('OVERDUE_FOLLOW_UP', `${overdue.length} follow-up task(s) overdue`, 25, 'FOLLOWUP', overdue.map(t => t.id))); }
  else if (dueToday.length) { score += 18; reasons.push(evidence('FOLLOW_UP_DUE_TODAY', `${dueToday.length} follow-up task(s) due today`, 18, 'FOLLOWUP', dueToday.map(t => t.id))); }
  const tierPoints = doc.priority === 'A' ? 16 : doc.priority === 'B' ? 10 : 5;
  score += tierPoints; reasons.push(evidence('HIGH_PRIORITY_TIER', `Priority Tier ${doc.priority}`, tierPoints, 'DOCTOR', [doc.id]));
  if (journey === 'TRIALING') { score += 18; reasons.push(evidence('TRIAL_ACTIVE', 'Active trial requires follow-up', 18, 'DOCTOR', [doc.id])); }
  else if (journey === 'ADOPTING' || journey === 'HIGH_PRESCRIBER') { score += 14; reasons.push(evidence('ADOPTER_GROWTH_OPPORTUNITY', 'Adopting prescriber has growth potential', 14, 'DOCTOR', [doc.id])); }
  else if (lifecycle === 'ENGAGED' || lifecycle === 'PROSPECT') score += 10;
  else if (lifecycle === 'DORMANT' && (docTasks.length || docOpps.length)) { score += 8; reasons.push(evidence('DORMANT_REACTIVATION', 'Dormant doctor has an actionable CRM signal', 8, 'DOCTOR', [doc.id])); }
  const potential = Math.round(Math.max(0, Math.min(100, doc.potentialScore || 0)) * .15);
  if (potential) { score += potential; reasons.push(evidence('HIGH_POTENTIAL', `Potential score ${doc.potentialScore}/100`, potential, 'DOCTOR', [doc.id])); }
  if (doc.relationshipStrength > 0) { score += Math.min(5, doc.relationshipStrength); reasons.push(evidence('HIGH_RELATIONSHIP_STRENGTH', `Relationship strength ${doc.relationshipStrength}/5`, Math.min(5, doc.relationshipStrength), 'DOCTOR', [doc.id])); }
  const oppPoints = Math.min(10, docOpps.length * 3);
  if (oppPoints) { score += oppPoints; reasons.push(evidence('OPEN_PATIENT_OPPORTUNITY', `${docOpps.length} active patient opportunity(s)`, oppPoints, 'OPPORTUNITY', docOpps.map(o => o.id))); }
  if (recentOutcome && ['CONVERTED', 'TRIAL_STARTED'].includes(recentOutcome.outcomeType)) { score += 8; reasons.push(evidence('RECENT_CONVERSION_SIGNAL', `Recent ${recentOutcome.outcomeType.replace('_', ' ').toLowerCase()}`, 8, 'OUTCOME', [recentOutcome.id])); }
  if (recentObjection) { score += 6; reasons.push(evidence('RECENT_OBJECTION', 'Recent objection needs preparation', 6, 'VISIT', docVisits.filter(v => (v.objections || []).includes(recentObjection)).map(v => v.id))); }
  if (windows.length) reasons.push(evidence(windows[0].source === 'field_verified' ? 'CALLING_WINDOW_AVAILABLE' : 'CALLING_WINDOW_UNVERIFIED', `Calling window ${windows[0].startTime}–${windows[0].endTime}`, 0, 'DOCTOR', [windows[0].id]));
  else reasons.push(evidence('NO_CALLING_WINDOW_TODAY', 'No recorded calling window for this date', 0, 'DOCTOR', [doc.id]));
  const eligibility = scheduled?.status === 'in_progress' ? 'IN_PROGRESS' : scheduled ? 'SCHEDULED' : (windows.length || overdue.length || dueToday.length) ? 'ELIGIBLE' : 'INELIGIBLE';
  const action = nextBestAction({ doc, targetDate, scheduled, overdue, dueToday, docOpps, journey, lifecycle, recentObjection, windows, reasons, recentOutcome });
  return { doctorId: doc.id, targetDate, eligibility, ineligibilityReasons: eligibility === 'INELIGIBLE' ? ['NO_CALLING_WINDOW_TODAY'] : [], score: Math.min(100, Math.max(0, score)), lifecycle, journey, reasons, nextBestAction: action };
}

function nextBestAction(ctx: any): NextBestAction {
  const base = { linkedOpportunityIds: ctx.docOpps.map((o: AnonymousPatientOpportunity) => o.id), evidence: ctx.reasons as FieldIntelligenceEvidence[] };
  if (ctx.scheduled?.status === 'in_progress') return { ...base, type: 'VISIT', objective: 'Complete the current consultation and log a factual outcome.', timing: 'TODAY', reasonCodes: ['IN_PROGRESS_VISIT'], linkedVisitId: ctx.scheduled.id };
  if (ctx.overdue.length || ctx.dueToday.length) { const task = ctx.overdue[0] || ctx.dueToday[0]; return { ...base, type: 'FOLLOW_UP', objective: `Complete follow-up: ${task.title}`, timing: 'TODAY', reasonCodes: [ctx.overdue.length ? 'OVERDUE_FOLLOW_UP' : 'FOLLOW_UP_DUE_TODAY'], linkedFollowupId: task.id }; }
  if (ctx.journey === 'TRIALING') return { ...base, type: 'TRIAL_FOLLOW_UP', objective: 'Review trial feedback and agree the next documented step.', timing: 'THIS_WEEK', reasonCodes: ['TRIAL_ACTIVE'] };
  if (ctx.recentObjection) return { ...base, type: 'OBJECTION_HANDLING', objective: 'Prepare a verified response to the documented objection.', timing: 'WHEN_WINDOW_AVAILABLE', reasonCodes: ['RECENT_OBJECTION'] };
  if (ctx.docOpps.length) return { ...base, type: 'CONVERSION_OPPORTUNITY', objective: 'Review active patient opportunities and agree the next appropriate step.', timing: 'WHEN_WINDOW_AVAILABLE', reasonCodes: ['OPEN_PATIENT_OPPORTUNITY'] };
  if (ctx.lifecycle === 'DORMANT' && !ctx.windows.length) return { ...base, type: 'NO_ACTION', objective: 'No actionable CRM signal or calling window is recorded.', timing: 'NO_ACTION', reasonCodes: ['NO_CALLING_WINDOW_TODAY'] };
  if (ctx.windows.length) return { ...base, type: ctx.lifecycle === 'DORMANT' ? 'REACTIVATION' : 'VISIT', objective: ctx.lifecycle === 'DORMANT' ? 'Re-establish contact around a documented need.' : 'Conduct discovery and document one need or objection.', timing: 'WHEN_WINDOW_AVAILABLE', reasonCodes: ['CALLING_WINDOW_AVAILABLE'] };
  return { ...base, type: 'NO_ACTION', objective: 'No actionable CRM signal or calling window is recorded.', timing: 'NO_ACTION', reasonCodes: ['NO_CALLING_WINDOW_TODAY'] };
}

export function buildFieldIntelligence(input: FieldIntelligenceInput) {
  if (!isValidISODate(input.targetDate)) throw new Error('Invalid target date');
  const assessments = input.doctors.map(d => assessDoctor(d, input));
  const eligible = assessments.filter(a => a.eligibility !== 'INELIGIBLE').sort((a, b) => b.score - a.score || a.doctorId.localeCompare(b.doctorId));
  eligible.forEach((a, index) => a.rank = index + 1);
  return { candidates: eligible, deferredCandidates: assessments.filter(a => a.eligibility === 'INELIGIBLE').sort((a, b) => a.doctorId.localeCompare(b.doctorId)), algorithmVersion: 'v1.3-deterministic-1' };
}

export function buildPreVisitIntelligence(doc: Doctor, input: FieldIntelligenceInput & { samples?: SampleTransaction[] }): PreVisitIntelligence {
  const priority = assessDoctor(doc, input);
  const docVisits = input.visits.filter(v => v.doctorId === doc.id);
  const previousVisit = latest(docVisits, v => v.scheduledDate);
  const windows = getCallingWindows(doc, input.targetDate);
  const outcomes = (input.outcomes || []).filter(o => o.doctorId === doc.id);
  const timeline: DoctorTimelineEvent[] = [...docVisits.map(v => ({ id: `visit-${v.id}`, type: 'VISIT' as const, occurredAt: `${v.scheduledDate}T00:00:00.000Z`, title: `Visit ${v.status}`, detail: v.summary, visitId: v.id })), ...outcomes.map(o => ({ id: `outcome-${o.id}`, type: 'OUTCOME' as const, occurredAt: o.timestamp, title: o.outcomeType, detail: o.notes, visitId: o.visitId }))].sort((a,b) => b.occurredAt.localeCompare(a.occurredAt));
  const objections: VisitObjection[] = docVisits.flatMap(v => v.objections || []).filter(o => !o.resolved);
  const dataGaps: PreVisitIntelligence['dataGaps'] = [];
  if (!previousVisit) dataGaps.push('NO_VISIT_HISTORY'); if (!windows.length) dataGaps.push('NO_WINDOW_TODAY'); else if (windows[0].source !== 'field_verified') dataGaps.push('UNVERIFIED_WINDOW');
  if (!input.followups.some(f => f.doctorId === doc.id && f.status === 'pending')) dataGaps.push('NO_OPEN_FOLLOWUP');
  return { doctor: doc, targetDate: input.targetDate, lifecycle: priority.lifecycle, journey: priority.journey, priority, currentCallingWindow: windows[0], lastInteraction: timeline[0], previousVisit, outstandingFollowups: input.followups.filter(f => f.doctorId === doc.id && f.status === 'pending'), unresolvedObjections: objections, recentSamples: (input.samples || []).filter(s => s.doctorId === doc.id).sort((a,b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0, 5), recentCommitments: outcomes.filter(o => (o.committedUnits || 0) > 0).slice(0, 5), openOpportunities: activeOpportunities(input.opportunities.filter(o => o.doctorId === doc.id)), recommendedObjective: priority.nextBestAction, dataGaps };
}
