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
  CommercialPriceObservation,
  CompetitorFact,
  CompetitorIntelligenceRecord
} from '../data/competitorIntelligence';
import { EVOCHECK_COMMERCIAL_PRICING } from '../data/competitorIntelligence';

export interface CommercialPriceMatch extends CommercialPriceObservation {
  productId: string;
  productName: string;
}

export interface CompetitorRetrievalResult {
  query: string;
  matchedCompetitors: CompetitorIntelligenceRecord[];
  unmatchedTerms: string[];
  commercialPrices: CommercialPriceMatch[];
  pricingChannelRequired: boolean;
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
    case 'abbott-freestyle-libre-1':
      return ['abbott', 'free style libre', 'freestyle libre', 'abbott freestyle libre 1', 'freestyle libre 1', 'libre 1', 'original freestyle libre', 'libre 14 day'];
    case 'abbott-freestyle-libre-2':
      return ['abbott', 'free style libre', 'freestyle libre', 'abbott freestyle libre 2', 'freestyle libre 2', 'libre 2', 'fsl 2'];
    case 'sibionics-gs1':
      return ['sibionics', 'sibionics cgm', 'sibionics gs1', 'gs1'];
    case 'ican-sinocare-ican-i3':
      return ['ican', 'ican i3', 'sinocare', 'sinocare ican', 'sinocare ican i3'];
    default:
      return [];
  }
}

function matchesQuery(record: CompetitorIntelligenceRecord, query: string): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return false;
  const mentionsLibre1 = /\b(?:libre\s*1|free\s*style\s*libre\s*1)\b/i.test(query);
  const mentionsLibre2 = /\b(?:libre\s*2|free\s*style\s*libre\s*2)\b/i.test(query);
  if (record.productId === 'abbott-freestyle-libre-1' && mentionsLibre2 && !mentionsLibre1) return false;
  if (record.productId === 'abbott-freestyle-libre-2' && mentionsLibre1 && !mentionsLibre2) return false;
  return [record.brandName, record.manufacturer, record.productId, ...aliasesFor(record)]
    .map(normalize)
    .some(alias => alias && normalizedQuery.includes(alias));
}

function isPricingQuery(query: string): boolean {
  return /\b(price|pricing|cost|pkr|rupees?|retail|patient|distribution|distributor|online|marketplace|promotional)\b/i.test(query);
}

function queryChannel(query: string): CommercialPriceObservation['channel'] | undefined {
  if (/\b(distribution|distributor|trade)\b/i.test(query)) return 'DISTRIBUTION';
  if (/\b(online|web|website|e[- ]?commerce)\b/i.test(query)) return 'ONLINE';
  if (/\bmarketplace\b/i.test(query)) return 'MARKETPLACE';
  return undefined;
}

function commercialPricesFor(
  query: string,
  matchedCompetitors: CompetitorIntelligenceRecord[]
): CommercialPriceMatch[] {
  if (!isPricingQuery(query)) return [];

  const records = matchedCompetitors.flatMap(record => record.commercialPrices.map(price => ({
    ...price,
    productId: record.productId,
    productName: record.brandName
  })));
  const evocheckMentioned = /\bevo(?:check)?\b/i.test(query);
  const allPrices = evocheckMentioned
    ? [...EVOCHECK_COMMERCIAL_PRICING.map(price => ({ ...price, productId: 'evocheck', productName: 'EvoCheck' })), ...records]
    : records;
  const channel = queryChannel(query);
  const patientOnly = /\bpatient\b/i.test(query);

  return allPrices.filter(price => {
    if (channel && price.channel !== channel) return false;
    if (patientOnly && price.priceType !== 'PATIENT') return false;
    if (/\bretail\b/i.test(query) && price.priceType !== 'RETAIL') return false;
    if (/\bpromotional\b/i.test(query) && price.priceType !== 'PROMOTIONAL') return false;
    return true;
  });
}

export function retrieveCompetitors(query: string): CompetitorRetrievalResult {
  const matchedCompetitors = COMPETITOR_INTELLIGENCE.filter(record => matchesQuery(record, query));
  const commercialPrices = commercialPricesFor(query, matchedCompetitors);

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
    unmatchedTerms,
    commercialPrices,
    pricingChannelRequired: isPricingQuery(query) && commercialPrices.length > 1 && !queryChannel(query)
  };
}

function formatFact(label: string, fact: CompetitorFact): string {
  const value = fact.value === null ? 'UNKNOWN' : String(fact.value);
  const provenance = `[${fact.status}]`;
  const source = fact.source ? ` Source: ${fact.source}.` : '';
  const sourceUrl = fact.sourceUrl ? ` Source URL: ${fact.sourceUrl}.` : '';
  const observedAt = fact.observedAt ? ` Observed: ${fact.observedAt}.` : '';
  const notes = fact.notes ? ` Note: ${fact.notes}` : '';
  return `- ${label}: ${value} ${provenance}.${source}${sourceUrl}${observedAt}${notes}`;
}

function formatRecord(record: CompetitorIntelligenceRecord): string {
  const commercialPrices = record.commercialPrices.length
    ? record.commercialPrices
        .map(price => `${price.priceType} / ${price.channel}: PKR ${price.valuePKR} [${price.status}]${price.sourceUrl ? ` Source URL: ${price.sourceUrl}.` : ''} Source: ${price.source}. Observed: ${price.observedAt}.${price.notes ? ` Note: ${price.notes}` : ''}`)
        .join('; ')
    : 'No channel-specific commercial price stored.';
  const marketPriceObservations = record.marketPriceObservations.length
    ? record.marketPriceObservations
        .map(observation => `PKR ${observation.valuePKR} (${observation.priceType}, observed ${observation.observedAt}, ${observation.source})`)
        .join('; ')
    : 'No current Pakistan market price observation stored.';

  return [
    `COMPETITOR: ${record.brandName}`,
    `Variant: ${record.variant}`,
    `Manufacturer: ${record.manufacturer}`,
    formatFact('Price PKR', record.facts.pricePKR),
    formatFact('Wear duration (days)', record.facts.wearDurationDays),
    formatFact('MARD %', record.facts.mardPercent),
    formatFact('Real-time CGM', record.facts.realTimeCGM),
    formatFact('Connectivity', record.facts.connectivity),
    formatFact('Scan workflow', record.facts.scanWorkflow),
    formatFact('Reader requirement', record.facts.readerRequirement),
    formatFact('Water resistance', record.facts.waterResistance),
    formatFact('Monitoring interval (minutes)', record.facts.monitoringIntervalMinutes),
    formatFact('Alarm capability', record.facts.alarmCapability),
    `Channel-specific commercial prices: ${commercialPrices}`,
    `Pakistan market price observations: ${marketPriceObservations}`,
    `Strengths: ${record.strengths.length ? record.strengths.join('; ') : 'Not stored in controlled knowledge base.'}`,
    `Weaknesses: ${record.weaknesses.length ? record.weaknesses.join('; ') : 'Not stored in controlled knowledge base.'}`,
    `Approved comparison facts: ${record.approvedComparisonFacts.length ? record.approvedComparisonFacts.join(' | ') : 'None.'}`,
    `Source notes: ${record.sourceNotes.join(' | ')}`
  ].join('\n');
}

export function buildCompetitorGroundingContext(query: string): CompetitorGroundingContext {
  const result = retrieveCompetitors(query);

  if (!result.matchedCompetitors.length && !result.commercialPrices.length) {
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

  const commercialPricingContext = result.commercialPrices.length
    ? [
        'CHANNEL-SPECIFIC COMMERCIAL PRICING:',
        ...result.commercialPrices.map(price => `- ${price.productName}: ${price.priceType}${price.channel === 'UNKNOWN' ? '' : ` / ${price.channel}`}: ${price.currency} ${price.valuePKR} [${price.status}]. Source: ${price.source}. Observed: ${price.observedAt}.${price.notes ? ` ${price.notes}` : ''}`),
        ...(result.pricingChannelRequired ? ['Channel context is required; present all available prices above and do not choose one arbitrarily.'] : [])
      ].join('\n')
    : '';

  return {
    matchedCompetitorIds: result.matchedCompetitors.map(record => record.productId),
    context: [
      'COMPETITOR INTELLIGENCE — CONTROLLED GROUNDING',
      'Use ONLY the competitor facts below for competitor-specific claims.',
      'Verification labels are mandatory provenance and must not be removed.',
      ...COMPETITOR_INTELLIGENCE_RULES.map((rule, index) => `${index + 1}. ${rule}`),
      ...(commercialPricingContext ? ['', commercialPricingContext] : []),
      '',
      ...result.matchedCompetitors.map(formatRecord).flatMap(block => [block, ''])
    ].join('\n').trim()
  };
}

export function getCompetitorRecord(productId: string): CompetitorIntelligenceRecord | undefined {
  return COMPETITOR_INTELLIGENCE.find(record => record.productId === productId);
}
