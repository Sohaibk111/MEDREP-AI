$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$dataFile = Join-Path $repo 'src/data/competitorIntelligence.ts'
$guardFile = Join-Path $repo 'src/services/competitorClaimGuard.ts'
$testFile = Join-Path $repo 'tests/test_v1_5_4_competitor_deterministic.ts'

if (-not (Test-Path $dataFile)) { throw "Missing $dataFile" }
if (-not (Test-Path $guardFile)) { throw "Missing $guardFile" }

function Backup-Once([string]$path) {
  $backup = "$path.bak-v1.5.4"
  if (-not (Test-Path $backup)) { Copy-Item $path $backup }
}

Backup-Once $dataFile
Backup-Once $guardFile

# 1) Correct Libre 1 MARD to the generation-specific adult value documented by ISPAD 2024.
$data = Get-Content -Raw -Encoding UTF8 $dataFile
$oldMard = @'
      mardPercent: {
        value: null,
        status: 'NEEDS_VERIFICATION',
        notes: 'Do not reuse the Libre 2 9.2% figure for Libre 1; published Libre 1 studies report different values depending on study/reference method.'
      },
'@
$newMard = @'
      mardPercent: {
        value: 11.4,
        status: 'VERIFIED',
        source: 'ISPAD 2024 consensus guideline, Table 2',
        sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11854985/',
        notes: 'Adult MARD for FreeStyle Libre 1. Keep separate from Libre 2 adult MARD of 9.2%.'
      },
'@
if ($data.Contains($oldMard)) {
  $data = $data.Replace($oldMard, $newMard)
  Set-Content -Path $dataFile -Value $data -Encoding UTF8
} elseif (-not $data.Contains("value: 11.4,") -or -not $data.Contains("FreeStyle Libre 1")) {
  throw 'Libre 1 MARD block was not found; refusing to guess-edit the data file.'
}

# 2) Import the authoritative EvoCheck master knowledge for deterministic comparisons.
$guard = Get-Content -Raw -Encoding UTF8 $guardFile
$importMarker = "import { EVOCHECK_COMMERCIAL_PRICING } from '../data/competitorIntelligence';"
$importReplacement = "$importMarker`r`nimport { EVOCHECK_MASTER_KNOWLEDGE } from '../data/productKnowledge';"
if (-not $guard.Contains("EVOCHECK_MASTER_KNOWLEDGE")) {
  if (-not $guard.Contains($importMarker)) { throw 'Expected competitor pricing import was not found.' }
  $guard = $guard.Replace($importMarker, $importReplacement)
}

# 3) Replace only the sanitize tail. All existing validation logic above remains untouched.
$sanitizeMarker = 'export function sanitizeCompetitorGeneratedText('
$prefixIndex = $guard.IndexOf($sanitizeMarker)
if ($prefixIndex -lt 0) { throw 'sanitizeCompetitorGeneratedText marker was not found.' }
$prefix = $guard.Substring(0, $prefixIndex)

$newTail = @'
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
    lines.push(`[FACT] EvoCheck Premium Linx CGM — ${evoPrices.join('; ')}.`);
  }

  for (const record of records) {
    if (record.commercialPrices.length) {
      const prices = record.commercialPrices.map(price => `${price.priceType.toLowerCase()} via ${price.channel.toLowerCase()}: PKR ${price.valuePKR.toLocaleString()}`);
      lines.push(`[FACT] ${record.brandName} — ${prices.join('; ')}.`);
    } else if (record.facts.pricePKR.value !== null && record.facts.pricePKR.status !== 'UNKNOWN') {
      lines.push(`[FACT] ${record.brandName} — Pakistan price: PKR ${record.facts.pricePKR.value.toLocaleString()} [${record.facts.pricePKR.status}].`);
    } else {
      lines.push(`[FACT] ${record.brandName} — current Pakistan price is not established in the controlled knowledge base.`);
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
'@

$guard = $prefix + $newTail
Set-Content -Path $guardFile -Value $guard -Encoding UTF8

# 4) Add deterministic regression tests without modifying the existing 24-test suite.
$test = @'
import assert from 'node:assert/strict';
import { sanitizeCompetitorGeneratedText } from '../src/services/competitorClaimGuard';

const libre1Mard = sanitizeCompetitorGeneratedText(
  'What is the MARD of FreeStyle Libre 1 only?',
  'Libre 1 has MARD 9.2%.',
  ['abbott-freestyle-libre-1']
);
assert.equal(libre1Mard.safe, true);
assert.match(libre1Mard.text, /11\.4%/);
assert.doesNotMatch(libre1Mard.text, /9\.2%/);

const libre2Mard = sanitizeCompetitorGeneratedText(
  'What is the MARD of FreeStyle Libre 2 only?',
  'Libre 2 has MARD 11.4%.',
  ['abbott-freestyle-libre-2']
);
assert.equal(libre2Mard.safe, true);
assert.match(libre2Mard.text, /9\.2%/);

const libre1Comparison = sanitizeCompetitorGeneratedText(
  'Compare EvoCheck with FreeStyle Libre 1',
  'EvoCheck vs Libre 1: Libre 2 MARD 9.2%, IP68.',
  ['abbott-freestyle-libre-1']
);
assert.equal(libre1Comparison.safe, true);
assert.match(libre1Comparison.text, /11\.4%/);
assert.match(libre1Comparison.text, /IP27/);
assert.match(libre1Comparison.text, /15 days/);
assert.doesNotMatch(libre1Comparison.text, /Libre 2/);

const sibionicsComparison = sanitizeCompetitorGeneratedText(
  'Compare EvoCheck with SIBIONICS',
  'EvoCheck vs SIBIONICS.',
  ['sibionics-gs1']
);
assert.equal(sibionicsComparison.safe, true);
assert.match(sibionicsComparison.text, /SIBIONICS GS1/);
assert.match(sibionicsComparison.text, /8\.83%/);
assert.match(sibionicsComparison.text, /15 days/);
assert.doesNotMatch(sibionicsComparison.text, /Libre/);

const sibionicsPrice = sanitizeCompetitorGeneratedText(
  'What is the SIBIONICS price?',
  'SIBIONICS costs PKR 13,700.',
  ['sibionics-gs1']
);
assert.equal(sibionicsPrice.safe, true);
assert.match(sibionicsPrice.text, /PKR 14,000/);
assert.match(sibionicsPrice.text, /PKR 12,600/);

console.log('v1.5.4 deterministic competitor response: 5/5 passed');
'@
Set-Content -Path $testFile -Value $test -Encoding UTF8

Write-Host 'v1.5.4 competitor deterministic fix applied.'
Write-Host 'Backups created with .bak-v1.5.4 suffix.'
