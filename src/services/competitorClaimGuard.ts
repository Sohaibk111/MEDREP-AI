/**
 * MedRep AI v1.5.3 — deterministic post-generation competitor claim guard.
 *
 * The guard validates generated competitor claims against the controlled
 * generation-specific evidence record and provenance. It is intentionally
 * evidence-driven rather than a blacklist of competitor terms.
 */

import {
  COMPETITOR_INTELLIGENCE,
  CompetitorFact,
  CompetitorIntelligenceRecord
} from '../data/competitorIntelligence';
import { EVOCHECK_COMMERCIAL_PRICING } from '../data/competitorIntelligence';
import { EVOCHECK_MASTER_KNOWLEDGE } from '../data/productKnowledge';

export interface CompetitorClaimGuardResult {
  safe: boolean;
  text: string;
  violations: string[];
  matchedCompetitorIds: string[];
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.%]+/g, ' ').trim();
}

function aliasesFor(record: CompetitorIntelligenceRecord): string[] {
  switch (record.productId) {
    case 'abbott-freestyle-libre-1':
      return ['abbott', 'free style libre 1', 'freestyle libre 1', 'libre 1', 'original freestyle libre', 'libre 14 day'];
    case 'abbott-freestyle-libre-2':
      return ['abbott', 'free style libre 2', 'freestyle libre 2', 'libre 2', 'fsl 2'];
    case 'sibionics-gs1':
      return ['sibionics', 'sibionics cgm', 'sibionics gs1', 'gs1'];
    case 'ican-sinocare-ican-i3':
      return ['ican', 'ican i3', 'sinocare', 'sinocare ican', 'sinocare ican i3'];
    default:
      return [];
  }
}

function recordMentioned(text: string, record: CompetitorIntelligenceRecord): boolean {
  const normalized = normalize(text);
  return [record.brandName, record.productId, ...aliasesFor(record)]
    .map(normalize)
    .some(alias => alias.length > 2 && normalized.includes(alias));
}

function contains(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

function valueMentioned(text: string, value: string | number): boolean {
  const normalizedText = normalize(text);
  const normalizedValue = normalize(String(value));
  if (!normalizedValue) return false;
  return normalizedText.includes(normalizedValue);
}

function priceValueMentioned(text: string, value: number): boolean {
  const digits = String(value);
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return new RegExp(`\\b(?:${digits}|${formatted})\\b`).test(text);
}

function hasProvenanceNearValue(text: string, value: string | number, status: string): boolean {
  const raw = String(value);
  const index = text.toLowerCase().indexOf(raw.toLowerCase());
  if (index < 0) return false;
  const window = text.slice(Math.max(0, index - 120), Math.min(text.length, index + raw.length + 160));
  return window.includes(`[${status}]`);
}

function unverifiedValueViolation(
  record: CompetitorIntelligenceRecord,
  label: string,
  fact: CompetitorFact,
  text: string
): string | null {
  if (fact.value === null || fact.status === 'VERIFIED') return null;
  if (!valueMentioned(text, String(fact.value))) return null;
  if (hasProvenanceNearValue(text, String(fact.value), fact.status)) return null;

  return `${record.brandName}: ${label} value ${String(fact.value)} is ${fact.status} and cannot be presented as an independently verified fact.`;
}

function unsupportedFieldViolation(
  record: CompetitorIntelligenceRecord,
  fact: CompetitorFact,
  label: string,
  text: string,
  trigger: RegExp
): string | null {
  if (fact.status === 'VERIFIED') return null;
  if (!contains(text, trigger)) return null;
  return `${record.brandName}: ${label} is ${fact.status} in the controlled knowledge base.`;
}

function specificWaterResistanceViolation(record: CompetitorIntelligenceRecord, text: string): string | null {
  if (!contains(text, /\bip\s*\d{2}\b|\bwater resistance\b|\bwaterproof\b/i)) return null;

  const fact = record.facts.waterResistance;
  if (fact.status === 'UNKNOWN' || fact.status === 'NEEDS_VERIFICATION') {
    return `${record.brandName}: water resistance/IP rating is ${fact.status} in the controlled knowledge base.`;
  }

  if (fact.status === 'VERIFIED' && fact.value) {
    const ipMatch = text.match(/\bip\s*\d{2}\b/i);
    if (ipMatch && normalize(ipMatch[0]) !== normalize(String(fact.value))) {
      return `${record.brandName}: generated IP rating ${ipMatch[0]} conflicts with controlled value ${fact.value}.`;
    }
  }

  return null;
}

function connectivityViolation(record: CompetitorIntelligenceRecord, text: string): string | null {
  const fact = record.facts.connectivity;
  const trigger = /\bnfc\b|\bnear field communication\b|\bbluetooth\b|\bble\b|\bwireless\b/i;

  if (fact.status !== 'VERIFIED' && trigger.test(text)) {
    return `${record.brandName}: connectivity is ${fact.status} in the controlled knowledge base.`;
  }

  if (fact.status === 'VERIFIED' && fact.value) {
    const normalizedFact = normalize(String(fact.value));
    if (normalizedFact === 'nfc' && /\bbluetooth\b|\bble\b/i.test(text) && !/\bstart|scan\b/i.test(text)) {
      return `${record.brandName}: generated Bluetooth connectivity claim is not supported by the controlled Libre 1 connectivity field.`;
    }
  }

  return null;
}

function scanWorkflowViolation(record: CompetitorIntelligenceRecord, text: string): string | null {
  const fact = record.facts.scanWorkflow;
  const trigger = /\bmanual scan\b|\bmanual scanning\b|\brequires? (?:a )?scan\b|\bno (?:manual )?scan(?:ning)?\b|\bscan-free\b/i;

  if (fact.status !== 'VERIFIED' && trigger.test(text)) {
    return `${record.brandName}: scan workflow is ${fact.status} in the controlled knowledge base.`;
  }

  if (fact.status === 'VERIFIED' && fact.value) {
    const normalizedFact = normalize(String(fact.value));
    if (normalizedFact.includes('scan the sensor') && /\bno manual scan(?:ning)?\b|\bscan-free\b/i.test(text)) {
      return `${record.brandName}: generated scan-free claim conflicts with the controlled scan workflow.`;
    }
    if (record.productId === 'abbott-freestyle-libre-1' && /\bbluetooth\b|\bble\b/i.test(text) && !/\bscan\b/i.test(text)) {
      return `${record.brandName}: continuous Bluetooth claim is not supported for the classic Libre 1 workflow.`;
    }
  }

  return null;
}

function readerViolation(record: CompetitorIntelligenceRecord, text: string): string | null {
  const trigger = /\b(requires?|needs?|must use|mandatory|necessary).{0,50}\b(reader|receiver)\b/i;
  const fact = record.facts.readerRequirement;

  if (fact.status !== 'VERIFIED' && trigger.test(text)) {
    return `${record.brandName}: a specific reader requirement is ${fact.status} in the controlled knowledge base.`;
  }

  return null;
}

function mardViolation(record: CompetitorIntelligenceRecord, text: string): string | null {
  const fact = record.facts.mardPercent;
  const mardMentioned = /\bmard\b|\bmean absolute relative difference\b/i.test(text);

  if (!mardMentioned) return null;

  if (fact.value === null) {
    return `${record.brandName}: MARD is ${fact.status} in the controlled knowledge base.`;
  }

  if (valueMentioned(text, fact.value)) {
    return unverifiedValueViolation(record, 'MARD', fact, text);
  }

  const percentageMatches = [...text.matchAll(/\b(\d+(?:\.\d+)?)\s*%/g)]
    .map(match => Number(match[1]));

  if (
    percentageMatches.length &&
    !percentageMatches.some(value => value === Number(fact.value))
  ) {
    return `${record.brandName}: generated MARD claim conflicts with controlled value ${fact.value}%.`;
  }

  return null;
}

function priceViolation(record: CompetitorIntelligenceRecord, text: string): string | null {
  const fact = record.facts.pricePKR;
  if (!/\b(?:pkr|rs\.?|rupees?)\s*[0-9][0-9,]*/i.test(text)) return null;
  if (record.commercialPrices.length) {
    if (!record.commercialPrices.some(price => priceValueMentioned(text, price.valuePKR))) {
      return `${record.brandName}: no matching channel-specific Pakistan price is stored in the controlled knowledge base.`;
    }
    return null;
  }
  if (fact.status === 'UNKNOWN') {
    return `${record.brandName}: Pakistan price is UNKNOWN in the controlled knowledge base.`;
  }
  if (fact.value !== null && priceValueMentioned(text, fact.value)) return null;
  return null;
}

function structuredPriceViolation(productName: string, prices: typeof EVOCHECK_COMMERCIAL_PRICING, text: string): string[] {
  const violations: string[] = [];
  const priceMatches = [...text.matchAll(/\b(?:pkr|rs\.?|rupees?)\s*([0-9][0-9,]*)/gi)];

  for (const match of priceMatches) {
    const value = Number(match[1].replace(/,/g, ''));
    const price = prices.find(candidate => candidate.valuePKR === value);
    if (!price) continue;

    const matchIndex = match.index || 0;
    const previousBoundary = Math.max(text.lastIndexOf('.', matchIndex), text.lastIndexOf(',', matchIndex), text.lastIndexOf('\n', matchIndex));
    const nextBoundaries = [text.indexOf('.', matchIndex + match[0].length), text.indexOf(',', matchIndex + match[0].length), text.indexOf('\n', matchIndex + match[0].length)].filter(index => index >= 0);
    const nextBoundary = nextBoundaries.length ? Math.min(...nextBoundaries) : text.length;
    const window = text.slice(previousBoundary + 1, nextBoundary);
    const hasPatient = /\bpatient\b/i.test(window);
    const hasRetail = /\bretail\b/i.test(window);
    const hasDistribution = /\b(distribution|distributor|trade)\b/i.test(window);
    const hasOnline = /\b(online|web|website|e[- ]?commerce)\b/i.test(window);

    if (hasPatient && price.priceType !== 'PATIENT') {
      violations.push(`${productName}: generated patient price claim uses a ${price.priceType} price.`);
    }
    if (hasRetail && price.priceType !== 'RETAIL') {
      violations.push(`${productName}: generated retail price claim uses a ${price.priceType} price.`);
    }
    if (hasDistribution && price.channel !== 'DISTRIBUTION') {
      violations.push(`${productName}: generated distribution price claim uses the ${price.channel} price.`);
    }
    if (hasOnline && price.channel !== 'ONLINE') {
      violations.push(`${productName}: generated online price claim uses the ${price.channel} price.`);
    }

    const hasTypeOrChannel = hasPatient || hasRetail || hasDistribution || hasOnline || /\bmarketplace\b|\bpromotional\b/i.test(window);
    if (prices.length > 1 && !hasTypeOrChannel) {
      violations.push(`${productName}: price ${value} requires an explicit price type or channel because multiple controlled prices exist.`);
    }
  }

  return violations;
}

function hasUnsupportedCompetitorFact(text: string, record: CompetitorIntelligenceRecord): string[] {
  return [
    connectivityViolation(record, text),
    scanWorkflowViolation(record, text),
    readerViolation(record, text),
    specificWaterResistanceViolation(record, text),
    mardViolation(record, text),
    priceViolation(record, text),
    ...structuredPriceViolation(record.brandName, record.commercialPrices, text),
    unsupportedFieldViolation(record, record.facts.monitoringIntervalMinutes, 'monitoring interval', text, /\b(?:every|each)\s*\d+\s*(?:minute|min)\b|\b\d+\s*readings?\s*(?:per|a)\s*day\b/i),
    unsupportedFieldViolation(record, record.facts.alarmCapability, 'alarm capability', text, /\b(?:low|high|signal loss)\s*(?:glucose )?alarm|\balarms?\b/i)
  ].filter((value): value is string => Boolean(value));
}

function unknownCompetitorPriceViolation(text: string): string | null {
  if (!/\b(?:pkr|rs\.?|rupees?)\s*[0-9][0-9,]*/i.test(text)) return null;
  return 'Unknown competitor pricing is not stored in the controlled knowledge base.';
}

export function validateCompetitorGeneratedText(text: string): CompetitorClaimGuardResult {
  const output = text || '';
  const matched = COMPETITOR_INTELLIGENCE.filter(record => recordMentioned(output, record));
  const violations = matched.flatMap(record => hasUnsupportedCompetitorFact(output, record));
  const evocheckMentioned = /\bevocheck\b/i.test(output);
  if (!matched.length && !evocheckMentioned) {
    const unknownPriceViolation = unknownCompetitorPriceViolation(output);
    if (unknownPriceViolation) violations.push(unknownPriceViolation);
  }
  if (evocheckMentioned && /\b(?:pkr|rs\.?|rupees?)\s*[0-9][0-9,]*/i.test(output)) {
    violations.push(...structuredPriceViolation('EvoCheck', EVOCHECK_COMMERCIAL_PRICING, output));
  }

  return {
    safe: violations.length === 0,
    text: output,
    violations,
    matchedCompetitorIds: matched.map(record => record.productId)
  };
}

function formatKnownFact(label: string, fact: CompetitorFact): string | null {
  if (fact.value === null || fact.status === 'UNKNOWN') return null;
  return `${label}: ${String(fact.value)} [${fact.status}]`;
}

export function buildSafeCompetitorFallback(query: string, matchedCompetitorIds: string[]): string {
  const records = matchedCompetitorIds
    .map(id => COMPETITOR_INTELLIGENCE.find(record => record.productId === id))
    .filter((record): record is CompetitorIntelligenceRecord => Boolean(record));

  if (!records.length) {
    return '[FACT] No controlled competitor record matched the requested comparison.\n\n[RECOMMENDATION] Do not rely on model memory for competitor specifications; verify the competitor and source before quoting a specific fact.';
  }

  const lines = records.map(record => {
    const knownFacts = [
      formatKnownFact('Wear duration', record.facts.wearDurationDays),
      formatKnownFact('MARD', record.facts.mardPercent),
      formatKnownFact('Connectivity', record.facts.connectivity),
      formatKnownFact('Scan workflow', record.facts.scanWorkflow),
      formatKnownFact('Water resistance', record.facts.waterResistance),
      formatKnownFact('Monitoring interval', record.facts.monitoringIntervalMinutes),
      formatKnownFact('Alarm capability', record.facts.alarmCapability)
    ].filter((value): value is string => Boolean(value));

    const unknowns = [
      record.facts.mardPercent.status !== 'VERIFIED' && record.facts.mardPercent.value === null ? 'MARD' : null,
      record.facts.connectivity.status === 'UNKNOWN' ? 'connectivity' : null,
      record.facts.readerRequirement.status !== 'VERIFIED' ? 'reader requirement' : null,
      record.facts.pricePKR.status === 'UNKNOWN' ? 'Pakistan price' : null
    ].filter((value): value is string => Boolean(value));

    return `[FACT] ${record.brandName}: ${knownFacts.length ? knownFacts.join('; ') : 'no comparison specifications currently available'}. ${unknowns.length ? `The knowledge base does not currently contain verified information for: ${unknowns.join(', ')}.` : ''}`;
  });

  return `${lines.join('\n')}\n\n[RECOMMENDATION] Use only controlled competitor facts and preserve their provenance. Do not infer missing fields or overall clinical superiority from specification differences.`;
}

function queryMentionsRecord(query: string, record: CompetitorIntelligenceRecord): boolean {
  const normalized = normalize(query);
  const explicitAliases: Record<string, string[]> = {
    'abbott-freestyle-libre-1': ['freestyle libre 1', 'free style libre 1', 'libre 1', 'original freestyle libre', 'libre 14 day'],
    'abbott-freestyle-libre-2': ['freestyle libre 2', 'free style libre 2', 'libre 2', 'fsl 2'],
    'sibionics-gs1': ['sibionics', 'sibionics gs1', 'sibionics cgm', 'gs1'],
    'ican-sinocare-ican-i3': ['ican i3', 'sinocare ican i3', 'sinocare ican', 'sinocare', 'ican']
  };
  return (explicitAliases[record.productId] || []).some(alias => normalized.includes(normalize(alias))) ||
    normalized.includes(normalize(record.productId));
}

function requestedCompetitorRecords(query: string): CompetitorIntelligenceRecord[] {
  const explicit = COMPETITOR_INTELLIGENCE.filter(record => queryMentionsRecord(query, record));
  if (explicit.length) return explicit;
  if (/\babbott\b/i.test(query)) {
    return COMPETITOR_INTELLIGENCE.filter(record => record.productId.startsWith('abbott-freestyle-libre-'));
  }
  return [];
}

// Known CGM brand names outside the controlled competitor knowledge base.
// Used only to recognize that a query is *about* a competitor (so unsupported
// competitor facts are correctly quarantined) without ever fabricating data
// for these brands.
const OTHER_KNOWN_COMPETITOR_BRANDS = /\b(dexcom|medtronic|guardian\s*connect|aidex|senseonics|eversense|glucomen|accu-?chek|freestyle\s*libre\s*3|libre\s*3)\b/i;

/**
 * Narrow, deterministic distinction between genuine competitor-intelligence
 * queries and EvoCheck/product-commercial queries. This governs ONLY which
 * curated fallback is used when the claim guard rejects a generated answer —
 * it never affects whether a violation is detected in the first place.
 */
export function isLikelyCompetitorQuery(query: string): boolean {
  if (requestedCompetitorRecords(query).length > 0) return true;
  return OTHER_KNOWN_COMPETITOR_BRANDS.test(query) || /\bcompetitor\b/i.test(query);
}

function evoCheckFacts() {
  const core = EVOCHECK_MASTER_KNOWLEDGE.core_specifications;
  return {
    wear: core.wear_duration.value,
    mard: core.mard.value,
    connectivity: core.connectivity.value,
    water: core.water_resistance.value,
    interval: core.reading_interval.value
  };
}

function deterministicPriceResponse(query: string, records: CompetitorIntelligenceRecord[]): string | null {
  if (!/\b(?:price|cost|how much|pkr|rs\.?|rupees?)\b/i.test(query)) return null;

  const lines: string[] = [];
  if (/\bevocheck\b/i.test(query)) {
    const evoPrices = EVOCHECK_COMMERCIAL_PRICING.map(price => `${price.priceType.toLowerCase()} via ${price.channel.toLowerCase()}: PKR ${price.valuePKR.toLocaleString()}`);
    lines.push(`[FACT] EvoCheck Premium Linx CGM â€” ${evoPrices.join('; ')}.`);
  }

  for (const record of records) {
    if (record.commercialPrices.length) {
      const prices = record.commercialPrices.map(price => `${price.priceType.toLowerCase()} via ${price.channel.toLowerCase()}: PKR ${price.valuePKR.toLocaleString()}`);
      lines.push(`[FACT] ${record.brandName} â€” ${prices.join('; ')}.`);
    } else if (record.facts.pricePKR.value !== null && record.facts.pricePKR.status !== 'UNKNOWN') {
      lines.push(`[FACT] ${record.brandName} â€” Pakistan price: PKR ${record.facts.pricePKR.value.toLocaleString()} [${record.facts.pricePKR.status}].`);
    } else {
      lines.push(`[FACT] ${record.brandName} â€” current Pakistan price is not established in the controlled knowledge base.`);
    }
  }

  if (!lines.length) return null;
  return `${lines.join('\n')}\n\n[RECOMMENDATION] Prices are time-sensitive; preserve the stated price type and channel when quoting them.`;
}

function deterministicMardResponse(query: string, records: CompetitorIntelligenceRecord[]): string | null {
  if (!/\bmard\b|\bmean absolute relative difference\b/i.test(query)) return null;
  if (records.length !== 1) return null;
  const record = records[0];
  const fact = record.facts.mardPercent;
  if (fact.value === null || fact.status !== 'VERIFIED') {
    return `[FACT] ${record.brandName} MARD is not verified in the controlled knowledge base.`;
  }
  return `[FACT] ${record.brandName} adult MARD: ${fact.value}%. Source: ${fact.source || 'controlled product evidence'}.`;
}

function deterministicComparisonResponse(query: string, records: CompetitorIntelligenceRecord[]): string | null {
  if (!/\b(?:compare|comparison|versus|vs\.?|difference|better than|different from)\b/i.test(query)) return null;
  if (!/\bevocheck\b/i.test(query) || records.length !== 1) return null;

  const evo = evoCheckFacts();
  const competitor = records[0];
  const c = competitor.facts;
  const lines = [
    `[FACT] EvoCheck Premium Linx CGM vs ${competitor.brandName}`,
    `- Wear duration: EvoCheck ${evo.wear} days; ${competitor.brandName} ${c.wearDurationDays.value ?? 'not verified'} days.`,
    `- MARD: EvoCheck ${evo.mard}%; ${competitor.brandName} ${c.mardPercent.value !== null ? `${c.mardPercent.value}%` : 'not verified'}.`,
    `- Connectivity: EvoCheck ${evo.connectivity}; ${competitor.brandName} ${c.connectivity.value ?? 'not verified'}.`,
    `- Water resistance: EvoCheck ${evo.water}; ${competitor.brandName} ${c.waterResistance.value ?? 'not verified'}.`,
    `- Monitoring interval: EvoCheck ${evo.interval} minute; ${competitor.brandName} ${c.monitoringIntervalMinutes.value ?? 'not verified'} minutes.`
  ];

  if (competitor.productId === 'abbott-freestyle-libre-1') {
    lines.push('- Scan workflow: Libre 1 requires scanning the sensor to obtain readings; EvoCheck uses continuous BLE connectivity.');
  } else if (c.scanWorkflow.value) {
    lines.push(`- Scan workflow: EvoCheck uses continuous BLE connectivity; ${competitor.brandName} ${c.scanWorkflow.value}`);
  }

  return `${lines.join('\n')}\n\n[RECOMMENDATION] Use these generation-specific specifications for technical comparison. Do not infer overall clinical superiority from specifications alone.`;
}

function deterministicCompetitorResponse(query: string): { text: string; matchedCompetitorIds: string[] } | null {
  const records = requestedCompetitorRecords(query);
  const comparison = deterministicComparisonResponse(query, records);
  if (comparison) return { text: comparison, matchedCompetitorIds: records.map(record => record.productId) };

  const mard = deterministicMardResponse(query, records);
  if (mard) return { text: mard, matchedCompetitorIds: records.map(record => record.productId) };

  const price = deterministicPriceResponse(query, records);
  if (price) return { text: price, matchedCompetitorIds: records.map(record => record.productId) };

  return null;
}

export function sanitizeCompetitorGeneratedText(
  query: string,
  generatedText: string,
  matchedCompetitorIds: string[]
): CompetitorClaimGuardResult {
  const deterministic = deterministicCompetitorResponse(query);
  if (deterministic) {
    return {
      safe: true,
      text: deterministic.text,
      violations: [],
      matchedCompetitorIds: deterministic.matchedCompetitorIds
    };
  }

  const validation = validateCompetitorGeneratedText(generatedText);
  if (validation.safe) return validation;

  return {
    ...validation,
    safe: false,
    text: buildSafeCompetitorFallback(query, matchedCompetitorIds)
  };
}
