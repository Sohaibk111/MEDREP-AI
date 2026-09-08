import assert from 'node:assert/strict';
import {
  buildSafeCompetitorFallback,
  sanitizeCompetitorGeneratedText,
  validateCompetitorGeneratedText
} from '../src/services/competitorClaimGuard';

const supported = '[FACT] EvoCheck has 15-day wear. FreeStyle Libre 1 is recorded at 14 days [USER_PROVIDED].';
const supportedResult = validateCompetitorGeneratedText(supported);
assert.equal(supportedResult.safe, true);
assert.deepEqual(supportedResult.violations, []);

const unsupportedLibre = '[FACT] EvoCheck uses BLE while FreeStyle Libre 1 requires manual NFC scanning and has IP27 water resistance.';
const unsupportedResult = sanitizeCompetitorGeneratedText(
  'Compare EvoCheck with FreeStyle Libre 1',
  unsupportedLibre,
  ['abbott-freestyle-libre']
);
assert.equal(unsupportedResult.safe, false);
assert.ok(unsupportedResult.violations.some(v => v.includes('connectivity')));
assert.ok(unsupportedResult.violations.some(v => v.includes('IP rating')));
assert.match(unsupportedResult.text, /does not currently contain verified information/i);
assert.doesNotMatch(unsupportedResult.text, /NFC|IP27|manual scanning/i);

const readerClaim = '[FACT] FreeStyle Libre requires a reader.';
const readerResult = validateCompetitorGeneratedText(readerClaim);
assert.equal(readerResult.safe, false);
assert.ok(readerResult.violations.some(v => v.includes('reader requirement')));

const unknownCompetitor = sanitizeCompetitorGeneratedText(
  'Compare EvoCheck with Dexcom',
  '[FACT] Dexcom has IP67 and requires NFC scanning.',
  []
);
assert.equal(unknownCompetitor.safe, true);
assert.match(unknownCompetitor.text, /No controlled competitor record matched/i);

const fallback = buildSafeCompetitorFallback('Compare EvoCheck with Libre', ['abbott-freestyle-libre']);
assert.match(fallback, /14 days \[USER_PROVIDED\]/);
assert.match(fallback, /MARD 9\.2% \[USER_PROVIDED\]/);
assert.match(fallback, /connectivity/);
assert.match(fallback, /IP rating\/water-resistance comparison/);

console.log('v1.5.3 competitor claim guard: 5/5 passed');
