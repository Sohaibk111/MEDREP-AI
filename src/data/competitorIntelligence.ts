/**
 * MedRep AI v1.5 — Competitor Intelligence
 *
 * Controlled competitor facts for AI grounding.
 *
 * IMPORTANT:
 * - Existing project records are preserved but classified explicitly.
 * - USER_PROVIDED facts are not presented as independently verified claims.
 * - UNKNOWN fields must not be guessed by the AI.
 * - This file is intentionally separate from EvoCheck product truth so
 *   competitor updates can be governed independently.
 */

export type CompetitorFactStatus =
  | 'VERIFIED'
  | 'USER_PROVIDED'
  | 'NEEDS_VERIFICATION'
  | 'UNKNOWN';

export interface CompetitorFact<T = string | number | boolean | null> {
  value: T;
  status: CompetitorFactStatus;
  source?: string;
  notes?: string;
}

export interface CompetitorIntelligenceRecord {
  productId: string;
  brandName: string;
  manufacturer: string;
  facts: {
    pricePKR: CompetitorFact<number | null>;
    wearDurationDays: CompetitorFact<number | null>;
    mardPercent: CompetitorFact<number | null>;
    realTimeCGM: CompetitorFact<boolean | null>;
    connectivity: CompetitorFact<string | null>;
    readerRequirement: CompetitorFact<string | null>;
  };
  strengths: string[];
  weaknesses: string[];
  approvedComparisonFacts: string[];
  sourceNotes: string[];
}

/**
 * Initial dataset assembled from the existing MedRep AI competitor records
 * and previously supplied field intelligence. Do not silently upgrade a
 * USER_PROVIDED value to VERIFIED without adding an appropriate source.
 */
export const COMPETITOR_INTELLIGENCE: CompetitorIntelligenceRecord[] = [
  {
    productId: 'abbott-freestyle-libre',
    brandName: 'Abbott FreeStyle Libre (1 / 2)',
    manufacturer: 'Abbott Diabetes Care',
    facts: {
      pricePKR: {
        value: 16500,
        status: 'USER_PROVIDED',
        source: 'Existing MedRep AI project competitor record',
        notes: 'Existing project value; verify current Pakistan market price before quoting.'
      },
      wearDurationDays: {
        value: 14,
        status: 'USER_PROVIDED',
        source: 'Existing MedRep AI project competitor record'
      },
      mardPercent: {
        value: 9.2,
        status: 'USER_PROVIDED',
        source: 'Existing MedRep AI project competitor record',
        notes: 'Do not generalize across Libre generations/models without source verification.'
      },
      realTimeCGM: {
        value: true,
        status: 'USER_PROVIDED',
        source: 'Existing MedRep AI project competitor record'
      },
      connectivity: {
        value: null,
        status: 'UNKNOWN',
        notes: 'Current controlled dataset does not contain a sufficiently specific connectivity claim.'
      },
      readerRequirement: {
        value: 'Reader available',
        status: 'USER_PROVIDED',
        source: 'Existing MedRep AI project competitor record',
        notes: 'Do not infer reader requirement for every Libre generation from this field.'
      }
    },
    strengths: [
      'High global brand recognition',
      'Established doctor familiarity',
      'Compact reader available'
    ],
    weaknesses: [],
    approvedComparisonFacts: [
      'Existing project data records a 14-day wear duration for the specified Libre record.',
      'Existing project data records a MARD value of 9.2% for the specified Libre record.'
    ],
    sourceNotes: [
      'These values originate from the existing MedRep AI project record and require current-source verification before external commercial use.',
      'No unsupported claim of overall clinical superiority is permitted from these specifications alone.'
    ]
  },
  {
    productId: 'sibionics-cgm',
    brandName: 'SIBIONICS CGM',
    manufacturer: 'SIBIONICS Healthcare',
    facts: {
      pricePKR: {
        value: 13500,
        status: 'USER_PROVIDED',
        source: 'Existing MedRep AI project competitor record',
        notes: 'Existing project value; verify current Pakistan market price before quoting.'
      },
      wearDurationDays: {
        value: 14,
        status: 'USER_PROVIDED',
        source: 'Existing MedRep AI project competitor record'
      },
      mardPercent: {
        value: 8.83,
        status: 'USER_PROVIDED',
        source: 'Existing MedRep AI project competitor record'
      },
      realTimeCGM: {
        value: true,
        status: 'USER_PROVIDED',
        source: 'Previously supplied project competitor intelligence'
      },
      connectivity: {
        value: 'Direct BLE broadcasting',
        status: 'USER_PROVIDED',
        source: 'Existing MedRep AI project competitor record'
      },
      readerRequirement: {
        value: null,
        status: 'UNKNOWN',
        notes: 'Not sufficiently specified in the controlled dataset.'
      }
    },
    strengths: [
      'Direct BLE broadcasting',
      'Sleek mobile application UI',
      'Competitive pricing'
    ],
    weaknesses: [
      '14-day wear lifecycle compared with EvoCheck 15 days',
      'Limited official local distributor warranty in Pakistan'
    ],
    approvedComparisonFacts: [
      'Existing project data records a 14-day wear lifecycle for SIBIONICS.',
      'Existing project data records a MARD value of 8.83% for SIBIONICS.',
      'Existing project data records direct BLE broadcasting.'
    ],
    sourceNotes: [
      'These values originate from the existing MedRep AI project record and previously supplied field intelligence.',
      'Warranty/local-distribution statements must be re-verified before being used as current commercial claims.'
    ]
  },
  {
    productId: 'ican-sinocare',
    brandName: 'iCan / Sinocare iCan i3',
    manufacturer: 'Sinocare',
    facts: {
      pricePKR: {
        value: null,
        status: 'UNKNOWN',
        notes: 'No controlled current price is stored.'
      },
      wearDurationDays: {
        value: 15,
        status: 'USER_PROVIDED',
        source: 'Previously supplied project competitor intelligence'
      },
      mardPercent: {
        value: 8.7,
        status: 'USER_PROVIDED',
        source: 'Previously supplied project competitor intelligence',
        notes: 'Treat as approximate until model-specific source is added.'
      },
      realTimeCGM: {
        value: true,
        status: 'USER_PROVIDED',
        source: 'Previously supplied project competitor intelligence'
      },
      connectivity: {
        value: null,
        status: 'UNKNOWN'
      },
      readerRequirement: {
        value: null,
        status: 'UNKNOWN'
      }
    },
    strengths: [],
    weaknesses: [],
    approvedComparisonFacts: [
      'Previously supplied project intelligence records a 15-day wear duration for iCan i3.',
      'Previously supplied project intelligence records an approximate MARD of 8.7% for iCan i3.'
    ],
    sourceNotes: [
      'This record is explicitly USER_PROVIDED and is not independently verified in the current dataset.',
      'Model identity should be confirmed before using these figures in a doctor-facing comparison.'
    ]
  }
];

export const COMPETITOR_INTELLIGENCE_VERSION = 'v1.5.0-draft';

export const COMPETITOR_INTELLIGENCE_RULES = [
  'Use controlled competitor records as the primary source for comparisons.',
  'Never invent a missing competitor specification.',
  'Never convert a specification difference into a claim of overall clinical superiority without supporting evidence.',
  'Do not quote a USER_PROVIDED or NEEDS_VERIFICATION fact as independently verified.',
  'When a field is UNKNOWN, state that the current MedRep knowledge base does not contain the information.',
  'Keep competitor facts separate from EvoCheck approved product claims.',
  'Price data must be treated as time-sensitive and verified before external quoting.'
] as const;
