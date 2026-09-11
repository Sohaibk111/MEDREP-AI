/**
 * MedRep AI v1.5.5 — deterministic EvoCheck (non-competitor) contextual responder.
 *
 * This is the controlled, curated fallback used for EvoCheck product/commercial
 * questions (pricing, MARD, wear duration, regulatory, discount governance, etc.)
 * when either:
 *   1. Gemini is unavailable/fails, or
 *   2. Gemini succeeded but its output was rejected by the competitor claim guard
 *      for a query that is not actually about a competitor.
 *
 * Extracted verbatim from server.ts so both call sites stay in sync and the
 * curated EvoCheck answers are never silently replaced by generic competitor
 * fallback text.
 */

export function buildDeterministicEvoCheckResponse(query: string): string {
  const qLower = (query || '').toLowerCase();

  if (qLower.includes('unsupported') || qLower.includes('not verified') || qLower.includes('unknown spec')) {
    return `This EvoCheck specification is not currently available in the verified MedRep AI knowledge base.`;
  }
  if (qLower.includes('distributor') && (qLower.includes('price') || qLower.includes('cost') || qLower.includes('rate'))) {
    return `[FACT] The authorized internal distributor price is PKR 12,900 per EvoCheck Premium Linx sensor/unit (Classification: DISTRIBUTOR_PRICE, Visibility: INTERNAL).\n\n[RECOMMENDATION] Medical representatives must maintain this as internal commercial information and not quote it as the public patient retail price.`;
  }
  if ((qLower.includes('public') || qLower.includes('retail') || qLower.includes('patient') || qLower.includes('online')) && (qLower.includes('price') || qLower.includes('cost'))) {
    return `[FACT] The official patient/public online price is PKR 13,600 (current promotional sale, regular PKR 17,000 with 20% discount), based on the current MyPharmEvo listing.\n\n[RECOMMENDATION] Self-paying patients can be directed to the official MyPharmEvo website for direct home delivery.`;
  }
  if (qLower.includes('institutional') || qLower.includes('hospital price') || qLower.includes('tender') || (qLower.includes('hospital') && qLower.includes('price')) || qLower.includes('invent a price')) {
    return `[FACT] Institutional hospital/tender pricing is currently NOT_CONFIGURED in the verified knowledge base.\n\n[RECOMMENDATION] Do not quote retail e-commerce prices for hospital tender procurement or invent unverified pricing; confirm institutional rates once formal commercial authorization is released.`;
  }
  if (qLower.includes('discount') || qLower.includes('invent') || qLower.includes('margin')) {
    return `[FACT] MedRep AI strictly adheres to verified pricing governance. Internal distributor price is PKR 12,900; public retail price is PKR 13,600 on MyPharmEvo. Institutional/hospital pricing is NOT_CONFIGURED.\n\n[RECOMMENDATION] Unauthorized discounts or invented prices are strictly prohibited. Quote only authorized pricing tiers.`;
  }
  if (qLower.includes('12,500') || qLower.includes('old price') || qLower.includes('legacy price')) {
    return `[FACT] The legacy figure of PKR 12,500 is obsolete and quarantined. The authorized internal distributor price is PKR 12,900 per sensor/unit, and the official public retail price is PKR 13,600.\n\n[RECOMMENDATION] Always use the active verified commercial pricing.`;
  }
  if (qLower.includes('regulatory') || qLower.includes('drap') || qLower.includes('approved') || qLower.includes('approval')) {
    return `[FACT] EvoCheck Premium Linx CGM is DRAP Approved (DRAP Medical Device Registration Authority, Pakistan).\n\n[RECOMMENDATION] Present the DRAP regulatory registration details when meeting with hospital procurement committees and clinical department heads.`;
  }
  if (qLower.includes('clinically proven') || qLower.includes('clinical trial') || qLower.includes('guarantee')) {
    return `[FACT] EvoCheck CGM has a verified MARD specification of 8.66% across its 15-day sensor lifespan under technical validation protocols. Claims are based on Verified Product Specifications rather than unverified promotional promises.\n\n[RECOMMENDATION] Share technical dossier data rather than subjective promotional phrasing.`;
  }
  if (qLower.includes('hypoglycemia') || qLower.includes('prevent')) {
    return `[FACT] EvoCheck is a continuous glucose monitoring sensor providing real-time glucose telemetry every 1 minute with customizable high/low threshold alerts. It provides actionable trend data but does not directly replace medical therapy or independently prevent metabolic events.\n\n[RECOMMENDATION] Explain how real-time trend arrows and automated alerts empower proactive glycemic management.`;
  }
  if (qLower.includes('fingerstick') || qLower.includes('replace') || qLower.includes('calibration')) {
    return `[FACT] EvoCheck is factory-calibrated for continuous glucose monitoring without routine fingersticks. However, confirmatory fingerstick blood glucose testing may be required during rapid glucose fluctuations or if symptoms do not match sensor readings.\n\n[RECOMMENDATION] Emphasize zero-routine calibration while reinforcing standard clinical safety guidance.`;
  }
  if (qLower.includes('14 days') || qLower.includes('14-day') || qLower.includes('is evocheck 14')) {
    return `[FACT] No, EvoCheck provides 15 days of continuous sensor wear per applicator unit (14 days is an obsolete/competitor specification).\n\n[RECOMMENDATION] Highlight the 15-day continuous wear duration as providing extra monitoring continuity.`;
  }
  if (qLower.includes('ip28') || qLower.includes('is evocheck ip28')) {
    return `[FACT] No, EvoCheck is certified IP68 water resistance according to IEC 60529 standard (IP28 is an obsolete/prohibited specification).\n\n[RECOMMENDATION] Reassure clinicians and patients that IP68 provides robust water and sweat resistance for showering and daily activities.`;
  }
  if (qLower.includes('libre') || qLower.includes('compare') || qLower.includes('competitor') || qLower.includes('dexcom') || qLower.includes('aidex')) {
    return `[FACT] EvoCheck vs FreeStyle Libre 1: EvoCheck provides 15-day wear (vs Libre's 14 days), 8.66% MARD (vs Libre's 11.4%), direct continuous Bluetooth Low Energy telemetry every 1 minute without manual NFC scanning (vs Libre's manual NFC scan requirement), and IP68 water resistance (vs Libre's IP27).\n\n[RECOMMENDATION] Position EvoCheck's continuous automated telemetry and 15-day duration as key clinical differentiators for active patient monitoring.`;
  }
  if (qLower.includes('price') || qLower.includes('cost') || qLower.includes('pricing')) {
    return `[FACT] EvoCheck pricing structure: Internal Distributor Price is PKR 12,900 per sensor/unit (INTERNAL); Public Patient Online Price is PKR 13,600 (official MyPharmEvo promotional listing, regular PKR 17,000); Institutional Hospital Price is NOT_CONFIGURED.\n\n[RECOMMENDATION] Clearly distinguish internal trade pricing from public retail pricing when speaking with clinicians.`;
  }
  if (qLower.includes('pwd') || qLower.includes('soan')) {
    return `[FACT] In PWD & Soan Garden, you have Dr. Sarah Khan (Diabetologist, Priority A, Sugar & Metabolic Care Clinic, OPD Mon/Tue/Thu 11:30 AM) and Dr. Uzair Malik (Nephrologist, Priority B, Soan International Hospital, OPD Mon/Wed 2:00 PM).\n\n[RECOMMENDATION] Visit Dr. Sarah Khan first around 12:00 PM to review gestational diabetes trial (#P-102), then drive 8 minutes down Islamabad Expressway to see Dr. Uzair Malik at 2:00 PM.`;
  }
  if (qLower.includes('mard') || qLower.includes('accuracy')) {
    return `[FACT] EvoCheck CGM has a verified MARD of 8.66% across its 15-day sensor lifespan (Verified Product Specification).\n\n[RECOMMENDATION] Share the technical dossier with clinicians seeking clinical-grade accuracy validation.`;
  }
  if (qLower.includes('wear') || qLower.includes('duration') || qLower.includes('days') || qLower.includes('how long')) {
    return `[FACT] EvoCheck provides 15 days of continuous sensor wear per applicator.\n\n[RECOMMENDATION] Position the 15-day lifespan against 14-day market alternatives as providing an extra day of uninterrupted glycemic insights.`;
  }
  if (qLower.includes('water') || qLower.includes('swim') || qLower.includes('shower') || qLower.includes('resistance')) {
    return `[FACT] EvoCheck is rated IP68 for water ingress resistance according to IEC 60529 standards.\n\n[RECOMMENDATION] Reassure patients that normal showering and water exposure are supported during the 15-day wear.`;
  }
  if (qLower.includes('warranty')) {
    return `[FACT] EvoCheck includes a 12-day manufacturer replacement warranty (source: MyPharmEvo official listing), which is distinct from the 15-day continuous sensor wear lifespan.\n\n[RECOMMENDATION] Clarify warranty coverage terms for patients requiring product support.`;
  }

  return `[FACT] Today's prioritized route covers Shifa International Hospital (Prof. Dr. Jamal Ahmed, 11:00 AM) and PWD (Dr. Sarah Khan, 12:30 PM).\n\n[RECOMMENDATION] Ensure you carry the EvoCheck demonstration applicator and verified 8.66% MARD technical one-pagers for both calls.`;
}
