import { EVOCHECK_MASTER_KNOWLEDGE, queryEvoCheckSpecification, getVerifiedEvoCheckAIContext } from '../src/data/productKnowledge';

console.log('================================================================');
console.log('🧪 RUNNING MEDREP AI EVOCHECK COMPREHENSIVE REGRESSION SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

// 1. Core Technical Specifications
console.log('\n--- 1. CORE TECHNICAL SPECIFICATIONS ---');
assert(EVOCHECK_MASTER_KNOWLEDGE.core_specifications.mard.value === 8.66, 'MARD must equal 8.66%');
assert(EVOCHECK_MASTER_KNOWLEDGE.core_specifications.wear_duration.value === 15, 'Sensor wear duration must equal 15 days');
assert(EVOCHECK_MASTER_KNOWLEDGE.core_specifications.water_resistance.value === 'IP68', 'Water resistance must equal IP68');
assert(EVOCHECK_MASTER_KNOWLEDGE.core_specifications.reading_interval.value === 1, 'Reading interval must equal 1 minute');
assert(EVOCHECK_MASTER_KNOWLEDGE.core_specifications.connectivity.value.includes('BLE') || EVOCHECK_MASTER_KNOWLEDGE.core_specifications.connectivity.value.includes('Bluetooth Low Energy'), 'Connectivity must be Bluetooth Low Energy (BLE)');
assert(EVOCHECK_MASTER_KNOWLEDGE.regulatory_status === 'DRAP_APPROVED', 'Regulatory status must be DRAP_APPROVED');

// 2. Commercial Pricing Synchronization
console.log('\n--- 2. COMMERCIAL PRICING & VISIBILITY ---');
assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.distributor_price?.amount === 12900, 'Distributor price amount must equal PKR 12,900');
assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.distributor_price?.pricing_type === 'DISTRIBUTOR_PRICE', 'Distributor price pricing_type must be DISTRIBUTOR_PRICE');
assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.distributor_price?.visibility === 'INTERNAL', 'Distributor price visibility must be INTERNAL');
assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.distributor_price?.verification_status === 'VERIFIED', 'Distributor price verification_status must be VERIFIED');
assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.distributor_price?.source_type === 'COMPANY_FIELD_DATA', 'Distributor price source_type must be COMPANY_FIELD_DATA');

assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.public_retail_price?.amount === 13600, 'Public retail sale price must equal PKR 13,600');
assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.public_retail_price?.regular_amount === 17000, 'Public retail regular price must equal PKR 17,000');
assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.public_retail_price?.pricing_type === 'PUBLIC_RETAIL_PRICE', 'Public retail price pricing_type must be PUBLIC_RETAIL_PRICE');
assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.public_retail_price?.visibility === 'PUBLIC', 'Public retail price visibility must be PUBLIC');
assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.public_retail_price?.verification_status === 'WEB_VERIFIED', 'Public retail price verification_status must be WEB_VERIFIED');

assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.institutional_price?.status === 'NOT_CONFIGURED', 'Institutional pricing status must be NOT_CONFIGURED');

// 3. Negative Guardrails & Anti-Leakage
console.log('\n--- 3. NEGATIVE GUARDRAILS & ANTI-LEAKAGE ---');
const activeClaims = EVOCHECK_MASTER_KNOWLEDGE.verified_claims;
const hasLegacyMARD = activeClaims.some(c => c.claim_text.includes('8.8%'));
const hasLegacyWear = activeClaims.some(c => c.claim_text.includes('14-day wear') && !c.claim_text.toLowerCase().includes('competitor') && !c.claim_text.toLowerCase().includes('alternative'));
const hasLegacyIP = activeClaims.some(c => c.claim_text.includes('IP28'));
const hasLegacyPrice = activeClaims.some(c => c.claim_text.includes('12,500') || c.claim_text.includes('12500'));

assert(!hasLegacyMARD, 'Zero active verified claims cite legacy 8.8% MARD');
assert(!hasLegacyWear, 'Zero active verified claims cite legacy 14-day wear for EvoCheck');
assert(!hasLegacyIP, 'Zero active verified claims cite legacy IP28');
assert(!hasLegacyPrice, 'Zero active verified claims cite legacy PKR 12,500');

// Check quarantined claim
const quarantined12500 = EVOCHECK_MASTER_KNOWLEDGE.quarantined_claims.find(c => c.claim_id === 'CLM-QUAR-004');
assert(!!quarantined12500 && quarantined12500.is_quarantined === true && quarantined12500.verification_status === 'QUARANTINED', 'Obsolete PKR 12,500 claim is safely quarantined in CLM-QUAR-004');

// 4. Query Engine Retrieval & Fallback Behavior
console.log('\n--- 4. QUERY ENGINE RETRIEVAL & FALLBACKS ---');
const qDist = queryEvoCheckSpecification('distributor_price');
assert(qDist.found && qDist.value?.includes('12,900'), 'Query distributor_price returns PKR 12,900');

const qPublic = queryEvoCheckSpecification('retail_price');
assert(qPublic.found && qPublic.value?.includes('13,600'), 'Query retail_price returns PKR 13,600');

const qMARD = queryEvoCheckSpecification('mard');
assert(qMARD.found && qMARD.value?.includes('8.66%'), 'Query mard returns 8.66%');

const qWear = queryEvoCheckSpecification('wear');
assert(qWear.found && qWear.value?.includes('15 days'), 'Query wear returns 15 days');

const qWater = queryEvoCheckSpecification('water');
assert(qWater.found && qWater.value?.includes('IP68'), 'Query water returns IP68');

const qUnsupported = queryEvoCheckSpecification('unsupported_fictional_feature');
assert(!qUnsupported.found && qUnsupported.message?.includes('not currently available in the verified MedRep AI knowledge base'), 'Unsupported query returns strict required fallback');

// 5. Context Prompt Generation
console.log('\n--- 5. AI CONTEXT PROMPT GENERATION ---');
const aiContext = getVerifiedEvoCheckAIContext();
assert(aiContext.includes('8.66%'), 'AI context contains 8.66% MARD');
assert(aiContext.toLowerCase().includes('15 days') || aiContext.toLowerCase().includes('15-day'), 'AI context contains 15 days wear duration');
assert(aiContext.includes('IP68'), 'AI context contains IP68');
assert(aiContext.includes('PKR 12,900'), 'AI context contains PKR 12,900 distributor price');
assert(aiContext.includes('PKR 13,600'), 'AI context contains PKR 13,600 public online price');
assert(aiContext.includes('NOT_CONFIGURED'), 'AI context explicitly states institutional price is NOT_CONFIGURED');
assert(aiContext.includes('This EvoCheck specification is not currently available in the verified MedRep AI knowledge base'), 'AI context contains standard fallback response guideline');

console.log('\n================================================================');
console.log(`🏁 REGRESSION SUITE COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests/totalTests)*100).toFixed(1)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
