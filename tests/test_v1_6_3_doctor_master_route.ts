import assert from 'node:assert/strict';
import { Doctor } from '../src/types';
import { buildDoctorFacilityIndex, getDoctorMasterVerification, rankFieldCandidates } from '../src/services/doctorMasterIntelligence';
import { optimizeFieldRoute } from '../src/services/fieldRouteOptimizer';

const baseDoctor = (overrides: Partial<Doctor> = {}): Doctor => ({
  id: 'doc-test',
  name: 'Dr Test',
  specialty: 'Diabetology',
  hospital: 'Test Medical Centre',
  clinic: 'Diabetes Clinic',
  area: 'PWD',
  city: 'Rawalpindi',
  address: 'Test Address',
  priority: 'A',
  prescriberStatus: 'prospect',
  cgmPotential: 'high',
  affordabilityTier: 'upper_middle',
  relationshipStrength: 2,
  potentialScore: 80,
  dailyPriorityScore: 80,
  contacts: [],
  timings: [],
  totalVisitsCount: 0,
  openPatientOpportunitiesCount: 0,
  isVerified: false,
  ...overrides
});

const fieldVerified = baseDoctor({
  id: 'doc-field',
  name: 'Dr Field Verified',
  isVerified: true,
  timings: [{
    id: 'timing-1', locationName: 'Test Medical Centre', dayOfWeek: 1,
    dayName: 'Monday', startTime: '10:00 AM', endTime: '12:00 PM',
    timingType: 'opd', source: 'field_verified'
  }]
});

const companyOnly = baseDoctor({ id: 'doc-company', name: 'Dr Company', timings: [] });
const active = baseDoctor({
  id: 'doc-active', name: 'Dr Active', prescriberStatus: 'active_prescriber', cgmPotential: 'high',
  timings: [{
    id: 'timing-2', locationName: 'Active Clinic', dayOfWeek: 1,
    dayName: 'Monday', startTime: '02:00 PM', endTime: '04:00 PM',
    timingType: 'private_consultation', source: 'web_researched'
  }]
});

assert.equal(getDoctorMasterVerification(fieldVerified), 'FIELD_VERIFIED');
assert.equal(getDoctorMasterVerification(companyOnly), 'UNKNOWN');

const index = buildDoctorFacilityIndex([fieldVerified]);
assert.equal(index.length, 1);
assert.equal(index[0].locationVerification, 'DOCTOR_FACILITY_CONFIRMED');
assert.equal(index[0].timings[0].source, 'field_verified');

const ranked = rankFieldCandidates([companyOnly, fieldVerified, active], '2026-09-14');
assert.equal(ranked[0].doctor.id, 'doc-field');
assert.ok(ranked[0].reasons.some(reason => reason.includes('Field-verified')));

const visits = [{
  id: 'visit-locked', doctorId: 'doc-company', doctorName: 'Dr Company', doctorSpecialty: 'Medicine',
  hospitalClinic: 'Company Hospital', area: 'Saidpur Road', scheduledDate: '2026-09-14', scheduledTime: '09:00 AM',
  status: 'planned', objectives: []
}] as any;

const route = optimizeFieldRoute([companyOnly, fieldVerified, active], visits, '2026-09-14', 3);
assert.equal(route.lockedVisitCount, 1);
assert.equal(route.stops[0].doctorId, 'doc-company');
assert.equal(route.stops[0].locked, true);
assert.equal(route.stops.length, 3);
assert.equal(route.stops[1].locked, false);
assert.equal(route.stops[2].locked, false);
assert.ok(route.limitations.length >= 2);

console.log('v1.6.3 Doctor Master + Route Intelligence: 11/11 checks passed');
