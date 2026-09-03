import { ObjectionScenarioDefinition, ObjectionScenarioId } from '../types';

export const OBJECTION_SCENARIOS: ObjectionScenarioDefinition[] = [
  {
    id: 'SCENARIO_AFFORDABILITY',
    title: 'Patient Affordability & Recurring Cost',
    category: 'Commercial & Price',
    difficulty: 'Standard',
    doctorPersona: 'Senior Diabetologist with heavy private clinic volume',
    doctorStatement: 'PKR 13,600 is significant for my middle-class patients every 15 days. How can I justify this continuous expense over standard fingerstick glucometer strips?',
    keyEvaluationPoints: [
      'Quote official public retail price PKR 13,600 on MyPharmEvo (do not quote distributor price PKR 12,900 as patient price)',
      'Explain 15-day continuous telemetry capturing 1,440 readings/day (~21,600 per sensor) vs 2-3 episodic fingersticks',
      'Highlight real-time trend arrows and nocturnal hypoglycemia detection',
      'No unauthorized discounts or invented margins'
    ],
    authorizedResponseFact: 'EvoCheck provides 15 full days of continuous 1-minute real-time telemetry (~21,600 readings per sensor) at the official online price of PKR 13,600 on MyPharmEvo, capturing nocturnal hypoglycemia and glycemic variability that episodic fingersticks miss.',
    safetyTrapWarning: 'Never quote the internal PKR 12,900 distributor price to the doctor as patient price, and never promise unauthorized discounts.'
  },
  {
    id: 'SCENARIO_COMPETITOR_LIBRE',
    title: 'FreeStyle Libre Clinical Preference',
    category: 'Competitor Contrast',
    difficulty: 'Challenging',
    doctorPersona: 'Consultant Endocrinologist currently prescribing Abbott FreeStyle Libre',
    doctorStatement: 'I already prescribe FreeStyle Libre for all my Type 1 patients. Why should I switch them to EvoCheck Premium Linx?',
    keyEvaluationPoints: [
      '15-day sensor lifespan (vs Libre 14 days)',
      'Verified 8.66% MARD (vs Libre 9.2%)',
      'Direct Bluetooth Low Energy (BLE) real-time streaming every 1 minute without manual NFC scanning',
      'Certified IP68 water resistance rating (vs Libre IP27)'
    ],
    authorizedResponseFact: 'EvoCheck provides 15 days of continuous wear (vs 14 days), a superior 8.66% MARD, automated 1-minute Bluetooth telemetry without manual phone scanning, and certified IP68 water resistance.',
    safetyTrapWarning: 'Do not attribute Libre specs (14-day, IP27) to EvoCheck.'
  },
  {
    id: 'SCENARIO_MARD_ACCURACY',
    title: 'MARD & Validation Accuracy',
    category: 'Technical Specs',
    difficulty: 'Standard',
    doctorPersona: 'Academic Professor of Diabetes & Endocrinology',
    doctorStatement: 'What is the validated MARD of EvoCheck across its wear cycle, and can I rely on it for insulin titration?',
    keyEvaluationPoints: [
      'Verified 8.66% MARD as a Verified Product Specification',
      '15-day continuous monitoring duration',
      'Do NOT cite legacy 8.8% or 8.83% MARD',
      'Do NOT call MARD a "clinical target"'
    ],
    authorizedResponseFact: 'EvoCheck demonstrates a verified 8.66% MARD across its 15-day sensor lifespan under technical validation protocols, providing high-precision glycemic data for clinical decision support.',
    safetyTrapWarning: 'Never cite 8.8% or 8.83% MARD; the only active verified MARD is 8.66%.'
  },
  {
    id: 'SCENARIO_WEAR_DURATION',
    title: 'Sensor Wear Duration Inquiry',
    category: 'Technical Specs',
    difficulty: 'Standard',
    doctorPersona: 'Consultant Physician evaluating continuous wear duration',
    doctorStatement: 'Is EvoCheck a 14-day sensor like standard market CGMs?',
    keyEvaluationPoints: [
      'EvoCheck provides 15 days of continuous sensor wear',
      '14 days is an obsolete / competitor specification',
      'Distinct from 12-day manufacturer replacement warranty'
    ],
    authorizedResponseFact: 'EvoCheck provides 15 days of continuous sensor wear per applicator unit. (14 days is an obsolete or competitor duration; EvoCheck also includes a 12-day replacement warranty on MyPharmEvo).',
    safetyTrapWarning: 'Never state 14-day wear for EvoCheck.'
  },
  {
    id: 'SCENARIO_WATER_RESISTANCE',
    title: 'Water Resistance & Daily Patient Lifestyle',
    category: 'Technical Specs',
    difficulty: 'Standard',
    doctorPersona: 'Diabetologist with active young adult patients',
    doctorStatement: 'Can my patients shower, exercise, and swim with the sensor? What is its exact ingress protection rating?',
    keyEvaluationPoints: [
      'Certified IP68 water resistance rating under IEC 60529',
      'Do NOT cite legacy IP28',
      'Reassure operational integrity during daily hygiene and sweating'
    ],
    authorizedResponseFact: 'EvoCheck is certified IP68 water resistance under IEC 60529 standard, ensuring protection during normal showering, bathing, and perspiration across its 15-day wear.',
    safetyTrapWarning: 'IP28 is obsolete/prohibited; active verified rating is IP68.'
  },
  {
    id: 'SCENARIO_HOSPITAL_PRICE',
    title: 'Hospital Tender & Institutional Rate',
    category: 'Commercial & Price',
    difficulty: 'Challenging',
    doctorPersona: 'Hospital Pharmacy Director / Tender Committee Chair',
    doctorStatement: 'We are preparing a hospital formulary tender for 200 CGM units. What institutional or tender rate can you quote today?',
    keyEvaluationPoints: [
      'Institutional / hospital pricing is currently NOT_CONFIGURED in the verified knowledge base',
      'Do NOT invent or guess tender pricing',
      'Do NOT quote distributor price (PKR 12,900) as hospital price',
      'Commit to requesting formal commercial authorization'
    ],
    authorizedResponseFact: 'Institutional and hospital pricing is currently NOT_CONFIGURED in the verified MedRep AI knowledge base. Official tender policies and institutional rates must be obtained through formal commercial authorization.',
    safetyTrapWarning: 'Never invent hospital/tender rates or quote unauthorized prices.'
  },
  {
    id: 'SCENARIO_DISCOUNT_REQUEST',
    title: 'Request for Rep Discount or Commercial Concession',
    category: 'Commercial & Price',
    difficulty: 'Challenging',
    doctorPersona: 'High-volume private clinic Diabetologist',
    doctorStatement: 'If I agree to start 5 patients on EvoCheck this week, can you provide an immediate 10% discount on the sensor price?',
    keyEvaluationPoints: [
      'Refuse unauthorized discounts under pricing governance',
      'State distributor price is PKR 12,900 and public online retail is PKR 13,600 on MyPharmEvo',
      'Reps have zero authority to grant discounts or alter pricing'
    ],
    authorizedResponseFact: 'Unauthorized discounts are strictly prohibited under company pricing governance. Distributor price is PKR 12,900 and public online price is PKR 13,600 on MyPharmEvo. We focus on the 15-day continuous telemetry value proposition.',
    safetyTrapWarning: 'Never authorize or promise discounts.'
  },
  {
    id: 'SCENARIO_HYPOGLYCEMIA_PREVENTION',
    title: 'Hypoglycemia Prevention & Outcome Guarantee',
    category: 'Clinical & Evidence',
    difficulty: 'Challenging',
    doctorPersona: 'Intensive Care Diabetologist managing brittle diabetes',
    doctorStatement: 'Can you guarantee that EvoCheck will completely prevent hypoglycemia and metabolic emergencies in my high-risk patients?',
    keyEvaluationPoints: [
      'EvoCheck does NOT guarantee clinical outcomes or independently prevent hypoglycemia',
      'EvoCheck provides 1-minute real-time telemetry, customizable high/low threshold alarms, and trend arrows to alert patients and support proactive management',
      'Clinical decisions remain with the treating physician'
    ],
    authorizedResponseFact: 'EvoCheck is an advanced monitoring device that provides real-time glucose readings every 1 minute and customizable high/low alerts to empower timely action, but it does not independently prevent hypoglycemia or replace medical management.',
    safetyTrapWarning: 'Never claim EvoCheck prevents hypoglycemia or cures metabolic complications.'
  },
  {
    id: 'SCENARIO_FINGERSTICK_REPLACEMENT',
    title: 'Fingerstick Blood Glucose Elimination',
    category: 'Clinical & Evidence',
    difficulty: 'Standard',
    doctorPersona: 'General Physician counseling needle-phobic patients',
    doctorStatement: 'Does wearing EvoCheck mean my patient will never need another fingerstick blood glucose test?',
    keyEvaluationPoints: [
      'Factory-calibrated: zero routine fingerstick calibrations required for daily operation',
      'Confirmatory fingersticks ARE recommended if symptoms do not match readings or during rapid glycemic changes',
      'Never claim it eliminates ALL fingersticks under all clinical circumstances'
    ],
    authorizedResponseFact: 'EvoCheck is factory-calibrated, eliminating routine daily calibration fingersticks. However, confirmatory fingersticks are recommended if symptoms do not match sensor readings or during rapid glucose fluctuations.',
    safetyTrapWarning: 'Never claim EvoCheck eliminates all fingersticks under every clinical circumstance.'
  },
  {
    id: 'SCENARIO_CLINICAL_EVIDENCE',
    title: 'Clinical Evidence & DRAP Regulatory Registration',
    category: 'Clinical & Evidence',
    difficulty: 'Advanced',
    doctorPersona: 'Hospital Ethics Committee & Senior Consultant',
    doctorStatement: 'What regulatory approvals and clinical evidence dossier back EvoCheck Premium Linx in Pakistan?',
    keyEvaluationPoints: [
      'DRAP Approved under Medical Device Registration #DRAP-MD-2025-084',
      'Technical specification dossier validates 8.66% MARD across 15 full days',
      'Do not invent fictitious clinical trials or hospital case studies'
    ],
    authorizedResponseFact: 'EvoCheck is DRAP Approved under Medical Device Registration #DRAP-MD-2025-084, with verified technical performance validation demonstrating an 8.66% MARD across 15 days of continuous sensor wear.',
    safetyTrapWarning: 'Do not invent clinical trials, patient statistics, or unverified regulatory claims.'
  }
];

export function getScenarioById(id: ObjectionScenarioId): ObjectionScenarioDefinition | undefined {
  return OBJECTION_SCENARIOS.find(s => s.id === id);
}
