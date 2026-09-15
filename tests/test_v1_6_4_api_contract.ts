import assert from 'node:assert/strict';
import { COMPANY_DOCTOR_ASSIGNMENTS } from '../src/data/companyDoctorAssignments';
import { listCompanyDoctorAssignments, summarizeCompanyDoctorAssignments } from '../src/services/companyDoctorAssignmentService';

const summary = summarizeCompanyDoctorAssignments();
assert.equal(COMPANY_DOCTOR_ASSIGNMENTS.length, 52);
assert.equal(summary.twinCities, 31);
assert.equal(summary.outstation, 21);
assert.equal(listCompanyDoctorAssignments({ city: 'Rawalpindi' }).length, 11);
assert.equal(listCompanyDoctorAssignments({ city: 'Islamabad' }).length, 20);
assert.equal(listCompanyDoctorAssignments({ outstation: true }).length, 21);
assert.equal(listCompanyDoctorAssignments({ outstation: false }).length, 31);
assert.equal(listCompanyDoctorAssignments({ locality: 'H-8' }).length, 10);
assert.equal(listCompanyDoctorAssignments({ class: 'A' }).length, 19);
assert.equal(listCompanyDoctorAssignments({ class: 'B' }).length, 33);
assert.equal(listCompanyDoctorAssignments({ search: 'kashif jan' })[0]?.companyDoctorId, '56004');
console.log('v1.6.4 Company Assignment API Contract: 10/10 checks passed');
