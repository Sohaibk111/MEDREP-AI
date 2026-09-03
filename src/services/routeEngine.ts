function getTodayISO(): string {
  const configured = typeof process !== 'undefined' ? process.env.MEDREP_TODAY?.trim() : undefined;
  if (configured && /^\d{4}-\d{2}-\d{2}$/.test(configured)) return configured;
  return new Date().toISOString().slice(0, 10);
}

import {
  Doctor,
  Visit,
  FollowupTask,
  AnonymousPatientOpportunity,
  RouteStopIntelligence,
  RoutePlanResponse,
  RouteStopStatus,
  PrescriberJourneyState
} from '../types';

export function getPrescriberJourneyStage(
  doc: Doctor, 
  docVisits: Visit[] = [], 
  docOpps: AnonymousPatientOpportunity[] = []
): PrescriberJourneyState {
  const completedVisits = docVisits.filter(v => v.status === 'completed');
  const hasConvertedOutcome = docVisits.some(v => v.outcomes?.includes('CONVERTED') || v.outcomes?.includes('TRIAL_STARTED'));
  const totalUnits = docOpps.reduce((acc, curr) => acc + (curr.units || 1), 0);

  if (completedVisits.length >= 3 && totalUnits >= 5) {
    return 'HIGH_PRESCRIBER';
  }
  if (completedVisits.length >= 2 || totalUnits >= 2 || doc.prescriberStatus === 'active_prescriber') {
    return 'ADOPTING';
  }
  if (
    hasConvertedOutcome ||
    doc.prescriberStatus === 'trialing' ||
    docOpps.some(o => o.status === 'trial_scheduled' || o.status === 'sensor_installed')
  ) {
    return 'TRIALING';
  }
  return 'PROSPECTING';
}

export function getPrescriberJourneyActionRecommendation(stage: PrescriberJourneyState): string {
  switch (stage) {
    case 'PROSPECTING':
      return 'Schedule product introduction and identify primary objection.';
    case 'TRIALING':
      return 'Follow up on first patient trial and collect clinical/user feedback.';
    case 'ADOPTING':
      return 'Expand appropriate patient identification and encourage repeat prescribing.';
    case 'HIGH_PRESCRIBER':
      return 'Maintain relationship, monitor account activity, and identify growth opportunities.';
  }
}

export function generateRoutePlan(
  doctors: Doctor[],
  visits: Visit[],
  followups: FollowupTask[],
  opportunities: AnonymousPatientOpportunity[],
  targetDate: string = getTodayISO()
): RoutePlanResponse {
  // Filter visits for targetDate or fallback to all planned/in_progress/completed visits for current day
  const dayVisits = visits.filter(v => v.scheduledDate === targetDate);
  const relevantVisits = dayVisits.length > 0 ? dayVisits : visits.slice(0, 5);

  const stops: RouteStopIntelligence[] = relevantVisits.map((visit) => {
    const doc = doctors.find(d => d.id === visit.doctorId);
    const docVisits = visits.filter(v => v.doctorId === visit.doctorId);
    const docOpps = opportunities.filter(o => o.doctorId === visit.doctorId);
    const docTasks = followups.filter(f => f.doctorId === visit.doctorId && f.status === 'pending');

    const journeyStage = doc ? getPrescriberJourneyStage(doc, docVisits, docOpps) : 'PROSPECTING';
    const hasOverdueFollowup = docTasks.some(t => t.dueDate <= targetDate);

    // Deterministic Priority Score (0 - 100)
    let priorityScore = 0;
    const reasons: string[] = [];

    // 1. Doctor Tier
    if (doc?.priority === 'A') {
      priorityScore += 35;
      reasons.push('Priority Tier A HCP');
    } else if (doc?.priority === 'B') {
      priorityScore += 20;
      reasons.push('Priority Tier B HCP');
    } else {
      priorityScore += 10;
      reasons.push('Priority Tier C HCP');
    }

    // 2. Prescriber Stage
    if (journeyStage === 'TRIALING') {
      priorityScore += 25;
      reasons.push('Active Patient Trial in progress');
    } else if (journeyStage === 'ADOPTING' || journeyStage === 'HIGH_PRESCRIBER') {
      priorityScore += 20;
      reasons.push('High-value Adopting Prescriber');
    } else {
      priorityScore += 10;
      reasons.push('Key Prospect');
    }

    // 3. Overdue / Due Follow-ups
    if (hasOverdueFollowup) {
      priorityScore += 20;
      reasons.push('Follow-up task due today');
    }

    // 4. Open patient opportunities
    if (docOpps.length > 0) {
      priorityScore += 15;
      reasons.push(`${docOpps.length} open patient pipeline opportunities`);
    }

    // Determine Route Stop Status
    let status: RouteStopStatus = 'UPCOMING';
    if (visit.status === 'completed') {
      status = 'COMPLETED';
    } else if (visit.status === 'in_progress') {
      status = 'IN_PROGRESS';
    }

    // Find OPD Timing slot
    const timing = doc?.timings?.[0];
    const consultationWindow = timing ? `${timing.startTime} - ${timing.endTime}` : '11:00 AM - 02:00 PM';

    return {
      stopOrder: 1, // will re-index after sorting
      visitId: visit.id,
      doctorId: visit.doctorId,
      doctorName: visit.doctorName || doc?.name || 'Doctor',
      specialty: visit.doctorSpecialty || doc?.specialty || 'Specialist',
      hospitalClinic: visit.hospitalClinic || doc?.clinic || doc?.hospital || 'Clinic',
      area: visit.area || doc?.area || 'Territory Area',
      consultationWindow,
      plannedTime: visit.scheduledTime || '11:30 AM',
      priorityTier: (doc?.priority || 'B') as any,
      prescriberJourney: journeyStage,
      status,
      priorityScore: Math.min(100, priorityScore),
      priorityReason: reasons.join(' • '),
      openOpportunitiesCount: docOpps.length,
      hasOverdueFollowup,
      recommendedFocus: getPrescriberJourneyActionRecommendation(journeyStage)
    };
  });

  // Sort order:
  // 1. IN_PROGRESS stops first
  // 2. UPCOMING stops sorted by priorityScore descending
  // 3. COMPLETED stops last
  stops.sort((a, b) => {
    if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
    if (b.status === 'IN_PROGRESS' && a.status !== 'IN_PROGRESS') return 1;
    if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
    if (b.status === 'COMPLETED' && a.status !== 'COMPLETED') return -1;
    return b.priorityScore - a.priorityScore;
  });

  // Assign sequential stop order numbers
  stops.forEach((s, idx) => {
    s.stopOrder = idx + 1;
  });

  const completedStops = stops.filter(s => s.status === 'COMPLETED').length;
  const pendingStops = stops.filter(s => s.status !== 'COMPLETED').length;

  return {
    date: targetDate,
    targetTerritory: 'Rawalpindi-East & Islamabad Prime Cluster',
    totalStops: stops.length,
    completedStops,
    pendingStops,
    stops,
    routeSummaryReasoning: `Prioritized ${stops.length} stops based on doctor priority tier, active trial monitoring requirements, and scheduled OPD windows.`
  };
}
