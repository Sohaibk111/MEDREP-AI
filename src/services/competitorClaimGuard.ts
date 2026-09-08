/**
 * MedRep AI v1.5.3 — deterministic post-generation competitor claim guard.
 *
 * This guard runs after Gemini generation. It does not try to prove that a
 * generated statement is clinically correct; it only blocks competitor
 * claims that contradict the controlled knowledge base or fill UNKNOWN
 * fields with invented specifics.
 */

import {
  COMPETITOR_INTELLIGENCE,
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
    case 'abbott-freestyle-libre':
      return ['abbott', 'free style libre', 'freestyle libre', 'libre', 'libre 1', 'libre 2'];
    case 'sibionics-cgm':
      return ['sibionics', 'sibionics cgm'];
    case 'ican-sinocare':
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

function hasUnknownConnectivityClaim(text: string): boolean {
  return /\b(nfc|bluetooth|ble|manual scan|manual scanning|scan(?:ning)?|near field communication)\b/i.test(text);
}

function hasUnknownIpClaim(text: string): boolean {
  return /\bip\s*\d{2}\b/i.test(text) || /\bip-rated\b|\bip rating\b|\bwater resistance\b/i.test(text);
}

function hasSpecificReaderRequirementClaim(text: string): boolean {
  return /\b(requires?|needs?|must use|mandatory).{0,40}\b(reader|receiver|scanning)\b/i.test(text)
    || /\b(reader|receiver).{0,40}\b(required|mandatory|necessary)\b/i.test(text);
}

function hasUnsupportedCompetitorFact(text: string, record: CompetitorIntelligenceRecord): string[] {
  const violations: string[] = [];

  if (record.facts.connectivity.status === 'UNKNOWN' && hasUnknownConnectivityClaim(text)) {
    violations.push(`${record.brandName}: connectivity/scanning is UNKNOWN in the controlled knowledge base.`);
  }

  if (record.facts.readerRequirement.status !== 'VERIFIED' && hasSpecificReaderRequirementClaim(text)) {
    violations.push(`${record.brandName}: a specific reader requirement is not supported by the controlled knowledge base.`);
  }

  // The current competitor schema has no IP field. Therefore any specific
  // competitor IP rating or IP-derived water-resistance claim is unsupported.
  if (!('ipRating' in record.facts) && hasUnknownIpClaim(text)) {
    violations.push(`${record.brandName}: IP rating/water-resistance is not stored in the controlled knowledge base.`);
  }

  return violations;
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

export function buildSafeCompetitorFallback(query: string, matchedCompetitorIds: string[]): string {
  const records = matchedCompetitorIds
    .map(id => COMPETITOR_INTELLIGENCE.find(record => record.productId === id))
    .filter((record): record is CompetitorIntelligenceRecord => Boolean(record));

  if (!records.length) {
    return '[FACT] No controlled competitor record matched the requested comparison.\n\n[RECOMMENDATION] Do not rely on model memory for competitor specifications; verify the competitor and source before quoting a specific fact.';
  }

  const lines = records.map(record => {
    const knownFacts = [
      record.facts.wearDurationDays.status !== 'UNKNOWN'
        ? `wear duration ${record.facts.wearDurationDays.value} days [${record.facts.wearDurationDays.status}]`
        : null,
      record.facts.mardPercent.status !== 'UNKNOWN'
        ? `MARD ${record.facts.mardPercent.value}% [${record.facts.mardPercent.status}]`
        : null,
      record.facts.realTimeCGM.status !== 'UNKNOWN'
        ? `real-time CGM ${record.facts.realTimeCGM.value} [${record.facts.realTimeCGM.status}]`
        : null
    ].filter(Boolean);

    const unknowns = [
      record.facts.connectivity.status === 'UNKNOWN' ? 'connectivity' : null,
      record.facts.readerRequirement.status === 'UNKNOWN' ? 'reader requirement' : null,
      'IP rating/water-resistance comparison'
    ].filter(Boolean);

    return `[FACT] ${record.brandName}: ${knownFacts.length ? knownFacts.join(', ') : 'no comparison specifications currently available'}. ${unknowns.length ? `The knowledge base does not currently contain verified information for: ${unknowns.join(', ')}.` : ''}`;
  });

  return `${lines.join('\n')}\n\n[RECOMMENDATION] Use only the controlled facts above. Do not fill UNKNOWN competitor fields from model memory or infer clinical superiority from specification differences.`;
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
