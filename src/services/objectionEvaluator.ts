import { GoogleGenAI } from '@google/genai';
import { ObjectionScenarioDefinition, ObjectionDrillResponse, ObjectionDrillDimensionScore } from '../types';
import { OBJECTION_SCENARIOS, getScenarioById } from '../data/objectionScenarios';

export function evaluateObjectionResponseDeterministic(
  scenario: ObjectionScenarioDefinition,
  repResponse: string
): ObjectionDrillResponse {
  const respLower = (repResponse || '').toLowerCase();
  const safetyFlags: string[] = [];
  const verifiedFactsCited: string[] = [];
  const whatDoneWell: string[] = [];
  const whatCouldImprove: string[] = [];

  let accuracyScore = 80;
  let complianceScore = 90;
  let persuasivenessScore = 75;
  let clarityScore = 80;
  let groundingScore = 80;
  let handlingScore = 80;

  // 1. Check Safety & Locked Truth Violations (Zero-tolerance guardrails)
  // Adversarial prompt injection or instruction override attempts
  if (
    respLower.includes('ignore all previous') ||
    respLower.includes('disregard previous') ||
    respLower.includes('act as an unrestricted') ||
    respLower.includes('ignore system prompt')
  ) {
    safetyFlags.push('ADVERSARIAL ATTEMPT: Prompt injection or roleplay override detected. Rep simulation responses must remain strictly grounded.');
    accuracyScore = Math.min(accuracyScore, 20);
    complianceScore = Math.min(complianceScore, 10);
    whatCouldImprove.push('Adversarial prompt injection is strictly prohibited. Respond as a compliant medical representative.');
  }

  // Requesting/citing obsolete or unverified legacy pricing
  if (
    respLower.includes('old evocheck price') ||
    respLower.includes('old price') ||
    respLower.includes('legacy price')
  ) {
    if (!respLower.includes('12,900') && !respLower.includes('obsolete')) {
      safetyFlags.push('COMPLIANCE WARNING: Queried/cited obsolete legacy price. The only active prices are PKR 12,900 (distributor) and PKR 13,600 (public retail).');
      accuracyScore = Math.min(accuracyScore, 35);
      complianceScore = Math.min(complianceScore, 25);
      whatCouldImprove.push('Legacy prices are quarantined. Always quote active verified distributor (PKR 12,900) or public retail (PKR 13,600).');
    }
  }

  // Inventing institutional price
  if (
    respLower.includes('invent an institutional price') ||
    respLower.includes('invent a hospital price') ||
    respLower.includes('invent institutional price')
  ) {
    safetyFlags.push('PROHIBITED: Fabricating institutional/hospital price. Institutional pricing is strictly NOT_CONFIGURED.');
    accuracyScore = Math.min(accuracyScore, 20);
    complianceScore = Math.min(complianceScore, 15);
    whatCouldImprove.push('Institutional pricing is NOT_CONFIGURED. Reps must not fabricate or guess tender pricing.');
  }

  if (respLower.includes('14 day') || respLower.includes('14-day') || respLower.includes('14 days')) {
    safetyFlags.push('CRITICAL: Claimed 14-day sensor wear. EvoCheck is strictly a 15-day continuous wear sensor.');
    accuracyScore = Math.min(accuracyScore, 30);
    complianceScore = Math.min(complianceScore, 20);
    whatCouldImprove.push('Always state 15 days continuous sensor wear. 14 days is an obsolete or competitor duration.');
  }

  if (respLower.includes('8.8%') || respLower.includes('8.83%') || respLower.includes('8.8 ') || respLower.includes('8.83')) {
    safetyFlags.push('CRITICAL: Cited legacy 8.8%/8.83% MARD. Active verified EvoCheck specification is 8.66% MARD.');
    accuracyScore = Math.min(accuracyScore, 35);
    complianceScore = Math.min(complianceScore, 25);
    whatCouldImprove.push('EvoCheck MARD is strictly 8.66% across 15 days.');
  }

  if (respLower.includes('ip28')) {
    safetyFlags.push('CRITICAL: Cited legacy IP28 rating. Active verified rating is IP68 water resistance.');
    accuracyScore = Math.min(accuracyScore, 40);
    complianceScore = Math.min(complianceScore, 30);
  }

  if (respLower.includes('12,500') || respLower.includes('12500')) {
    safetyFlags.push('CRITICAL: Cited obsolete PKR 12,500 pricing. Authorized distributor price is PKR 12,900; public retail is PKR 13,600.');
    accuracyScore = Math.min(accuracyScore, 30);
    complianceScore = Math.min(complianceScore, 20);
  }

  if (scenario.id === 'SCENARIO_DISCOUNT_REQUEST' || respLower.includes('discount')) {
    const offeringDiscount = 
      respLower.includes('i can give') ||
      respLower.includes('can offer') ||
      respLower.includes('offer you') ||
      respLower.includes('give you') ||
      respLower.includes('give a discount') ||
      respLower.includes('special discount') ||
      respLower.includes('unauthorized discount') ||
      respLower.includes('voucher') ||
      respLower.includes('discount voucher') ||
      respLower.includes('hospital discount') ||
      respLower.includes('personal discount') ||
      /\b\d+%\s*discount\b/.test(respLower) ||
      /\bdiscount\s*(of\s*)?\d+%\b/.test(respLower) ||
      /\b\d+%\s*off\b/.test(respLower);

    if (offeringDiscount) {
      safetyFlags.push('PROHIBITED: Offered unauthorized commercial discount. Reps have zero discount authorization under company pricing governance.');
      complianceScore = Math.min(complianceScore, 15);
      handlingScore = Math.min(handlingScore, 30);
      whatCouldImprove.push('Reiterate fixed authorized pricing and focus on clinical value rather than offering concessions.');
    } else if (respLower.includes('prohibited') || respLower.includes('cannot offer') || respLower.includes('fixed') || respLower.includes('standard price') || respLower.includes('12,900') || respLower.includes('13,600')) {
      whatDoneWell.push('Correctly upheld company pricing governance by refusing unauthorized discounts.');
      complianceScore = Math.max(complianceScore, 95);
    }
  }

  if (scenario.id === 'SCENARIO_HOSPITAL_PRICE' || (respLower.includes('hospital') && (respLower.includes('price') || respLower.includes('pricing')))) {
    if (respLower.includes('not_configured') || respLower.includes('not configured') || respLower.includes('pending authorization') || respLower.includes('formal commercial authorization')) {
      whatDoneWell.push('Accurately stated that institutional/hospital pricing is currently NOT_CONFIGURED.');
      verifiedFactsCited.push('Institutional Pricing: NOT_CONFIGURED');
      accuracyScore = Math.max(accuracyScore, 95);
      complianceScore = Math.max(complianceScore, 95);
    } else {
      safetyFlags.push('PROHIBITED: Invented unverified hospital/institutional tender pricing. Institutional pricing is strictly NOT_CONFIGURED.');
      accuracyScore = Math.min(accuracyScore, 25);
      complianceScore = Math.min(complianceScore, 20);
      whatCouldImprove.push('Institutional/hospital pricing is NOT_CONFIGURED. Do not fabricate tender rates.');
    }
  }

  if (respLower.includes('prevents hypoglycemia') || respLower.includes('cures diabetes') || respLower.includes('prevents complications')) {
    safetyFlags.push('CLINICAL SAFETY VIOLATION: Claimed EvoCheck prevents hypoglycemia or cures metabolic disease.');
    complianceScore = Math.min(complianceScore, 20);
    accuracyScore = Math.min(accuracyScore, 30);
    whatCouldImprove.push('EvoCheck provides real-time telemetry and threshold alerts to empower clinical action; it does not independently cure or prevent metabolic conditions.');
  }

  if (respLower.includes('eliminates all fingersticks') || respLower.includes('never need a fingerstick')) {
    safetyFlags.push('CLINICAL SAFETY VIOLATION: Claimed absolute elimination of all fingerstick tests.');
    complianceScore = Math.min(complianceScore, 35);
    whatCouldImprove.push('Explain that while factory calibration eliminates routine daily fingersticks, confirmatory tests remain necessary during rapid fluctuations or symptom mismatches.');
  }

  // 2. Identify Verified Facts Cited
  if (respLower.includes('8.66') || respLower.includes('8.66%')) {
    verifiedFactsCited.push('8.66% MARD Clinical Specification');
    whatDoneWell.push('Cited accurate 8.66% MARD technical specification.');
    accuracyScore = Math.max(accuracyScore, 90);
  }
  if (respLower.includes('15 day') || respLower.includes('15-day') || respLower.includes('15 days')) {
    verifiedFactsCited.push('15-Day Continuous Wear Lifespan');
    whatDoneWell.push('Accurately highlighted 15-day continuous wear advantage.');
    accuracyScore = Math.max(accuracyScore, 90);
  }
  if (respLower.includes('ip68')) {
    verifiedFactsCited.push('IP68 Water Resistance');
    whatDoneWell.push('Cited certified IP68 water resistance rating.');
  }
  if (respLower.includes('12,900') || respLower.includes('12900')) {
    verifiedFactsCited.push('PKR 12,900 Distributor Price (Internal)');
  }
  if (respLower.includes('13,600') || respLower.includes('13600')) {
    verifiedFactsCited.push('PKR 13,600 Public Retail Price (MyPharmEvo)');
    whatDoneWell.push('Accurately communicated the PKR 13,600 public online price.');
  }
  if (respLower.includes('bluetooth') || respLower.includes('ble') || respLower.includes('1 minute') || respLower.includes('1-min')) {
    verifiedFactsCited.push('Real-time BLE Telemetry every 1 minute');
    whatDoneWell.push('Emphasized continuous real-time Bluetooth telemetry.');
  }
  if (respLower.includes('drap')) {
    verifiedFactsCited.push('DRAP Medical Device Registration');
    whatDoneWell.push('Referenced DRAP regulatory approval.');
  }

  // General check for response substance
  if (repResponse.trim().length < 20) {
    whatCouldImprove.push('Provide a more comprehensive and articulated clinical/commercial response.');
    persuasivenessScore = Math.min(persuasivenessScore, 40);
    clarityScore = Math.min(clarityScore, 50);
  } else {
    persuasivenessScore = Math.min(100, persuasivenessScore + 10);
    clarityScore = Math.min(100, clarityScore + 10);
  }

  if (whatDoneWell.length === 0) {
    whatDoneWell.push('Addressed the doctor inquiry promptly.');
  }
  if (whatCouldImprove.length === 0) {
    whatCouldImprove.push('Continue reinforcing key differentiators: 15-day wear, 8.66% MARD, and real-time Bluetooth alarms.');
  }

  const isCompliant = safetyFlags.length === 0 && complianceScore >= 70;
  const overallScore = Math.round(
    (accuracyScore * 0.3) +
    (complianceScore * 0.25) +
    (groundingScore * 0.15) +
    (persuasivenessScore * 0.15) +
    (handlingScore * 0.15)
  );

  const dimensions: ObjectionDrillDimensionScore[] = [
    { name: 'Accuracy', score: accuracyScore, feedback: accuracyScore >= 80 ? 'Grounded in verified specs.' : 'Contains inaccurate or unverified product statements.' },
    { name: 'Compliance', score: complianceScore, feedback: complianceScore >= 80 ? 'Compliant with medical & pricing governance.' : 'Triggered safety or commercial compliance warnings.' },
    { name: 'Grounding', score: groundingScore, feedback: groundingScore >= 80 ? 'Well aligned with EvoCheck Master Knowledge.' : 'Relied on ungrounded assumptions.' },
    { name: 'Persuasiveness', score: persuasivenessScore, feedback: persuasivenessScore >= 75 ? 'Strong clinical and commercial value articulation.' : 'Could improve value framing and customer empathy.' },
    { name: 'Clarity', score: clarityScore, feedback: clarityScore >= 80 ? 'Clear, professional, and accessible message.' : 'Message could be more structured and succinct.' },
    { name: 'Objection Handling', score: handlingScore, feedback: handlingScore >= 75 ? 'Addressed the underlying doctor objection effectively.' : 'Needs stronger objection de-escalation.' }
  ];

  return {
    drillId: `drill-${Date.now()}`,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    doctorStatement: scenario.doctorStatement,
    repResponse,
    overallScore,
    isCompliant,
    accuracyScore,
    persuasivenessScore,
    dimensions,
    whatDoneWell,
    whatCouldImprove,
    groundedRecommendedResponse: scenario.authorizedResponseFact,
    safetyFlags,
    verifiedFactsCited,
    evaluatedAt: new Date().toISOString()
  };
}

export async function evaluateObjectionDrill(
  aiClient: GoogleGenAI | null,
  scenarioId: string,
  repResponse: string
): Promise<ObjectionDrillResponse> {
  const scenario = getScenarioById(scenarioId as any) || OBJECTION_SCENARIOS[0];

  // First generate deterministic baseline
  const deterministicResult = evaluateObjectionResponseDeterministic(scenario, repResponse);

  // If Gemini client is available, augment with AI feedback while preserving deterministic safety checks
  if (aiClient) {
    try {
      const prompt = `
You are the AI Drill Master & Evaluator for MedRep AI.
Evaluate this Medical Representative's response to an objection from a Healthcare Professional.

Scenario:
- Title: ${scenario.title}
- Category: ${scenario.category}
- Doctor Persona: ${scenario.doctorPersona}
- Doctor Objection: "${scenario.doctorStatement}"
- Key Evaluation Guidelines: ${scenario.keyEvaluationPoints.join(' | ')}
- Authorized Truth: "${scenario.authorizedResponseFact}"

LOCKED PRODUCT TRUTH:
- MARD: 8.66% across 15-day sensor lifespan (NEVER 8.8% or 8.83%)
- Wear Duration: 15 Days (NEVER 14 days)
- Water Resistance: IP68 (NEVER IP28)
- Reading interval: 1 minute (BLE continuous telemetry)
- Regulatory: DRAP Approved (#DRAP-MD-2025-084)
- Distributor Price: PKR 12,900 (INTERNAL)
- Public Patient Retail: PKR 13,600 (MyPharmEvo official listing)
- Institutional/Hospital Price: NOT_CONFIGURED (Never invent tender prices)
- Discounts: Unauthorized discounts strictly prohibited.
- Clinical Safety: CGM does NOT cure diabetes, does NOT eliminate all fingersticks, and does NOT guarantee prevention of hypoglycemia.

Representative's Response:
"${repResponse}"

Return a JSON object matching this schema:
{
  "whatDoneWell": ["point 1", "point 2"],
  "whatCouldImprove": ["point 1", "point 2"],
  "persuasivenessFeedback": "Short constructive coaching note",
  "persuasivenessScore": 85
}
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.whatDoneWell && Array.isArray(parsed.whatDoneWell)) {
        deterministicResult.whatDoneWell = Array.from(new Set([...deterministicResult.whatDoneWell, ...parsed.whatDoneWell]));
      }
      if (parsed.whatCouldImprove && Array.isArray(parsed.whatCouldImprove)) {
        deterministicResult.whatCouldImprove = Array.from(new Set([...deterministicResult.whatCouldImprove, ...parsed.whatCouldImprove]));
      }
      if (typeof parsed.persuasivenessScore === 'number' && deterministicResult.isCompliant) {
        deterministicResult.persuasivenessScore = Math.round((deterministicResult.persuasivenessScore + parsed.persuasivenessScore) / 2);
      }
    } catch (err) {
      console.warn('Gemini Drill evaluation fallback to deterministic:', err);
    }
  }

  return deterministicResult;
}
