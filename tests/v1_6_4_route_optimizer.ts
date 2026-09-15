import assert from 'node:assert/strict';
import { rankCompanyFieldCandidates } from '../src/services/companyDoctorAssignmentService';
import { optimizeCompanyFieldRoute } from '../src/services/companyFieldRouteOptimizer';

const assignments = rankCompanyFieldCandidates([], '2026-09-15', { city: 'Rawalpindi' }, 8).map(candidate => candidate.assignment);
const route = optimizeCompanyFieldRoute(assignments, '2026-09-15', 5);

assert.equal(route.date, '2026-09-15');
assert.equal(route.stops.length, 5);
assert.equal(route.recommendedCount, 5);
assert.equal(route.lockedVisitCount, 0);
assert.equal(route.limitations.some((text: string) => text.includes('Company assignments')), true);
console.log('v1.6.4 Assignment Route Optimizer: 5/5 checks passed');
