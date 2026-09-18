import assert from 'node:assert/strict';
import { COMPANY_DOCTOR_ASSIGNMENTS } from '../src/data/companyDoctorAssignments';
import { listCompanyDoctorAssignments, summarizeCompanyDoctorAssignments, rankCompanyFieldCandidates } from '../src/services/companyDoctorAssignmentService';
import { optimizeCompanyFieldRoute } from '../src/services/companyFieldRouteOptimizer';

const summary = summarizeCompanyDoctorAssignments();
assert.equal(COMPANY_DOCTOR_ASSIGNMENTS.length, 52);
assert.equal(summary.twinCities, 31);
assert.equal(summary.outstation, 21);
assert.equal(listCompanyDoctorAssignments({ city: 'Rawalpindi' }).length, 12);
assert.equal(listCompanyDoctorAssignments({ city: 'Islamabad' }).length, 19);
assert.equal(listCompanyDoctorAssignments({ outstation: true }).length, 21);
assert.equal(listCompanyDoctorAssignments({ outstation: false }).length, 31);
assert.equal(listCompanyDoctorAssignments({ locality: 'Saidpur Road' }).length, 11);
assert.equal(listCompanyDoctorAssignments({ specialty: 'Endocrinologist' }).length, 7);
assert.equal(listCompanyDoctorAssignments({ class: 'A' }).length, 19);
assert.equal(listCompanyDoctorAssignments({ class: 'B' }).length, 33);
assert.equal(listCompanyDoctorAssignments({ search: 'kashif jan' })[0]?.companyDoctorId, '56004');

const ranked = rankCompanyFieldCandidates([], '2026-09-15', { city: 'Rawalpindi' }, 8);
assert.equal(ranked.length, 8);
assert.equal(ranked.every(c => c.crmLinked === false), true);
assert.equal(ranked.every(c => c.timing === undefined), true);

const route = optimizeCompanyFieldRoute(ranked.map(c => c.assignment), '2026-09-15', 5);
assert.equal(route.stops.length, 5);
assert.equal(route.recommendedCount, 5);
assert.equal(route.lockedVisitCount, 0);
assert.ok(route.limitations.length >= 3);

console.log('v1.6.4 deterministic validation passed: 19/19 checks');
