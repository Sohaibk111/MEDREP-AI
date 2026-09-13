import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:3000';

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  } catch (err: any) {
    return { status: 500, data: null, error: err.message };
  }
}

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function runV162ExperienceSuite() {
  console.log('================================================================');
  console.log('  MEDREP AI v1.6.2 — DOCTOR 360 + PATIENT 360 EXPERIENCE SUITE  ');
  console.log('================================================================\n');

  const storePath = path.join(process.cwd(), 'data', 'medrep_crm_store.json');
  let backupStore: string | null = null;
  if (fs.existsSync(storePath)) {
    backupStore = fs.readFileSync(storePath, 'utf-8');
  }

  try {
    // ----------------------------------------------------------------
    // SECTION 1: BASELINE PRESERVATION & HEALTH
    // ----------------------------------------------------------------
    console.log('--- 1. Baseline Preservation & Health ---');

    const resHealth = await request('/api/v1/health');
    assert(resHealth.status === 200 && resHealth.data?.status === 'ok', 'Health check returns 200 OK');

    const resKnowledge = await request('/api/v1/knowledge');
    assert(
      resKnowledge.status === 200 &&
      resKnowledge.data?.data?.product?.wearDays === 15,
      'EvoCheck 15-day wear duration preserved in knowledge base'
    );

    const resDoctors = await request('/api/v1/doctors');
    assert(resDoctors.status === 200 && Array.isArray(resDoctors.data?.data) && resDoctors.data.data.length > 0, 'Real doctors list available');
    const firstDoc = resDoctors.data.data[0];

    // ----------------------------------------------------------------
    // SECTION 2: DOCTOR 360 DETAIL & TIMELINE ENRICHMENT
    // ----------------------------------------------------------------
    console.log('\n--- 2. Doctor 360 Detail & Unified Timeline ---');

    const resDocDetail = await request(`/api/v1/doctors/${firstDoc.id}`);
    assert(resDocDetail.status === 200 && resDocDetail.data?.success === true, 'GET /api/v1/doctors/:id returns 200');
    assert(Array.isArray(resDocDetail.data?.data?.referredPatients), 'Enriched doctor includes referredPatients array');

    const resDocTimeline = await request(`/api/v1/doctors/${firstDoc.id}/timeline`);
    assert(resDocTimeline.status === 200 && resDocTimeline.data?.success === true, 'GET /api/v1/doctors/:id/timeline returns 200');
    assert(Array.isArray(resDocTimeline.data?.data), 'Doctor timeline returns events array');

    // ----------------------------------------------------------------
    // SECTION 3: DOCTOR PROFILE EDIT & DEACTIVATION
    // ----------------------------------------------------------------
    console.log('\n--- 3. Doctor Profile Edit & Deactivation ---');

    const originalNotes = firstDoc.notes || '';
    const resUpdateDoc = await request(`/api/v1/doctors/${firstDoc.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        notes: `${originalNotes} [v1.6.2 verified notes]`,
        isActive: false
      })
    });
    assert(resUpdateDoc.status === 200 && resUpdateDoc.data?.success === true, 'PUT /api/v1/doctors/:id updates doctor profile');
    assert(resUpdateDoc.data?.data?.isActive === false, 'Doctor can be deactivated without deleting history');
    assert(resUpdateDoc.data?.data?.id === firstDoc.id, 'Doctor ID remains strictly immutable during update');

    // Reactivate doctor
    const resReactivate = await request(`/api/v1/doctors/${firstDoc.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        notes: originalNotes,
        isActive: true
      })
    });
    assert(resReactivate.status === 200 && resReactivate.data?.data?.isActive === true, 'Doctor reactivated successfully');

    // ----------------------------------------------------------------
    // SECTION 4: PATIENT CRM & PATIENT 360 EXPERIENCE
    // ----------------------------------------------------------------
    console.log('\n--- 4. Patient CRM & Patient 360 ---');

    const resPatients = await request('/api/v1/patients');
    assert(resPatients.status === 200 && Array.isArray(resPatients.data?.data), 'GET /api/v1/patients returns patient directory');

    // Create a temporary test patient
    const testPatientPayload = {
      name: 'Test Verification Patient',
      phone: '+92 300 9998877',
      whatsapp: '+92 300 9998877',
      email: 'test.patient@example.com',
      city: 'Rawalpindi',
      doctorId: firstDoc.id,
      acquisitionSource: 'DOCTOR_REFERRAL',
      status: 'REFERRED'
    };

    const resCreatePatient = await request('/api/v1/patients', {
      method: 'POST',
      body: JSON.stringify(testPatientPayload)
    });
    assert(resCreatePatient.status === 201 && resCreatePatient.data?.success === true, 'POST /api/v1/patients creates new patient');
    const createdPatient = resCreatePatient.data?.data;
    assert(Boolean(createdPatient?.patientId), 'Created patient has generated patientId');
    assert(createdPatient?.doctorId === firstDoc.id, 'Patient correctly linked to referring doctor ID');

    // Fetch single patient
    const resGetPatient = await request(`/api/v1/patients/${createdPatient.patientId}`);
    assert(resGetPatient.status === 200 && resGetPatient.data?.data?.name === 'Test Verification Patient', 'GET /api/v1/patients/:id returns patient');

    // Update patient
    const resUpdatePatient = await request(`/api/v1/patients/${createdPatient.patientId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'ACTIVE',
        city: 'Islamabad'
      })
    });
    assert(resUpdatePatient.status === 200 && resUpdatePatient.data?.data?.status === 'ACTIVE', 'PUT /api/v1/patients/:id updates CRM status to ACTIVE');
    assert(resUpdatePatient.data?.data?.patientId === createdPatient.patientId, 'Patient ID remains immutable');

    // Patient Timeline
    const resPatientTimeline = await request(`/api/v1/patients/${createdPatient.patientId}/timeline`);
    assert(resPatientTimeline.status === 200 && Array.isArray(resPatientTimeline.data?.data), 'GET /api/v1/patients/:id/timeline returns timeline events');
    assert(
      resPatientTimeline.data?.data?.some((e: any) => e.type === 'PATIENT_CREATED' || e.type === 'STATUS_UPDATE'),
      'Patient timeline includes creation/status events'
    );

    // Verify Doctor 360 reflects referred patient
    const resDocWithReferred = await request(`/api/v1/doctors/${firstDoc.id}`);
    const referredList = resDocWithReferred.data?.data?.referredPatients || [];
    assert(
      referredList.some((rp: any) => rp.patientId === createdPatient.patientId),
      'Doctor 360 referredPatients accurately includes the newly referred patient'
    );

    // ----------------------------------------------------------------
    // SECTION 5: SENSOR LIFECYCLE (15-day controlled EvoCheck spec)
    // ----------------------------------------------------------------
    console.log('\n--- 5. Sensor Lifecycle & Orders Integration ---');

    const testSensorPayload = {
      patientId: createdPatient.patientId,
      product: 'EvoCheck CGM Sensor',
      startDate: new Date().toISOString().split('T')[0],
      expectedEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      renewalDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ACTIVE'
    };

    const resCreateSensor = await request('/api/v1/sensors', {
      method: 'POST',
      body: JSON.stringify(testSensorPayload)
    });
    assert(resCreateSensor.status === 201 && resCreateSensor.data?.success === true, 'POST /api/v1/sensors attaches 15-day EvoCheck sensor to patient');

    const resSensors = await request(`/api/v1/sensors?patientId=${createdPatient.patientId}`);
    assert(resSensors.status === 200 && resSensors.data?.data?.length > 0, 'GET /api/v1/sensors filters by patientId');

    // Check timeline now includes sensor event
    const resUpdatedTimeline = await request(`/api/v1/patients/${createdPatient.patientId}/timeline`);
    assert(
      resUpdatedTimeline.data?.data?.some((e: any) => e.type === 'SENSOR'),
      'Patient unified timeline includes sensor lifecycle events'
    );

  } finally {
    // Clean up temporary test records to preserve durable store
    if (backupStore && fs.existsSync(storePath)) {
      fs.writeFileSync(storePath, backupStore, 'utf-8');
      console.log('\n[Clean Up] Restored medrep_crm_store.json to clean pre-test state.');
    }
  }

  console.log('\n================================================================');
  console.log(`  RESULTS: ${passedCount} / ${totalCount} PASSED`);
  console.log('================================================================');

  if (passedCount < totalCount) {
    process.exit(1);
  }
}

runV162ExperienceSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
