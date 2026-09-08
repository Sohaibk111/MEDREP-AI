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
  if (!valueMentioned(text, fact.value)) return null;
  if (hasProvenanceNearValue(text, fact.value, fact.status)) return null;

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
  if (fact.value !== null && valueMentioned(text, fact.value)) {
    return unverifiedValueViolation(record, 'MARD', fact, text);
  }

  if (fact.value === null && /\bmard\b|\bmean absolute relative difference\b/i.test(text)) {
    return `${record.brandName}: MARD is ${fact.status} in the controlled knowledge base.`;
  }

  return null;
}

function priceViolation(record: CompetitorIntelligenceRecord, text: string): string | null {
  const fact = record.facts.pricePKR;
  if (!/\b(?:pkr|rs\.?|rupees?)\s*[0-9][0-9,]*/i.test(text)) return null;
  if (fact.status === 'UNKNOWN') {
    return `${record.brandName}: Pakistan price is UNKNOWN in the controlled knowledge base.`;
  }
  if (fact.value !== null && valueMentioned(text, fact.value)) {
    return unverifiedValueViolation(record, 'Pakistan price', fact, text);
  }
  return null;
}

function hasUnsupportedCompetitorFact(text: string, record: CompetitorIntelligenceRecord): string[] {
  return [
    connectivityViolation(record, text),
    scanWorkflowViolation(record, text),
    readerViolation(record, text),
    specificWaterResistanceViolation(record, text),
    mardViolation(record, text),
    priceViolation(record, text),
    unsupportedFieldViolation(record, record.facts.monitoringIntervalMinutes, 'monitoring interval', text, /\b(?:every|each)\s*\d+\s*(?:minute|min)\b|\b\d+\s*readings?\s*(?:per|a)\s*day\b/i),
    unsupportedFieldViolation(record, record.facts.alarmCapability, 'alarm capability', text, /\b(?:low|high|signal loss)\s*(?:glucose )?alarm|\balarms?\b/i)
  ].filter((value): value is string => Boolean(value));
}

export function validateCompetitorGeneratedText(text: string): CompetitorClaimGuardResult {
  const output = text || '';
  const matched = COMPETITOR_INTELLIGENCE.filter(record => recordMentioned(output, record));
  const violations = matched.flatMap(record => hasUnsupportedCompetitorFact(output, record));

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

export function sanitizeCompetitorGeneratedText(
  query: string,
  generatedText: string,
  matchedCompetitorIds: string[]
): CompetitorClaimGuardResult {
  const validation = validateCompetitorGeneratedText(generatedText);
  if (validation.safe) return validation;

  return {
    ...validation,
    safe: false,
    text: buildSafeCompetitorFallback(query, matchedCompetitorIds)
  };
}
