import assert from 'node:assert/strict';
import {
  buildCompetitorGroundingContext,
  getCompetitorRecord,
  retrieveCompetitors
} from '../src/services/competitorIntelligence';

function run() {
  const libre1 = retrieveCompetitors('Compare EvoCheck with Abbott FreeStyle Libre 1');
  assert.equal(libre1.matchedCompetitors.length, 1, 'Libre 1 query resolves exactly one competitor');
  assert.equal(libre1.matchedCompetitors[0].productId, 'abbott-freestyle-libre-1');
  assert.equal(libre1.matchedCompetitors[0].facts.mardPercent.value, 11.4);
  assert.equal(libre1.matchedCompetitors[0].facts.mardPercent.status, 'VERIFIED');
  assert.equal(libre1.matchedCompetitors[0].facts.waterResistance.value, 'IP27');

  const libre2 = retrieveCompetitors('Compare EvoCheck with Abbott FreeStyle Libre 2');
  assert.equal(libre2.matchedCompetitors.length, 1, 'Libre 2 query resolves exactly one competitor');
  assert.equal(libre2.matchedCompetitors[0].productId, 'abbott-freestyle-libre-2');
  assert.equal(libre2.matchedCompetitors[0].facts.mardPercent.value, 9.2);
  assert.equal(libre2.matchedCompetitors[0].facts.mardPercent.status, 'VERIFIED');

  const sibionics = retrieveCompetitors('SIBIONICS GS1 accuracy and wear duration');
  assert.equal(sibionics.matchedCompetitors.length, 1, 'SIBIONICS query resolves exactly one competitor');
  assert.equal(sibionics.matchedCompetitors[0].productId, 'sibionics-gs1');
  assert.equal(sibionics.matchedCompetitors[0].facts.mardPercent.value, 8.83);
  assert.equal(sibionics.matchedCompetitors[0].facts.monitoringIntervalMinutes.value, 5);

  const evoDistribution = retrieveCompetitors('What is EvoCheck patient price via distribution?');
  assert.equal(evoDistribution.commercialPrices.length, 1);
  assert.equal(evoDistribution.commercialPrices[0].valuePKR, 12900);
  assert.equal(evoDistribution.commercialPrices[0].priceType, 'PATIENT');
  assert.equal(evoDistribution.commercialPrices[0].channel, 'DISTRIBUTION');

  const evoOnline = retrieveCompetitors('What is EvoCheck online price?');
  assert.equal(evoOnline.commercialPrices.length, 1);
  assert.equal(evoOnline.commercialPrices[0].valuePKR, 13600);
  assert.equal(evoOnline.commercialPrices[0].channel, 'ONLINE');

  const sibionicsRetail = retrieveCompetitors('What is SIBIONICS retail price?');
  assert.equal(sibionicsRetail.commercialPrices.length, 1);
  assert.equal(sibionicsRetail.commercialPrices[0].valuePKR, 14000);
  assert.equal(sibionicsRetail.commercialPrices[0].priceType, 'RETAIL');
  assert.equal(sibionicsRetail.commercialPrices[0].channel, 'UNKNOWN');

  const sibionicsDistribution = retrieveCompetitors('What is SIBIONICS patient price via distribution?');
  assert.equal(sibionicsDistribution.commercialPrices.length, 1);
  assert.equal(sibionicsDistribution.commercialPrices[0].valuePKR, 12600);
  assert.equal(sibionicsDistribution.commercialPrices[0].priceType, 'PATIENT');

  const ambiguousPricing = retrieveCompetitors('What is SIBIONICS price?');
  assert.equal(ambiguousPricing.pricingChannelRequired, true);
  assert.deepEqual(ambiguousPricing.commercialPrices.map(price => price.valuePKR), [14000, 12600]);

  const ican = retrieveCompetitors('Compare iCan i3 pricing and accuracy');
  assert.equal(ican.matchedCompetitors.length, 1, 'iCan query resolves exactly one competitor');
  assert.equal(ican.matchedCompetitors[0].productId, 'ican-sinocare-ican-i3');
  assert.equal(ican.matchedCompetitors[0].facts.pricePKR.status, 'MARKET_OBSERVED');

  const multi = retrieveCompetitors('Compare Abbott FreeStyle Libre 1, Libre 2, SIBIONICS GS1 and iCan i3');
  assert.deepEqual(
    multi.matchedCompetitors.map(record => record.productId),
    ['abbott-freestyle-libre-1', 'abbott-freestyle-libre-2', 'sibionics-gs1', 'ican-sinocare-ican-i3'],
    'multi-competitor retrieval is deterministic'
  );

  const unknown = retrieveCompetitors('Dexcom G7');
  assert.equal(unknown.matchedCompetitors.length, 0, 'unknown competitor is not invented');

  const grounding = buildCompetitorGroundingContext('Compare EvoCheck with Abbott FreeStyle Libre 2');
  assert.deepEqual(grounding.matchedCompetitorIds, ['abbott-freestyle-libre-2']);
  assert(grounding.context.includes('[VERIFIED]'), 'grounding preserves verified provenance');
  assert(grounding.context.includes('Never invent a missing competitor specification.'), 'guardrail is present');
  assert(grounding.context.includes('Do not compare MARD values across different product generations'), 'generation/MARD guardrail is present');

  const pricingGrounding = buildCompetitorGroundingContext('What is SIBIONICS price?');
  assert(pricingGrounding.context.includes('RETAIL: PKR 14000 [USER_PROVIDED]'));
  assert(pricingGrounding.context.includes('PATIENT / DISTRIBUTION: PKR 12600 [USER_PROVIDED]'));
  assert(pricingGrounding.context.includes('Channel context is required'));

  const libre2Grounding = buildCompetitorGroundingContext('Compare EvoCheck with Abbott FreeStyle Libre 2 pricing');
  assert(libre2Grounding.context.includes('Channel-specific commercial prices: No channel-specific commercial price stored.'));
  assert(libre2Grounding.context.includes('Pakistan market price observations: PKR 18975'));

  const unknownGrounding = buildCompetitorGroundingContext('Dexcom G7');
  assert(unknownGrounding.context.includes('No controlled competitor record matched the query.'));
  assert(unknownGrounding.context.includes('Do not invent competitor facts'));

  const record = getCompetitorRecord('ican-sinocare-ican-i3');
  assert(record, 'direct competitor lookup works');
  assert.equal(record?.facts.pricePKR.status, 'MARKET_OBSERVED');

  console.log('v1.5.2 competitor retrieval tests passed: 18/18');
}

run();
