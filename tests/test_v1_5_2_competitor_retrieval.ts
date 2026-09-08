import assert from 'node:assert/strict';
import {
  buildCompetitorGroundingContext,
  getCompetitorRecord,
  retrieveCompetitors
} from '../src/services/competitorIntelligence';

function run() {
  const libre = retrieveCompetitors('Compare EvoCheck with Abbott FreeStyle Libre');
  assert.equal(libre.matchedCompetitors.length, 1, 'Libre query resolves exactly one competitor');
  assert.equal(libre.matchedCompetitors[0].productId, 'abbott-freestyle-libre');
  assert.equal(libre.matchedCompetitors[0].facts.mardPercent.status, 'USER_PROVIDED');

  const sibionics = retrieveCompetitors('SIBIONICS CGM accuracy and wear duration');
  assert.equal(sibionics.matchedCompetitors.length, 1, 'SIBIONICS query resolves exactly one competitor');
  assert.equal(sibionics.matchedCompetitors[0].facts.wearDurationDays.value, 14);

  const multi = retrieveCompetitors('Compare Abbott, SIBIONICS and iCan i3');
  assert.deepEqual(
    multi.matchedCompetitors.map(record => record.productId),
    ['abbott-freestyle-libre', 'sibionics-cgm', 'ican-sinocare'],
    'multi-competitor retrieval is deterministic'
  );

  const unknown = retrieveCompetitors('Dexcom G7');
  assert.equal(unknown.matchedCompetitors.length, 0, 'unknown competitor is not invented');

  const grounding = buildCompetitorGroundingContext('Compare EvoCheck with Abbott FreeStyle Libre');
  assert.deepEqual(grounding.matchedCompetitorIds, ['abbott-freestyle-libre']);
  assert(grounding.context.includes('[USER_PROVIDED]'), 'grounding preserves provenance status');
  assert(grounding.context.includes('Do not invent a missing competitor specification.'), 'guardrail is present');
  assert(grounding.context.includes('No unsupported claim of overall clinical superiority'), 'comparison guardrail is preserved');

  const unknownGrounding = buildCompetitorGroundingContext('Dexcom G7');
  assert(unknownGrounding.context.includes('No controlled competitor record matched the query.'));
  assert(unknownGrounding.context.includes('Do not invent competitor facts'));

  const record = getCompetitorRecord('ican-sinocare');
  assert(record, 'direct competitor lookup works');
  assert.equal(record?.facts.pricePKR.status, 'UNKNOWN');

  console.log('v1.5.2 competitor retrieval tests passed: 7/7');
}

run();
