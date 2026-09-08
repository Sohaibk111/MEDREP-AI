/**
 * MedRep AI v1.5.2 — Competitor retrieval and Gemini grounding.
 *
 * Pure, deterministic, read-only retrieval over the controlled competitor
 * intelligence dataset. This service never invents missing facts and never
 * mutates CRM state.
 */

import {
  COMPETITOR_INTELLIGENCE,
  COMPETITOR_INTELLIGENCE_RULES,
  CompetitorFact,
  CompetitorIntelligenceRecord
} from '../data/competitorIntelligence';

export interface CompetitorRetrievalResult {
  query: string;
  matchedCompetitors: CompetitorIntelligenceRecord[];
  unmatchedTerms: string[];
}

export interface CompetitorGroundingContext {
  context: string;
  matchedCompetitorIds: string[];
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
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

function matchesQuery(record: CompetitorIntelligenceRecord, query: string): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return false;
  return [record.brandName, record.manufacturer, record.productId, ...aliasesFor(record)]
    .map(normalize)
    .some(alias => alias && normalizedQuery.includes(alias));
}

export function retrieveCompetitors(query: string): CompetitorRetrievalResult {
  const matchedCompetitors = COMPETITOR_INTELLIGENCE.filter(record => matchesQuery(record, query));

  const normalizedQuery = normalize(query);
  const knownTerms = COMPETITOR_INTELLIGENCE.flatMap(record => [
    record.brandName,
    record.manufacturer,
    ...aliasesFor(record)
  ]).map(normalize);

  const unmatchedTerms = normalizedQuery
    .split(' ')
    .filter(term => term.length > 2 && !knownTerms.some(known => known.includes(term)))
    .filter((term, index, all) => all.indexOf(term) === index);

  return {
    query,
    matchedCompetitors,
    unmatchedTerms
  };
}

function formatFact(label: string, fact: CompetitorFact): string {
  const value = fact.value === null ? 'UNKNOWN' : String(fact.value);
  const provenance = `[${fact.status}]`;
  const source = fact.source ? ` Source: ${fact.source}.` : '';
  const notes = fact.notes ? ` Note: ${fact.notes}` : '';
  return `- ${label}: ${value} ${provenance}.${source}${notes}`;
}

function formatRecord(record: CompetitorIntelligenceRecord): string {
  const lines = [
    `COMPETITOR: ${record.brandName}`,
    `Manufacturer: ${record.manufacturer}`,
    formatFact('Price PKR', record.facts.pricePKR),
    formatFact('Wear duration (days)', record.facts.wearDurationDays),
    formatFact('MARD %', record.facts.mardPercent),
    formatFact('Real-time CGM', record.facts.realTimeCGM),
    formatFact('Connectivity', record.facts.connectivity),
    formatFact('Reader requirement', record.facts.readerRequirement),
    `Strengths: ${record.strengths.length ? record.strengths.join('; ') : 'Not stored in controlled knowledge base.'}`,
    `Weaknesses: ${record.weaknesses.length ? record.weaknesses.join('; ') : 'Not stored in controlled knowledge base.'}`,
    `Approved comparison facts: ${record.approvedComparisonFacts.length ? record.approvedComparisonFacts.join(' | ') : 'None.'}`,
    `Source notes: ${record.sourceNotes.join(' | ')}`
  ];
  return lines.join('\n');
}

export function buildCompetitorGroundingContext(query: string): CompetitorGroundingContext {
  const result = retrieveCompetitors(query);

  if (!result.matchedCompetitors.length) {
    return {
      matchedCompetitorIds: [],
      context: [
        'COMPETITOR INTELLIGENCE:',
        'No controlled competitor record matched the query.',
        'Do not invent competitor facts or use model memory as a substitute.',
        'If the user names a competitor not present in this knowledge base, state that the competitor is not currently available in the verified MedRep AI competitor knowledge base.'
      ].join('\n')
    };
  }

  return {
    matchedCompetitorIds: result.matchedCompetitors.map(record => record.productId),
    context: [
      'COMPETITOR INTELLIGENCE — CONTROLLED GROUNDING',
      'Use ONLY the competitor facts below for competitor-specific claims.',
      'Verification labels are mandatory provenance and must not be removed.',
      ...COMPETITOR_INTELLIGENCE_RULES.map((rule, index) => `${index + 1}. ${rule}`),
      '',
      ...result.matchedCompetitors.map(formatRecord).flatMap(block => [block, ''])
    ].join('\n').trim()
  };
}

export function getCompetitorRecord(productId: string): CompetitorIntelligenceRecord | undefined {
  return COMPETITOR_INTELLIGENCE.find(record => record.productId === productId);
}
