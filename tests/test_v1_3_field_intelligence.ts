import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildFieldIntelligence, getCallingWindows } from '../src/services/fieldIntelligenceService';
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
