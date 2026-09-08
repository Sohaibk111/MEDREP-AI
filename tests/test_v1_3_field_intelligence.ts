import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { assessDoctor, buildFieldIntelligence, getCallingWindows } from '../src/services/fieldIntelligenceService';
import { buildDailyRoutePlan } from '../src/services/dailyRouteService';

const root = process.cwd();
const storePath = path.join(root, 'data', 'medrep_crm_store.json');
const base = 'http://127.0.0.1:3000/api/v1';
async function api(pathname: string) { const response = await fetch(`${base}${pathname}`); return { response, body: await response.json() }; }

async function main() {
  const original = fs.readFileSync(storePath, 'utf8');
  try {
    const store = JSON.parse(original);
    const input = { doctors: store.doctors, visits: store.visits, followups: store.followups, opportunities: store.patientOpportunities, outcomes: store.outcomes || [], samples: store.sampleTransactions || [], targetDate: '2026-09-01' };
    const intelligence = buildFieldIntelligence(input);
    assert(intelligence.candidates.every(a => a.score >= 0 && a.score <= 100), 'scores are bounded');
    assert(intelligence.candidates.every(a => a.reasons.filter(r => r.points > 0).every(r => r.factual && r.sourceIds.length > 0)), 'positive contributions have factual evidence');
    assert.deepEqual(buildFieldIntelligence(input).candidates.map(a => a.doctorId), intelligence.candidates.map(a => a.doctorId), 'ordering is deterministic');
    assert(getCallingWindows(store.doctors.find((d: any) => d.id === 'doc-2'), '2026-09-01').length > 0, 'matching weekday calling window is available');
    assert.equal(getCallingWindows(store.doctors.find((d: any) => d.id === 'doc-2'), '2026-09-05').length, 0, 'no timing fallback is fabricated');

    const cloneDoctor = (id: string, overrides: any = {}) => ({ ...store.doctors[0], id, name: id, priority: 'C', prescriberStatus: 'prospect', relationshipStrength: 0, potentialScore: 0, totalVisitsCount: 0, timings: [], ...overrides });
    const cleanInput = (doctors: any[], extra: any = {}) => ({ doctors, visits: [], followups: [], opportunities: [], outcomes: [], samples: [], targetDate: '2026-09-01', ...extra });
    const tuesdayTiming = (id: string, startTime: string) => ({ id, locationName: 'Test Clinic', dayOfWeek: 2, dayName: 'Tuesday', startTime, endTime: '12:00 PM', timingType: 'opd', source: 'field_verified' });

    // Required deterministic ordering: in-progress -> scheduled -> score -> earliest window -> tier -> doctor id.
    const tieA = cloneDoctor('tie-a', { timings: [tuesdayTiming('tim-a', '10:00 AM')] });
    const tieB = cloneDoctor('tie-b', { timings: [tuesdayTiming('tim-b', '09:00 AM')] });
    const scheduledDoctor = cloneDoctor('tie-scheduled', { timings: [tuesdayTiming('tim-scheduled', '11:00 AM')] });
    const activeDoctor = cloneDoctor('tie-progress', { timings: [tuesdayTiming('tim-progress', '01:00 PM')] });
    const tieInput = cleanInput([tieA, tieB, scheduledDoctor, activeDoctor], {
      visits: [
        { id: 'visit-scheduled', doctorId: 'tie-scheduled', doctorName: 'tie-scheduled', doctorSpecialty: 'Test', hospitalClinic: 'Test', area: 'Test', scheduledDate: '2026-09-01', scheduledTime: '11:00 AM', status: 'planned', objectives: [] },
        { id: 'visit-progress', doctorId: 'tie-progress', doctorName: 'tie-progress', doctorSpecialty: 'Test', hospitalClinic: 'Test', area: 'Test', scheduledDate: '2026-09-01', scheduledTime: '01:00 PM', status: 'in_progress', objectives: [] }
      ]
    });
    const tieResult = buildFieldIntelligence(tieInput).candidates.map(a => a.doctorId);
    assert.equal(tieResult[0], 'tie-progress', 'in-progress visits rank first');
    assert.equal(tieResult[1], 'tie-scheduled', 'scheduled visits rank after in-progress');
    assert.deepEqual(tieResult.slice(2), ['tie-b', 'tie-a'], 'equal-score candidates use earliest calling window before doctor id');

    const sampleDoctor = cloneDoctor('sample-doctor', { timings: [tuesdayTiming('tim-sample', '10:00 AM')] });
    const sampleAssessment = assessDoctor(sampleDoctor, cleanInput([sampleDoctor], {
      samples: [{ id: 'sample-1', productId: 'evocheck-demo-kit', doctorId: 'sample-doctor', quantity: 1, transactionType: 'ISSUED', recordedAt: '2026-08-25T10:00:00.000Z' }]
    }));
    assert.equal(sampleAssessment.nextBestAction.type, 'SAMPLE_FOLLOW_UP', 'recent sample produces sample follow-up NBA');

    const staleDoctor = cloneDoctor('stale-doctor', { timings: [tuesdayTiming('tim-stale', '10:00 AM')] });
    const staleAssessment = assessDoctor(staleDoctor, cleanInput([staleDoctor], {
      visits: [{ id: 'old-visit', doctorId: 'stale-doctor', doctorName: 'stale-doctor', doctorSpecialty: 'Test', hospitalClinic: 'Test', area: 'Test', scheduledDate: '2026-06-01', scheduledTime: '10:00 AM', status: 'completed', objectives: [] }]
    }));
    const staleEvidence = staleAssessment.reasons.find(r => r.code === 'NO_RECENT_INTERACTION');
    assert(staleEvidence && staleEvidence.points >= 1 && staleEvidence.points <= 8, 'stale interaction receives 0-8 no-recent-interaction score with evidence');

    const prospectDoctor = cloneDoctor('prospect-doctor', { timings: [tuesdayTiming('tim-prospect', '10:00 AM')] });
    const prospectAssessment = assessDoctor(prospectDoctor, cleanInput([prospectDoctor]));
    assert(prospectAssessment.reasons.some(r => r.points === 10 && r.source === 'LIFECYCLE'), 'engaged/prospect lifecycle contribution has evidence');

    const oldConversionDoctor = cloneDoctor('old-conversion', { timings: [tuesdayTiming('tim-conversion', '10:00 AM')] });
    const oldConversion = assessDoctor(oldConversionDoctor, cleanInput([oldConversionDoctor], {
      outcomes: [{ id: 'old-conversion-outcome', visitId: 'old-conversion-visit', doctorId: 'old-conversion', outcomeType: 'CONVERTED', timestamp: '2026-01-01T10:00:00.000Z', nextActionRecommendation: 'None', updatedJourneyState: 'ADOPTING' }]
    }));
    assert(!oldConversion.reasons.some(r => r.code === 'RECENT_CONVERSION_SIGNAL'), 'old conversion does not count as recent');

    const objectionDoctor = cloneDoctor('objection-doctor', { timings: [tuesdayTiming('tim-objection', '10:00 AM')] });
    const objectionAssessment = assessDoctor(objectionDoctor, cleanInput([objectionDoctor], {
      visits: [
        { id: 'old-objection-visit', doctorId: 'objection-doctor', doctorName: 'objection-doctor', doctorSpecialty: 'Test', hospitalClinic: 'Test', area: 'Test', scheduledDate: '2026-08-01', scheduledTime: '10:00 AM', status: 'completed', objectives: [], objections: [{ id: 'old-obj', category: 'other', detail: 'Old', resolved: false }] },
        { id: 'new-objection-visit', doctorId: 'objection-doctor', doctorName: 'objection-doctor', doctorSpecialty: 'Test', hospitalClinic: 'Test', area: 'Test', scheduledDate: '2026-08-28', scheduledTime: '10:00 AM', status: 'completed', objectives: [], objections: [{ id: 'new-obj', category: 'other', detail: 'New', resolved: false }] }
      ]
    }));
    assert(objectionAssessment.reasons.some(r => r.code === 'RECENT_OBJECTION' && r.sourceIds.includes('new-objection-visit')), 'latest unresolved objection is selected deterministically');

    const route = buildDailyRoutePlan({ ...input, fieldPlan: store.fieldPlan, maxStops: 8 });
    assert.equal(route.geographyStatus, 'AREA_ONLY_NO_COORDINATES');
    assert(route.limitations.some(l => l.includes('No verified geographic coordinates')), 'no travel data is fabricated');
    assert(route.immutableScheduledStops.length > 0, 'scheduled visits remain fixed');
    assert(route.recommendedStops.every(s => !route.immutableScheduledStops.some(v => v.doctorId === s.doctorId)), 'unscheduled doctors are separate recommendations');

    const beforeGet = fs.readFileSync(storePath, 'utf8');
    const fi = await api('/territory/field-intelligence?date=2026-09-01&includeIneligible=true');
    assert.equal(fi.response.status, 200); assert(fi.body.data.candidates.length > 0);
    assert(fi.body.data.candidates.every((a: any) => a.score >= 0 && a.score <= 100));
    const daily = await api('/territory/daily-route-plan?date=2026-09-01');
    assert.equal(daily.response.status, 200); assert.equal(daily.body.data.geographyStatus, 'AREA_ONLY_NO_COORDINATES');
    const pre = await api('/doctors/doc-1/pre-visit-intelligence?date=2026-09-01');
    assert.equal(pre.response.status, 200); assert.equal(pre.body.data.doctor.id, 'doc-1');
    const unknown = await api('/doctors/not-a-doctor/pre-visit-intelligence'); assert.equal(unknown.response.status, 404);
    const invalid = await api('/territory/field-intelligence?date=not-a-date'); assert.equal(invalid.response.status, 400);
    await api('/territory/field-intelligence?date=2026-09-01'); await api('/territory/daily-route-plan?date=2026-09-01');
    assert.equal(fs.readFileSync(storePath, 'utf8'), beforeGet, 'repeated read-only GETs preserve store byte-for-byte');
    console.log('✅ v1.3 field intelligence tests passed');
  } finally { fs.writeFileSync(storePath, original); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
