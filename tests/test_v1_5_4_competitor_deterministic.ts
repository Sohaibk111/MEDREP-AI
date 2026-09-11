import assert from 'node:assert/strict';
import { sanitizeCompetitorGeneratedText } from '../src/services/competitorClaimGuard';

const libre1Mard = sanitizeCompetitorGeneratedText(
  'What is the MARD of FreeStyle Libre 1 only?',
  'Libre 1 has MARD 9.2%.',
  ['abbott-freestyle-libre-1']
);
assert.equal(libre1Mard.safe, true);
assert.match(libre1Mard.text, /11\.4%/);
assert.doesNotMatch(libre1Mard.text, /9\.2%/);

const libre2Mard = sanitizeCompetitorGeneratedText(
  'What is the MARD of FreeStyle Libre 2 only?',
  'Libre 2 has MARD 11.4%.',
  ['abbott-freestyle-libre-2']
);
assert.equal(libre2Mard.safe, true);
assert.match(libre2Mard.text, /9\.2%/);

const libre1Comparison = sanitizeCompetitorGeneratedText(
  'Compare EvoCheck with FreeStyle Libre 1',
  'EvoCheck vs Libre 1: Libre 2 MARD 9.2%, IP68.',
  ['abbott-freestyle-libre-1']
);
assert.equal(libre1Comparison.safe, true);
assert.match(libre1Comparison.text, /11\.4%/);
assert.match(libre1Comparison.text, /IP27/);
assert.match(libre1Comparison.text, /15 days/);
assert.doesNotMatch(libre1Comparison.text, /Libre 2/);

const sibionicsComparison = sanitizeCompetitorGeneratedText(
  'Compare EvoCheck with SIBIONICS',
  'EvoCheck vs SIBIONICS.',
  ['sibionics-gs1']
);
assert.equal(sibionicsComparison.safe, true);
assert.match(sibionicsComparison.text, /SIBIONICS GS1/);
assert.match(sibionicsComparison.text, /8\.83%/);
assert.match(sibionicsComparison.text, /15 days/);
assert.doesNotMatch(sibionicsComparison.text, /Libre/);

const sibionicsPrice = sanitizeCompetitorGeneratedText(
  'What is the SIBIONICS price?',
  'SIBIONICS costs PKR 13,700.',
  ['sibionics-gs1']
);
assert.equal(sibionicsPrice.safe, true);
assert.match(sibionicsPrice.text, /PKR 14,000/);
assert.match(sibionicsPrice.text, /PKR 12,600/);

console.log('v1.5.4 deterministic competitor response: 5/5 passed');
