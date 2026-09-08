import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = 'http://127.0.0.1:3000/api/v1';
const storePath = path.join(process.cwd(), 'data', 'medrep_crm_store.json');

async function api(pathname: string, options: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  return { response, body: await response.json() };
}

async function run() {
  const originalStore = fs.readFileSync(storePath, 'utf8');
  try {
    const inventory = await api('/samples/inventory');
    assert.equal(inventory.response.status, 200);
    assert.equal(inventory.body.data[0].quantityOnHand, 100, 'clean v1.2 inventory starts at its configured balance');

    const missingStatus = await api('/doctors/doc-1/lifecycle/override', { method: 'POST', body: JSON.stringify({}) });
    assert.equal(missingStatus.response.status, 400, 'manual lifecycle override requires a target status');

    const championBlocked = await api('/doctors/doc-3/lifecycle/override', { method: 'POST', body: JSON.stringify({ status: 'CHAMPION' }) });
    assert.equal(championBlocked.response.status, 422, 'champion requires relationship strength >= 4');

    const target = await api('/targets/monthly/2026-09', { method: 'PUT', body: JSON.stringify({ targetUnits: 10 }) });
    assert.equal(target.response.status, 200);
    assert.equal(target.body.data.achievedUnits, 0, 'monthly achieved units has no artificial baseline');

    // Inventory failure is fully atomic: the persisted store is byte-for-byte
    // unchanged, which covers visit, doctor, lifecycle, target, ledger and outcomes.
    const stateBeforeFailedOutcome = fs.readFileSync(storePath, 'utf8');
    const insufficient = await api('/visits/vis-101/outcome', {
      method: 'POST',
      body: JSON.stringify({ outcomeType: 'TRIAL_STARTED', samplesCount: 101, committedUnits: 3, clientVisitId: 'v12-insufficient-inventory' })
    });
    assert.equal(insufficient.response.status, 409);
    assert.equal(fs.readFileSync(storePath, 'utf8'), stateBeforeFailedOutcome, 'insufficient inventory leaves CRM state unchanged');

    const firstOutcome = await api('/visits/vis-101/outcome', {
      method: 'POST',
      body: JSON.stringify({ outcomeType: 'CONVERTED', samplesCount: 2, committedUnits: 3, notes: 'v1.2 specification exercise', clientVisitId: 'v12-idempotent-outcome-1' })
    });
    assert.equal(firstOutcome.response.status, 200, 'first idempotent submission succeeds');
    const stateAfterFirstOutcome = fs.readFileSync(storePath, 'utf8');

    const retryOutcome = await api('/visits/vis-101/outcome', {
      method: 'POST',
      body: JSON.stringify({ outcomeType: 'CONVERTED', samplesCount: 2, committedUnits: 3, clientVisitId: 'v12-idempotent-outcome-1' })
    });
    assert.equal(retryOutcome.response.status, 200, 'identical retry succeeds');
    assert.equal(retryOutcome.body.idempotent, true, 'identical retry returns original outcome');
    assert.equal(retryOutcome.body.data.outcomeRecord.id, firstOutcome.body.data.outcomeRecord.id, 'retry returns the original record');
    assert.equal(fs.readFileSync(storePath, 'utf8'), stateAfterFirstOutcome, 'idempotent retry has no duplicate side effects');

    const distinctOutcome = await api('/visits/vis-101/outcome', {
      method: 'POST',
      body: JSON.stringify({ outcomeType: 'CONVERTED', committedUnits: 1, clientVisitId: 'v12-idempotent-outcome-2' })
    });
    assert.equal(distinctOutcome.response.status, 200, 'different clientVisitId creates a distinct valid outcome');
    assert.notEqual(distinctOutcome.body.data.outcomeRecord.id, firstOutcome.body.data.outcomeRecord.id);

    const updatedInventory = await api('/samples/inventory');
    assert.equal(updatedInventory.body.data[0].quantityOnHand, 98, 'outcome sample issue debits inventory once');
    assert.equal(updatedInventory.body.transactions[0].quantity, 2, 'sample issue is recorded in the ledger');
    assert.equal(updatedInventory.body.transactions.length, 1, 'retry and non-sample outcome do not duplicate sample ledger entries');

    const pacing = await api('/targets/monthly?month=2026-09');
    assert.equal(pacing.body.data.achievedUnits, 4, 'distinct committed outcome units update monthly achieved units exactly once each');
    assert.equal(pacing.body.data.pacingPercent, 40);

    const timeline = await api('/doctors/doc-1/timeline');
    assert.equal(timeline.response.status, 200);
    assert(timeline.body.data.some((event: { type: string }) => event.type === 'OUTCOME'));
    assert(timeline.body.data.some((event: { type: string }) => event.type === 'SAMPLE'));

    const lifecycle = await api('/doctors/doc-1/lifecycle');
    const automatic = lifecycle.body.data.history.find((event: { source: string }) => event.source === 'AUTOMATIC');
    assert.equal(automatic.previousStatus, 'TRIAL', 'automatic lifecycle records the status immediately before transition');
    assert.equal(automatic.status, 'ADOPTER');
    assert(automatic.reason && automatic.recordedAt, 'automatic lifecycle history includes reason and timestamp');

    const manual = await api('/doctors/doc-1/lifecycle/override', { method: 'POST', body: JSON.stringify({ status: 'DORMANT', reason: 'v1.2 lifecycle test' }) });
    assert.equal(manual.response.status, 200);
    const manualHistory = manual.body.data.history[0];
    assert.deepEqual(
      { previousStatus: manualHistory.previousStatus, status: manualHistory.status, source: manualHistory.source },
      { previousStatus: 'ADOPTER', status: 'DORMANT', source: 'MANUAL_OVERRIDE' },
      'manual lifecycle records the immediate prior status and source'
    );
    assert(manualHistory.reason && manualHistory.recordedAt, 'manual lifecycle history includes reason and timestamp');

    const briefing = await api('/briefing');
    assert.equal(briefing.response.status, 200);
    assert.equal(briefing.body.data.operationalMetrics.monthlyAchieved, 4);
    console.log('✅ v1.2 specification tests passed');
  } finally {
    fs.writeFileSync(storePath, originalStore);
    await api('/system/reload-store', { method: 'POST' });
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
