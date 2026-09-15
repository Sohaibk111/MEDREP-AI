import assert from 'node:assert/strict';
import {
  COMPANY_DOCTOR_ASSIGNMENTS,
  isOutstationAssignment,
  isTwinCityAssignment
} from '../src/data/companyDoctorAssignments';
import {
  getCompanyDoctorAssignment,
  listCompanyDoctorAssignments,
  reconcileCompanyAssignmentToCRM,
  summarizeCompanyDoctorAssignments,
  rankCompanyFieldCandidates
} from '../src/services/companyDoctorAssignmentService';

const checks: string[] = [];
const check = (condition: boolean, label: string) => {
  assert.equal(condition, true, label);
  checks.push(label);
};

check(COMPANY_DOCTOR_ASSIGNMENTS.length === 52, 'exactly 52 company assignments loaded');
check(new Set(COMPANY_DOCTOR_ASSIGNMENTS.map(d => d.companyDoctorId)).size === 52, 'company doctor IDs are unique');
check(COMPANY_DOCTOR_ASSIGNMENTS.every(d => d.assignedMso === 'Sohaib'), 'all assignments belong to Sohaib');
check(COMPANY_DOCTOR_ASSIGNMENTS.every(d => d.assignmentSource === 'COMPANY_WORKBOOK'), 'all rows retain company-workbook provenance');
check(COMPANY_DOCTOR_ASSIGNMENTS.filter(isTwinCityAssignment).length === 31, '31 assignments are in the Rawalpindi/Islamabad territory');
check(COMPANY_DOCTOR_ASSIGNMENTS.filter(isOutstationAssignment).length === 21, '21 assignments are outstation');
check(listCompanyDoctorAssignments({ city: 'Rawalpindi' }).length === 12, 'Rawalpindi filter returns 12 assignments');
check(listCompanyDoctorAssignments({ city: 'Islamabad' }).length === 19, 'Islamabad filter returns 19 assignments');
check(listCompanyDoctorAssignments({ city: 'Abbottabad' }).length === 11, 'Abbottabad filter returns 11 assignments');
check(listCompanyDoctorAssignments({ locality: 'Saidpur Road' }).length === 11, 'Saidpur Road filter returns 11 assignments');
check(listCompanyDoctorAssignments({ specialty: 'Endocrinologist' }).length === 7, 'Endocrinologist filter returns 7 assignments');
check(getCompanyDoctorAssignment('56004')?.name === 'Dr Kashif Jan', 'company ID lookup preserves Dr Kashif Jan');
check(getCompanyDoctorAssignment('999999') === undefined, 'unknown company ID remains unresolved');
check(reconcileCompanyAssignmentToCRM(
  COMPANY_DOCTOR_ASSIGNMENTS[0],
  [{ id: 'doc-1', doctorId: 'doc-1', companyCode: 'different-code' }]
) === undefined, 'CRM reconciliation does not use unrelated synthetic identity');
check(reconcileCompanyAssignmentToCRM(
  COMPANY_DOCTOR_ASSIGNMENTS[0],
  [{ id: 'doc-99', doctorId: '29810', companyCode: undefined }]
)?.id === 'doc-99', 'CRM reconciliation requires explicit company doctor ID');

const summary = summarizeCompanyDoctorAssignments();
check(summary.total === 52 && summary.twinCities === 31 && summary.outstation === 21, 'assignment summary totals are deterministic');
check(summary.byCity.Rawalpindi === 12 && summary.byCity.Islamabad === 19, 'city summary preserves Twin Cities split');
check(summary.byLocality['Saidpur Road'] === 11, 'locality summary preserves Saidpur Road count');
const routeCandidates = rankCompanyFieldCandidates([], '2026-09-15', { city: 'Rawalpindi' }, 8);
check(routeCandidates.length === 8, 'company route candidate capacity is deterministic');
check(routeCandidates.every(candidate => candidate.crmLinked === false), 'unlinked company assignments do not fabricate CRM links');

console.log(`v1.6.4 Company Assignment Registry: ${checks.length}/${checks.length} checks passed`);
