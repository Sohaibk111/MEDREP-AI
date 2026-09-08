import assert from 'node:assert/strict';
import {
  buildSafeCompetitorFallback,
  sanitizeCompetitorGeneratedText,
  validateCompetitorGeneratedText
} from '../src/services/competitorClaimGuard';

const verifiedLibre1 = '[FACT] FreeStyle Libre 1 uses NFC scanning and has IP27 water resistance.';
const verifiedLibre1Result = validateCompetitorGeneratedText(verifiedLibre1);
assert.equal(verifiedLibre1Result.safe, true, 'verified Libre 1 NFC/IP27 claims are allowed');

const wrongLibre1Ip = '[FACT] FreeStyle Libre 1 has IP68 water resistance.';
const wrongLibre1IpResult = validateCompetitorGeneratedText(wrongLibre1Ip);
assert.equal(wrongLibre1IpResult.safe, false);
assert.ok(wrongLibre1IpResult.violations.some(v => v.includes('conflicts with controlled value')));

const wrongLibre1Connectivity = '[FACT] FreeStyle Libre 1 continuously broadcasts glucose over Bluetooth without scanning.';
const wrongLibre1ConnectivityResult = validateCompetitorGeneratedText(wrongLibre1Connectivity);
assert.equal(wrongLibre1ConnectivityResult.safe, false);
assert.ok(wrongLibre1ConnectivityResult.violations.some(v => v.includes('Libre 1')));

const unknownLibre1Mard = '[FACT] FreeStyle Libre 1 has 9.2% MARD.';
const unknownLibre1MardResult = validateCompetitorGeneratedText(unknownLibre1Mard);
assert.equal(unknownLibre1MardResult.safe, false);
assert.ok(unknownLibre1MardResult.violations.some(v => v.includes('MARD')));

const verifiedLibre2 = '[FACT] FreeStyle Libre 2 has 9.2% adult MARD, 14-day wear and IP27 water resistance.';
const verifiedLibre2Result = validateCompetitorGeneratedText(verifiedLibre2);
assert.equal(verifiedLibre2Result.safe, true, 'verified Libre 2 claims are allowed');

const sibionicsVerified = '[FACT] SIBIONICS GS1 has 8.83% adult MARD, 14-day wear, IP28 water resistance and 5-minute updates.';
assert.equal(validateCompetitorGeneratedText(sibionicsVerified).safe, true);

const icanVerified = '[FACT] iCan i3 has 8.71% adult MARD, 15-day wear, IP28 water resistance and 3-minute monitoring.';
assert.equal(validateCompetitorGeneratedText(icanVerified).safe, true);

const unknownSibionicsPrice = '[FACT] SIBIONICS GS1 costs PKR 13,700 in Pakistan.';
const unknownSibionicsPriceResult = validateCompetitorGeneratedText(unknownSibionicsPrice);
assert.equal(unknownSibionicsPriceResult.safe, false);
assert.ok(unknownSibionicsPriceResult.violations.some(v => v.includes('Pakistan price')));

const unqualifiedEvoCheckPrice = '[FACT] EvoCheck costs PKR 12,900.';
assert.equal(validateCompetitorGeneratedText(unqualifiedEvoCheckPrice).safe, false);

const evoCheckDistributionPrice = '[FACT] EvoCheck patient price via distribution is PKR 12,900.';
assert.equal(validateCompetitorGeneratedText(evoCheckDistributionPrice).safe, true);

const wrongEvoCheckChannel = '[FACT] EvoCheck online price is PKR 12,900.';
const wrongEvoCheckChannelResult = validateCompetitorGeneratedText(wrongEvoCheckChannel);
assert.equal(wrongEvoCheckChannelResult.safe, false);
assert.ok(wrongEvoCheckChannelResult.violations.some(v => v.includes('online price')));

const unknownCompetitorPrice = '[FACT] Dexcom G7 costs PKR 18,000 in Pakistan.';
const unknownCompetitorPriceResult = validateCompetitorGeneratedText(unknownCompetitorPrice);
assert.equal(unknownCompetitorPriceResult.safe, false);
assert.ok(unknownCompetitorPriceResult.violations.some(v => v.includes('Unknown competitor pricing')));

const wrongSibionicsPatientPrice = '[FACT] SIBIONICS GS1 patient price is PKR 14,000 [USER_PROVIDED].';
const wrongSibionicsPatientPriceResult = validateCompetitorGeneratedText(wrongSibionicsPatientPrice);
assert.equal(wrongSibionicsPatientPriceResult.safe, false);
assert.ok(wrongSibionicsPatientPriceResult.violations.some(v => v.includes('patient price')));

const wrongSibionicsOnlinePrice = '[FACT] SIBIONICS GS1 online price is PKR 12,600 [USER_PROVIDED].';
const wrongSibionicsOnlinePriceResult = validateCompetitorGeneratedText(wrongSibionicsOnlinePrice);
assert.equal(wrongSibionicsOnlinePriceResult.safe, false);
assert.ok(wrongSibionicsOnlinePriceResult.violations.some(v => v.includes('online price')));

const unqualifiedSibionicsPrice = '[FACT] SIBIONICS GS1 costs PKR 14,000.';
assert.equal(validateCompetitorGeneratedText(unqualifiedSibionicsPrice).safe, false);

const sibionicsRetailPrice = '[FACT] SIBIONICS GS1 retail price is PKR 14,000.';
assert.equal(validateCompetitorGeneratedText(sibionicsRetailPrice).safe, true);

const sibionicsDistributionPrice = '[FACT] SIBIONICS GS1 patient price via distribution is PKR 12,600.';
assert.equal(validateCompetitorGeneratedText(sibionicsDistributionPrice).safe, true);

const controlledSibionicsPrices = '[FACT] SIBIONICS GS1 retail price is PKR 14,000 [USER_PROVIDED], while patient price via distribution is PKR 12,600 [USER_PROVIDED].';
assert.equal(validateCompetitorGeneratedText(controlledSibionicsPrices).safe, true);

const userProvidedLibre1Price = '[FACT] FreeStyle Libre 1 costs PKR 16,500.';
const userProvidedLibre1PriceResult = validateCompetitorGeneratedText(userProvidedLibre1Price);
assert.equal(userProvidedLibre1PriceResult.safe, true, 'controlled USER_PROVIDED pricing does not require an internal label in final text');

const qualifiedUserProvidedLibre1Price = '[FACT] FreeStyle Libre 1 costs PKR 16,500 [USER_PROVIDED].';
assert.equal(validateCompetitorGeneratedText(qualifiedUserProvidedLibre1Price).safe, true);

const safeUnknownCompetitor = '[FACT] EvoCheck has 15-day wear.';
const safeUnknownResult = sanitizeCompetitorGeneratedText('Compare EvoCheck with Dexcom', safeUnknownCompetitor, []);
assert.equal(safeUnknownResult.safe, true);
assert.equal(safeUnknownResult.text, safeUnknownCompetitor);

const safeMatchedCompetitor = '[FACT] EvoCheck has 15-day wear. FreeStyle Libre 2 has 9.2% adult MARD.';
const safeMatchedResult = sanitizeCompetitorGeneratedText('Compare EvoCheck with FreeStyle Libre 2', safeMatchedCompetitor, ['abbott-freestyle-libre-2']);
assert.equal(safeMatchedResult.safe, true);
assert.equal(safeMatchedResult.text, safeMatchedCompetitor);

const fallback = buildSafeCompetitorFallback('Compare EvoCheck with Libre 1', ['abbott-freestyle-libre-1']);
assert.match(fallback, /14 \[VERIFIED\]/i);
assert.match(fallback, /IP27 \[VERIFIED\]/i);
assert.match(fallback, /MARD/i);

console.log('v1.5.3 competitor claim guard: 24/24 passed');
