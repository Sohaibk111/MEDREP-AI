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

    const outcome = await api('/visits/vis-101/outcome', {
      method: 'POST',
      body: JSON.stringify({ outcomeType: 'TRIAL_STARTED', samplesCount: 2, committedUnits: 3, notes: 'v1.2 specification exercise' })
    });
    assert.equal(outcome.response.status, 200);

    const updatedInventory = await api('/samples/inventory');
    assert.equal(updatedInventory.body.data[0].quantityOnHand, 98, 'outcome sample issue debits inventory');
    assert.equal(updatedInventory.body.transactions[0].quantity, 2, 'sample issue is recorded in the ledger');

    const pacing = await api('/targets/monthly?month=2026-09');
    assert.equal(pacing.body.data.achievedUnits, 3, 'committed outcome units update monthly achieved units');
    assert.equal(pacing.body.data.pacingPercent, 30);

    const timeline = await api('/doctors/doc-1/timeline');
    assert.equal(timeline.response.status, 200);
    assert(timeline.body.data.some((event: { type: string }) => event.type === 'OUTCOME'));
    assert(timeline.body.data.some((event: { type: string }) => event.type === 'SAMPLE'));

    const briefing = await api('/briefing');
    assert.equal(briefing.response.status, 200);
    assert.equal(briefing.body.data.operationalMetrics.monthlyAchieved, 3);
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
