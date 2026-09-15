import assert from 'node:assert/strict';
import { rankCompanyFieldCandidates } from '../src/services/companyDoctorAssignmentService';

const candidates = rankCompanyFieldCandidates([], '2026-09-15', { city: 'Rawalpindi' }, 8);
assert.equal(candidates.length, 8);
assert.equal(new Set(candidates.map(c => c.assignment.companyDoctorId)).size, 8);
assert.equal(candidates.every(c => c.crmLinked === false), true);
assert.equal(candidates.every(c => c.timing === undefined), true);
assert.equal(candidates.every(c => c.reasons.some(r => r.includes('No verified CRM timing'))), true);

const endocrine = rankCompanyFieldCandidates([], '2026-09-15', { specialty: 'Endocrinologist' }, 12);
assert.equal(endocrine.length, 6);
assert.equal(endocrine.every(c => c.assignment.specialty === 'Endocrinologist'), true);

console.log('v1.6.4 Company Route Integration: 7/7 checks passed');
