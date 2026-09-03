import {
  Doctor,
  Visit,
  FollowupTask,
  AnonymousPatientOpportunity,
  DayEndSummaryReport,
  DayEndSummaryMetrics,
  VisitOutcomeType,
  VisitOutcomeRecord
} from '../types';

export function generateDayEndSummary(
  targetDate: string,
  doctors: Doctor[] = [],
  visits: Visit[] = [],
  followups: FollowupTask[] = [],
  opportunities: AnonymousPatientOpportunity[] = [],
  outcomeRecords: VisitOutcomeRecord[] = []
): DayEndSummaryReport {
  const safeVisits = visits || [];
  const safeFollowups = followups || [];
  const safeOpportunities = opportunities || [];
  const safeOutcomes = outcomeRecords || [];

  const dayVisits = safeVisits.filter(v => v.scheduledDate === targetDate);
  const completedVisitsList = dayVisits.filter(v => v.status === 'completed');
  const pendingVisitsList = dayVisits.filter(v => v.status !== 'completed');

  // Filter outcome records for targetDate
  const dayOutcomes = safeOutcomes.filter(o => o.timestamp && o.timestamp.startsWith(targetDate));

  // Also inspect visit outcome strings and records
  let samplesCount = 0;
  let trialsCount = 0;
  let followupsCount = 0;
  let cmeCount = 0;
  let convertedCount = 0;

  const outcomesBreakdown: Record<VisitOutcomeType, number> = {
    LOGGED: 0,
    SAMPLE_PROVIDED: 0,
    TRIAL_STARTED: 0,
    FOLLOW_UP_SCHEDULED: 0,
    CME_INVITED: 0,
    NO_INTEREST: 0,
    COMPETITOR_PREFERENCE: 0,
    PRICE_OBJECTION: 0,
    CLINICAL_OBJECTION: 0,
    CONVERTED: 0,
    OTHER: 0
  };

  // Aggregate from outcome records
  dayOutcomes.forEach(rec => {
    if (outcomesBreakdown[rec.outcomeType] !== undefined) {
      outcomesBreakdown[rec.outcomeType] += 1;
    }
    if (rec.outcomeType === 'SAMPLE_PROVIDED') samplesCount += (rec.samplesCount || 1);
    if (rec.outcomeType === 'TRIAL_STARTED') trialsCount += 1;
    if (rec.outcomeType === 'FOLLOW_UP_SCHEDULED') followupsCount += 1;
    if (rec.outcomeType === 'CME_INVITED') cmeCount += 1;
    if (rec.outcomeType === 'CONVERTED') convertedCount += 1;
  });

  // Also check completed visits for legacy or direct outcomes array
  completedVisitsList.forEach(v => {
    if (v.outcomes && v.outcomes.length > 0) {
      v.outcomes.forEach(outStr => {
        const outType = outStr as VisitOutcomeType;
        if (outcomesBreakdown[outType] !== undefined && dayOutcomes.every(o => o.visitId !== v.id)) {
          outcomesBreakdown[outType] += 1;
          if (outType === 'SAMPLE_PROVIDED') samplesCount += 1;
          if (outType === 'TRIAL_STARTED') trialsCount += 1;
          if (outType === 'FOLLOW_UP_SCHEDULED') followupsCount += 1;
          if (outType === 'CME_INVITED') cmeCount += 1;
          if (outType === 'CONVERTED') convertedCount += 1;
        }
      });
    }
  });

  // Filter opportunities created today
  const dayOpps = safeOpportunities.filter(o => o.createdAt === targetDate || o.updatedAt === targetDate);
  const committedUnits = dayOpps.reduce((acc, curr) => acc + (curr.units || 1), 0);
  const pipelineValue = dayOpps.reduce((acc, curr) => acc + (curr.estimatedValuePKR || (curr.units || 1) * 12900), 0);

  // Notable objections recorded today
  const notableObjections: { doctorId: string; doctorName: string; category: string; detail: string; responseGiven?: string }[] = [];
  dayVisits.forEach(v => {
    if (v.objections && v.objections.length > 0) {
      v.objections.forEach(obj => {
        notableObjections.push({
          doctorId: v.doctorId,
          doctorName: v.doctorName,
          category: obj.category,
          detail: obj.detail,
          responseGiven: obj.responseGiven
        });
      });
    }
  });

  // Outstanding follow-up tasks due today or pending
  const outstandingFollowups = safeFollowups
    .filter(f => f.status === 'pending')
    .slice(0, 5)
    .map(f => ({
      taskId: f.id,
      doctorId: f.doctorId,
      doctorName: f.doctorName,
      title: f.title,
      dueDate: f.dueDate,
      priority: f.priority
    }));

  const metrics: DayEndSummaryMetrics = {
    targetDate,
    totalPlannedVisits: dayVisits.length,
    completedVisits: completedVisitsList.length,
    pendingVisits: pendingVisitsList.length,
    samplesProvided: samplesCount,
    trialsStarted: trialsCount,
    followUpsScheduled: followupsCount,
    cmeInvitations: cmeCount,
    convertedVisits: convertedCount,
    newOpportunitiesCount: dayOpps.length,
    totalCommittedUnits: committedUnits,
    totalPipelineValuePKR: pipelineValue
  };

  const completedVisitDetails = completedVisitsList.map(v => ({
    visitId: v.id,
    doctorId: v.doctorId,
    doctorName: v.doctorName,
    hospitalClinic: v.hospitalClinic,
    area: v.area,
    outcomeType: (v.outcomes?.[0] as VisitOutcomeType) || 'LOGGED',
    interestLevel: v.interestLevel || 'high',
    notes: v.summary || 'Visit completed successfully.',
    nextFollowUpDate: v.nextFollowUpDate
  }));

  // Build human-readable executive summary text
  const execLines: string[] = [
    `📅 Territory Day-End Operational Summary (${targetDate})`,
    `Territory: Rawalpindi-East & Islamabad Prime Cluster`,
    `Representative: Product Specialist (EvoCheck CGM)`,
    ``,
    `📊 Key Performance Metrics:`,
    `- Total Planned Visits: ${metrics.totalPlannedVisits}`,
    `- Visits Completed: ${metrics.completedVisits} / ${metrics.totalPlannedVisits}`,
    `- Patient Trials Initiated: ${metrics.trialsStarted}`,
    `- Demo Samples Provided: ${metrics.samplesProvided}`,
    `- Converted Doctor Accounts: ${metrics.convertedVisits}`,
    `- New Patient Opportunities: ${metrics.newOpportunitiesCount} (${metrics.totalCommittedUnits} units, PKR ${metrics.totalPipelineValuePKR.toLocaleString()})`,
    `- Follow-ups Scheduled: ${metrics.followUpsScheduled}`,
    ``,
    `🏥 Doctor Call Highlights:`,
    completedVisitDetails.length > 0
      ? completedVisitDetails.map(d => `• Dr. ${d.doctorName} (${d.hospitalClinic}, ${d.area}) - ${d.outcomeType} [Interest: ${d.interestLevel}]. Note: ${d.notes}`).join('\n')
      : '• No completed visits logged for this date.',
    ``,
    `⚠️ Notable Field Objections & Inquiries:`,
    notableObjections.length > 0
      ? notableObjections.map(o => `• Dr. ${o.doctorName} [${o.category}]: "${o.detail}" -> Response: ${o.responseGiven || 'Addressed with verified 8.66% MARD/15-day wear.'}`).join('\n')
      : '• Zero unresolved objections reported today.',
    ``,
    `🎯 Priority Next-Day Action Items:`,
    outstandingFollowups.length > 0
      ? outstandingFollowups.map(t => `• [${t.priority.toUpperCase()}] Due ${t.dueDate}: Dr. ${t.doctorName} - ${t.title}`).join('\n')
      : '• All scheduled follow-ups are up to date.'
  ];

  const executiveSummaryText = execLines.join('\n');

  // Exportable clean structured text
  const exportableText = [
    `========================================`,
    `MEDREP AI — TERRITORY DAY-END REPORT`,
    `========================================`,
    `DATE: ${targetDate}`,
    `TERRITORY: Rawalpindi-East / Islamabad`,
    `COMPLETION: ${metrics.completedVisits}/${metrics.totalPlannedVisits} calls completed`,
    `COMMITTED PIPELINE: ${metrics.totalCommittedUnits} units (PKR ${metrics.totalPipelineValuePKR.toLocaleString()})`,
    `TRIALS STARTED: ${metrics.trialsStarted} | SAMPLES: ${metrics.samplesProvided}`,
    `----------------------------------------`,
    `CALL LOGS:`,
    ...completedVisitDetails.map(c => `[DONE] Dr. ${c.doctorName} (${c.hospitalClinic}) - Outcome: ${c.outcomeType}`),
    `----------------------------------------`,
    `NEXT ACTIONS:`,
    ...outstandingFollowups.map(f => `[TODO] ${f.dueDate} | Dr. ${f.doctorName}: ${f.title}`),
    `========================================`
  ].join('\n');

  return {
    summaryId: `summary-${targetDate}-${Date.now()}`,
    date: targetDate,
    generatedAt: new Date().toISOString(),
    territoryName: 'Rawalpindi-East & Islamabad',
    representativeName: 'Field Medical Representative',
    metrics,
    outcomesBreakdown,
    completedVisitDetails,
    notableObjections,
    outstandingFollowups,
    executiveSummaryText,
    exportableTextFormat: exportableText
  };
}

export function formatDayEndTextReport(summary: DayEndSummaryReport): string {
  return summary.exportableTextFormat || summary.executiveSummaryText;
}

