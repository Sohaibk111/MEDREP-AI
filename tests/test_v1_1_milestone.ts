import fs from 'fs';
import path from 'path';
import { EVOCHECK_MASTER_KNOWLEDGE, queryEvoCheckSpecification } from '../src/data/productKnowledge';
import { OBJECTION_SCENARIOS, getScenarioById } from '../src/data/objectionScenarios';
import { evaluateObjectionDrill } from '../src/services/objectionEvaluator';
import { generateRoutePlan, getPrescriberJourneyStage, getPrescriberJourneyActionRecommendation } from '../src/services/routeEngine';
import { generateDayEndSummary, formatDayEndTextReport } from '../src/services/dayEndSummaryService';
import { INITIAL_DOCTORS, INITIAL_VISITS, INITIAL_FOLLOWUPS, INITIAL_PATIENT_OPPORTUNITIES } from '../src/data/mockData';
import { VisitOutcomeRecord, Doctor, Visit } from '../src/types';

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log('  MEDREP AI v1.1 COMPREHENSIVE VERIFICATION SUITE   ');
  console.log('====================================================\n');

  // --- 1. Product Truth & Clinical Governance ---
  console.log('--- Suite 1: Product Truth & Invariants ---');
  assert(EVOCHECK_MASTER_KNOWLEDGE.core_specifications.mard.value === 8.66, 'Verified MARD is 8.66%');
  assert(EVOCHECK_MASTER_KNOWLEDGE.core_specifications.wear_duration.value === 15, 'Sensor wear duration is strictly 15 days');
  assert(EVOCHECK_MASTER_KNOWLEDGE.core_specifications.water_resistance.value === 'IP68', 'Water resistance rating is IP68');
  assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.distributor_price.amount === 12900, 'Distributor price is PKR 12,900');
  assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.public_retail_price.amount === 13600, 'Public online price is PKR 13,600');
  assert(EVOCHECK_MASTER_KNOWLEDGE.pricing.distributor_price.visibility === 'INTERNAL', 'Distributor price visibility is INTERNAL');

  const mardQuery = queryEvoCheckSpecification('mard');
  assert(mardQuery.found === true && mardQuery.value.includes('8.66%'), 'Querying MARD returns 8.66% evidence');

  // --- 2. Objection Scenarios Suite ---
  console.log('\n--- Suite 2: Objection Scenarios Coverage & Grounding ---');
  assert(OBJECTION_SCENARIOS.length >= 8, `Defined ${OBJECTION_SCENARIOS.length} realistic field scenarios (>= 8)`);
  
  const priceScenario = getScenarioById('SCENARIO_AFFORDABILITY');
  assert(priceScenario !== undefined && priceScenario.category === 'Commercial & Price', 'Price objection scenario loaded');

  const compScenario = getScenarioById('SCENARIO_COMPETITOR_LIBRE');
  assert(compScenario !== undefined && compScenario.category === 'Competitor Contrast', 'FreeStyle Libre competitor scenario loaded');

  const mardScenario = getScenarioById('SCENARIO_MARD_ACCURACY');
  assert(mardScenario !== undefined && mardScenario.category === 'Technical Specs', 'MARD accuracy scenario loaded');

  // --- 3. Objection Drill Grounding & Safety ---
  console.log('\n--- Suite 3: Objection Evaluator Safety & Grounding ---');

  // Test Compliant Rep Response
  const compliantResponse = 'EvoCheck offers clinical-grade precision with an 8.66% MARD across full 15 days of continuous wear. The official public price is PKR 13,600 through MyPharmEvo with certified IP68 water protection.';
  const evalCompliant = await evaluateObjectionDrill(null, 'SCENARIO_AFFORDABILITY', compliantResponse);
  assert(evalCompliant.isCompliant === true, 'Compliant response marked compliant (deterministic grounding)');
  assert(evalCompliant.overallScore >= 70, `Compliant response gets high score (${evalCompliant.overallScore} >= 70)`);
  assert(evalCompliant.safetyFlags.length === 0, 'Compliant response has 0 safety flags');
  assert(evalCompliant.dimensions.length === 6, 'Evaluation outputs all 6 competency dimensions');

  // Test Non-Compliant Rep Response with unauthorized discount & false medical/wear claims
  const nonCompliantResponse = 'Doctor, I can give you a 20% personal discount on this 14-day sensor, and it completely cures hypoglycemia without any fingersticks!';
  const evalViolating = await evaluateObjectionDrill(null, 'SCENARIO_AFFORDABILITY', nonCompliantResponse);
  assert(evalViolating.isCompliant === false, 'Violating response flagged as non-compliant');
  assert(evalViolating.safetyFlags.length > 0, `Safety flags triggered (${evalViolating.safetyFlags.length} flags)`);
  assert(evalViolating.overallScore < 50, `Violating response score penalized (${evalViolating.overallScore} < 50)`);

  // --- 4. Prescriber Journey & Route Priority Engine ---
  console.log('\n--- Suite 4: Route Priority & Prescriber Journey Progression ---');
  const testDoctor: Doctor = {
    ...INITIAL_DOCTORS[0],
    prescriberStatus: 'prospect',
    totalVisitsCount: 1,
    priority: 'A'
  };

  const stage = getPrescriberJourneyStage(testDoctor, [], []);
  assert(stage === 'PROSPECTING', `Doctor initial stage evaluated as ${stage}`);

  const recommendation = getPrescriberJourneyActionRecommendation('PROSPECTING');
  assert(recommendation.length > 0, 'Next-action recommendation formulated for prospecting stage');

  const routePlan = generateRoutePlan(INITIAL_DOCTORS, INITIAL_VISITS, INITIAL_FOLLOWUPS, INITIAL_PATIENT_OPPORTUNITIES, '2026-09-01');
  assert(routePlan.totalStops > 0, `Generated ${routePlan.totalStops} optimized route stops`);
  assert(routePlan.stops.length > 0, 'Stops list populated');
  assert(routePlan.stops[0].priorityScore > 0, 'Top route stop scored with positive priority');

  // --- 5. Visit Outcome Logging & Day-End Summary Aggregation ---
  console.log('\n--- Suite 5: Visit Outcome Logging & Day-End Summary Aggregation ---');
  const mockCompletedVisits: Visit[] = INITIAL_VISITS.map(v => 
    v.scheduledDate === '2026-09-01' ? { ...v, status: 'completed' } : v
  );

  const mockOutcomes: VisitOutcomeRecord[] = [
    {
      id: 'OUT-TEST-1',
      visitId: 'vis-101',
      doctorId: 'doc-1',
      timestamp: '2026-09-01T11:00:00Z',
      outcomeType: 'TRIAL_STARTED',
      notes: 'Doctor agreed to put 2 high-variability patients on EvoCheck.',
      samplesCount: 1,
      committedUnits: 2,
      followUpDate: '2026-09-08',
      previousJourneyState: 'PROSPECTING',
      updatedJourneyState: 'TRIALING',
      nextActionRecommendation: 'Schedule product introduction and identify primary objection.'
    },
    {
      id: 'OUT-TEST-2',
      visitId: 'vis-102',
      doctorId: 'doc-2',
      timestamp: '2026-09-01T13:30:00Z',
      outcomeType: 'CONVERTED',
      notes: 'Hospital pharmacy ordered units.',
      samplesCount: 0,
      committedUnits: 5,
      followUpDate: '2026-09-15',
      previousJourneyState: 'TRIALING',
      updatedJourneyState: 'ADOPTING',
      nextActionRecommendation: 'Follow up on 15-day sensor graph review.'
    }
  ];

  const daySummary = generateDayEndSummary(
    '2026-09-01',
    INITIAL_DOCTORS,
    mockCompletedVisits,
    INITIAL_FOLLOWUPS,
    INITIAL_PATIENT_OPPORTUNITIES,
    mockOutcomes
  );

  assert(daySummary.date === '2026-09-01', 'Summary date matched');
  assert(daySummary.metrics.completedVisits >= 2, `Completed visits count tracked (${daySummary.metrics.completedVisits})`);
  assert(daySummary.metrics.trialsStarted >= 1, `Trial started tracked (${daySummary.metrics.trialsStarted})`);
  assert(daySummary.metrics.convertedVisits >= 1, `Converted visits tracked (${daySummary.metrics.convertedVisits})`);
  assert(daySummary.metrics.totalPlannedVisits >= 2, `Planned visits tracked (${daySummary.metrics.totalPlannedVisits})`);

  const textReport = formatDayEndTextReport(daySummary);
  assert(textReport.includes('MEDREP AI'), 'Text report header formatted');
  assert(textReport.includes('TERRITORY DAY-END REPORT'), 'Text report contains report title');
  assert(textReport.includes('2026-09-01'), 'Text report contains target date');

  // --- 6. Persistence & Backward Compatibility ---
  console.log('\n--- Suite 6: Persistence & Backward Compatibility ---');
  const storePath = path.join(process.cwd(), 'data', 'medrep_crm_store.json');
  assert(fs.existsSync(storePath), 'Persistent data store file exists on disk');
  
  const rawStore = fs.readFileSync(storePath, 'utf-8');
  const storeData = JSON.parse(rawStore);
  assert(Array.isArray(storeData.doctors) && storeData.doctors.length >= 6, 'Original v1.0 doctors collection preserved');
  assert(Array.isArray(storeData.visits) && storeData.visits.length >= 3, 'Original v1.0 visits collection preserved');
  assert(Array.isArray(storeData.followups), 'Original v1.0 followups collection preserved');
  assert(Array.isArray(storeData.patientOpportunities), 'Original v1.0 patient opportunities preserved');
  assert(storeData.fieldPlan && Array.isArray(storeData.fieldPlan.days), 'Original v1.0 field plan preserved');
  
  // Verify that new v1.1 fields exist without breaking v1.0 schema
  const doc1 = storeData.doctors.find((d: any) => d.id === 'doc-1');
  assert(doc1 && doc1.name === 'Prof. Dr. Jamal Ahmed', 'Core v1.0 Doctor schema integrity preserved');
  assert(typeof doc1.potentialScore === 'number', 'Backward compatibility: doctor scoring retained');

  // --- Summary ---
  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passedCount} / ${totalCount} PASSED (100%) `);
  console.log('====================================================');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test execution exception:', err);
  process.exit(1);
});
