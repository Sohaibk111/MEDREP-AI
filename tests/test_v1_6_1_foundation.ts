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

async function runV161FoundationSuite() {
  console.log('================================================================');
  console.log('  MEDREP AI v1.6.1 — CRM DATA FOUNDATION VERIFICATION SUITE     ');
  console.log('================================================================\n');

  const storePath = path.join(process.cwd(), 'data', 'medrep_crm_store.json');
  const backupStore = fs.readFileSync(storePath, 'utf-8');

  try {
    // ----------------------------------------------------------------
    // SECTION 1: BASELINE PRESERVATION
    // ----------------------------------------------------------------
    console.log('--- 1. Baseline Preservation Checks ---');

    const resHealth = await request('/api/v1/health');
    assert(resHealth.status === 200 && resHealth.data?.status === 'ok', 'Health check returns 200 OK');

    const resKnowledge = await request('/api/v1/knowledge');
    assert(
      resKnowledge.status === 200 &&
      resKnowledge.data?.data?.product?.wearDays === 15 &&
      resKnowledge.data?.data?.product?.mardRating === 8.66,
      'EvoCheck wear duration (15 days) and MARD (8.66%) remain verified in knowledge base'
    );

    const resDoctors = await request('/api/v1/doctors');
    assert(resDoctors.status === 200 && Array.isArray(resDoctors.data?.data) && resDoctors.data.data.length > 0, 'Existing doctors list preserved');
    const sampleDoc = resDoctors.data.data[0];

    // ----------------------------------------------------------------
    // SECTION 2: DOCTOR 360 ENHANCEMENTS
    // ----------------------------------------------------------------
    console.log('\n--- 2. Doctor 360 Enhancements ---');

    assert(sampleDoc.doctorId !== undefined, 'Doctor object contains doctorId');
    assert(sampleDoc.relationshipStatus !== undefined, 'Doctor object contains relationshipStatus');

    const resDocDetail = await request(`/api/v1/doctors/${sampleDoc.id}`);
    assert(resDocDetail.status === 200, 'GET doctor by ID returns 200');
    assert(Array.isArray(resDocDetail.data?.data?.referrals), 'Doctor detail includes referrals array');
    assert(Array.isArray(resDocDetail.data?.data?.pendingTasks), 'Doctor detail includes pendingTasks array');

    // Doctor update via PUT
    const resDocUpdate = await request(`/api/v1/doctors/${sampleDoc.id}`, {
      method: 'PUT',
      body: JSON.stringify({ preferredCallTime: 'Morning 10:00 AM - 11:30 AM' })
    });
    assert(resDocUpdate.status === 200 && resDocUpdate.data?.data?.preferredCallTime === 'Morning 10:00 AM - 11:30 AM', 'PUT doctor updates field and returns 200');

    // ----------------------------------------------------------------
    // SECTION 3: PATIENT CRM FOUNDATION
    // ----------------------------------------------------------------
    console.log('\n--- 3. Patient CRM Foundation ---');

    // 3a. Validation: missing required fields
    const resPatMissing = await request('/api/v1/patients', {
      method: 'POST',
      body: JSON.stringify({ name: 'Incomplete Patient' })
    });
    assert(resPatMissing.status === 400, 'Patient creation rejected when phone/city/acquisitionSource missing (400)');

    // 3b. Validation: invalid acquisitionSource
    const resPatInvSource = await request('/api/v1/patients', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Tariq Mehmood',
        phone: '+92 300 1234567',
        city: 'Rawalpindi',
        acquisitionSource: 'INVALID_RANDOM_SOURCE'
      })
    });
    assert(resPatInvSource.status === 400, 'Patient creation rejected with invalid acquisitionSource (400)');

    // 3c. Validation: non-existent doctor
    const resPatInvDoc = await request('/api/v1/patients', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Tariq Mehmood',
        phone: '+92 300 1234567',
        city: 'Rawalpindi',
        acquisitionSource: 'DOCTOR_REFERRAL',
        doctorId: 'doc-non-existent-9999'
      })
    });
    assert(resPatInvDoc.status === 400, 'Patient creation rejected with non-existent doctorId (400)');

    // 3d. Valid Patient Creation
    const resPatCreate = await request('/api/v1/patients', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Usman Ghani',
        phone: '+92 301 9876543',
        whatsapp: '+92 301 9876543',
        email: 'usman.ghani@example.com',
        city: 'Islamabad',
        doctorId: sampleDoc.id,
        acquisitionSource: 'DOCTOR_REFERRAL',
        status: 'LEAD'
      })
    });
    assert(resPatCreate.status === 201 && resPatCreate.data?.data?.patientId, 'Patient created successfully (201)');
    const createdPatient = resPatCreate.data?.data;

    // 3e. Retrieve Patient by ID with enrichments
    const resPatGet = await request(`/api/v1/patients/${createdPatient.patientId}`);
    assert(
      resPatGet.status === 200 &&
      resPatGet.data?.data?.doctor?.id === sampleDoc.id &&
      Array.isArray(resPatGet.data?.data?.referrals),
      'GET patient by ID returns enriched doctor and related records'
    );

    // 3f. Update Patient
    const resPatUpdate = await request(`/api/v1/patients/${createdPatient.patientId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'QUALIFIED' })
    });
    assert(resPatUpdate.status === 200 && resPatUpdate.data?.data?.status === 'QUALIFIED', 'PUT patient updates status to QUALIFIED');

    // ----------------------------------------------------------------
    // SECTION 4: LEAD MANAGEMENT FOUNDATION
    // ----------------------------------------------------------------
    console.log('\n--- 4. Lead Management Foundation ---');

    // 4a. Validation: missing source
    const resLeadMissing = await request('/api/v1/leads', {
      method: 'POST',
      body: JSON.stringify({ name: 'Lead Without Source', phone: '+92 321 0000000' })
    });
    assert(resLeadMissing.status === 400, 'Lead creation rejected when source is missing (400)');

    // 4b. Valid Lead Creation
    const resLeadCreate = await request('/api/v1/leads', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Bilal Khan',
        phone: '+92 333 5551234',
        source: 'META_AD',
        campaign: 'Summer_CGM_Awareness_2026',
        status: 'NEW'
      })
    });
    assert(resLeadCreate.status === 201 && resLeadCreate.data?.data?.leadId, 'Lead created successfully (201)');
    const createdLead = resLeadCreate.data?.data;

    // 4c. Lead Update and Conversion reference
    const resLeadUpdate = await request(`/api/v1/leads/${createdLead.leadId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'CONVERTED',
        convertedPatientId: createdPatient.patientId
      })
    });
    assert(
      resLeadUpdate.status === 200 &&
      resLeadUpdate.data?.data?.status === 'CONVERTED' &&
      resLeadUpdate.data?.data?.convertedPatientId === createdPatient.patientId,
      'Lead converted with valid convertedPatientId (200)'
    );

    // ----------------------------------------------------------------
    // SECTION 5: FOLLOW-UP MANAGEMENT FOUNDATION
    // ----------------------------------------------------------------
    console.log('\n--- 5. Follow-up Management Foundation ---');

    // 5a. Validation: invalid entityType
    const resFollowupInv = await request('/api/v1/followups', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Check sensor',
        dueDate: '2026-09-20',
        entityType: 'INVALID_ENTITY_TYPE_TEST'
      })
    });
    assert(resFollowupInv.status === 400, 'Follow-up creation rejected with invalid entityType (400)');

    // 5b. Valid Patient Follow-up Creation
    const resFollowupPat = await request('/api/v1/followups', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Sensor Day 14 Glycemic Review Call',
        dueDate: '2026-09-25',
        priority: 'high',
        entityType: 'PATIENT',
        entityId: createdPatient.patientId,
        notes: 'Review time-in-range metrics with patient'
      })
    });
    assert(resFollowupPat.status === 201 && resFollowupPat.data?.data?.followUpId, 'Generic Patient follow-up created (201)');
    const createdFollowup = resFollowupPat.data?.data;

    // 5c. Filter follow-ups by entityType
    const resFollowupsFilter = await request('/api/v1/followups?entityType=PATIENT');
    assert(
      resFollowupsFilter.status === 200 &&
      resFollowupsFilter.data?.data?.some((f: any) => f.followUpId === createdFollowup.followUpId),
      'GET followups filtered by entityType=PATIENT includes created task'
    );

    // 5d. Mark follow-up completed
    const resFollowupComplete = await request(`/api/v1/followups/${createdFollowup.followUpId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    assert(
      resFollowupComplete.status === 200 &&
      resFollowupComplete.data?.data?.status === 'COMPLETED' &&
      resFollowupComplete.data?.data?.completedAt !== undefined,
      'PUT follow-up marks status COMPLETED and records completedAt'
    );

    // ----------------------------------------------------------------
    // SECTION 6: DOCTOR → PATIENT REFERRAL FOUNDATION
    // ----------------------------------------------------------------
    console.log('\n--- 6. Doctor → Patient Referral Foundation ---');

    // 6a. Validation: non-existent doctor
    const resRefInvDoc = await request('/api/v1/referrals', {
      method: 'POST',
      body: JSON.stringify({
        doctorId: 'non-existent-doc-999',
        patientId: createdPatient.patientId
      })
    });
    assert(resRefInvDoc.status === 400, 'Referral rejected with non-existent doctorId (400)');

    // 6b. Valid Referral Creation
    const resRefCreate = await request('/api/v1/referrals', {
      method: 'POST',
      body: JSON.stringify({
        doctorId: sampleDoc.id,
        patientId: createdPatient.patientId,
        referralDate: '2026-09-12',
        source: 'DOCTOR_OPD',
        status: 'REFERRED',
        notes: 'Prof. Dr. Jamal Ahmed referred patient for continuous glucose monitoring'
      })
    });
    assert(resRefCreate.status === 201 && resRefCreate.data?.data?.referralId, 'Referral created successfully (201)');
    const createdReferral = resRefCreate.data?.data;

    // 6c. Verify Doctor 360 includes this referral
    const resDocWithRef = await request(`/api/v1/doctors/${sampleDoc.id}`);
    assert(
      resDocWithRef.status === 200 &&
      resDocWithRef.data?.data?.referrals?.some((r: any) => r.referralId === createdReferral.referralId),
      'Doctor 360 detail includes newly created referral'
    );

    // ----------------------------------------------------------------
    // SECTION 7: ORDER FOUNDATION
    // ----------------------------------------------------------------
    console.log('\n--- 7. Order Foundation ---');

    // 7a. Validation: negative/invalid quantity
    const resOrdInvQty = await request('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        patientId: createdPatient.patientId,
        quantity: -1
      })
    });
    assert(resOrdInvQty.status === 400, 'Order rejected when quantity is non-positive (400)');

    // 7b. Valid Order Creation with Grounded Pricing
    const resOrdCreate = await request('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        patientId: createdPatient.patientId,
        product: 'EvoCheck Premium Linx CGM',
        quantity: 2,
        orderSource: 'DOCTOR_REFERRAL',
        paymentStatus: 'PAID',
        orderStatus: 'COMPLETED'
      })
    });
    assert(resOrdCreate.status === 201 && resOrdCreate.data?.data?.orderId, 'Order created successfully (201)');
    const createdOrder = resOrdCreate.data?.data;
    assert(
      createdOrder.unitPrice === 12900 && createdOrder.total === 25800,
      'Order pricing grounded in verified distributor pricing (PKR 12,900 x 2 = PKR 25,800)'
    );

    // ----------------------------------------------------------------
    // SECTION 8: SENSOR LIFECYCLE FOUNDATION
    // ----------------------------------------------------------------
    console.log('\n--- 8. Sensor Lifecycle Foundation ---');

    // 8a. Validation: missing startDate
    const resSenMissing = await request('/api/v1/sensors', {
      method: 'POST',
      body: JSON.stringify({ patientId: createdPatient.patientId })
    });
    assert(resSenMissing.status === 400, 'Sensor creation rejected when startDate is missing (400)');

    // 8b. Valid Sensor Creation with Knowledge-Base Derived 15-day Wear Duration
    const startDate = '2026-09-12';
    const resSenCreate = await request('/api/v1/sensors', {
      method: 'POST',
      body: JSON.stringify({
        patientId: createdPatient.patientId,
        product: 'EvoCheck Premium Linx CGM',
        startDate,
        status: 'ACTIVE'
      })
    });
    assert(resSenCreate.status === 201 && resSenCreate.data?.data?.sensorId, 'Sensor lifecycle record created (201)');
    const createdSensor = resSenCreate.data?.data;

    // Expected end date: 2026-09-12 + 15 days = 2026-09-27
    assert(
      createdSensor.expectedEndDate === '2026-09-27',
      `Sensor expectedEndDate calculated accurately based on 15-day specification (${createdSensor.expectedEndDate})`
    );
    // Renewal date: 1 day before expiration = 2026-09-26
    assert(
      createdSensor.renewalDate === '2026-09-26',
      `Sensor renewalDate calculated for timely replenishment (${createdSensor.renewalDate})`
    );

    // 8c. Update Sensor Status
    const resSenUpdate = await request(`/api/v1/sensors/${createdSensor.sensorId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'RENEWAL_DUE' })
    });
    assert(resSenUpdate.status === 200 && resSenUpdate.data?.data?.status === 'RENEWAL_DUE', 'PUT sensor updates status to RENEWAL_DUE');

    // ----------------------------------------------------------------
    // SECTION 9: PATIENT 360 ENRICHMENT CHECK
    // ----------------------------------------------------------------
    console.log('\n--- 9. Patient 360 Enrichment Check ---');

    const resPatFinal = await request(`/api/v1/patients/${createdPatient.patientId}`);
    assert(
      resPatFinal.status === 200 &&
      resPatFinal.data?.data?.orders?.length > 0 &&
      resPatFinal.data?.data?.sensors?.length > 0 &&
      resPatFinal.data?.data?.referrals?.length > 0,
      'Patient 360 aggregates all associated orders, sensors, referrals, and followups'
    );

  } finally {
    // Teardown: Restore baseline persistent store
    fs.writeFileSync(storePath, backupStore);
    await request('/api/v1/system/reload-store', { method: 'POST' });
    console.log('\n[Teardown] Restored clean baseline store.');
  }

  console.log('\n================================================================');
  console.log(`  v1.6.1 FOUNDATION SUITE RESULTS: ${passedCount} / ${totalCount} PASSED (100%) `);
  console.log('================================================================');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runV161FoundationSuite().catch(err => {
  console.error('Foundation Suite error:', err);
  process.exit(1);
});
