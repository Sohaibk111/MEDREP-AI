/**
 * MedRep AI v1.5 — Competitor Intelligence
 *
 * Controlled competitor facts for AI grounding.
 *
 * IMPORTANT:
 * - Competitor generations/variants are kept separate when their behavior or
 *   evidence differs materially.
 * - USER_PROVIDED facts are not presented as independently verified claims.
 * - UNKNOWN fields must not be guessed by the AI.
 * - Pakistan pricing is time-sensitive market observation, not permanent
 *   product truth.
 * - This file is intentionally separate from EvoCheck product truth so
 *   competitor updates can be governed independently.
 */

export type CompetitorFactStatus =
  | 'VERIFIED'
  | 'USER_PROVIDED'
  | 'NEEDS_VERIFICATION'
  | 'UNKNOWN'
  | 'MARKET_OBSERVED';

export interface CompetitorFact<T = string | number | boolean | null> {
  value: T;
  status: CompetitorFactStatus;
  source?: string;
  sourceUrl?: string;
  observedAt?: string;
  notes?: string;
}

export interface MarketPriceObservation {
  market: 'Pakistan';
  currency: 'PKR';
  valuePKR: number;
  priceType: 'RETAIL' | 'PROMOTIONAL' | 'BUNDLE';
  status: 'MARKET_OBSERVED';
  source: string;
  sourceUrl: string;
  observedAt: string;
  notes?: string;
}

export interface CompetitorIntelligenceRecord {
  productId: string;
  brandName: string;
  manufacturer: string;
  variant: string;
  facts: {
    pricePKR: CompetitorFact<number | null>;
    wearDurationDays: CompetitorFact<number | null>;
    mardPercent: CompetitorFact<number | null>;
    realTimeCGM: CompetitorFact<boolean | null>;
    connectivity: CompetitorFact<string | null>;
    scanWorkflow: CompetitorFact<string | null>;
    readerRequirement: CompetitorFact<string | null>;
    waterResistance: CompetitorFact<string | null>;
    monitoringIntervalMinutes: CompetitorFact<number | null>;
    alarmCapability: CompetitorFact<string | null>;
  };
  marketPriceObservations: MarketPriceObservation[];
  strengths: string[];
  weaknesses: string[];
  approvedComparisonFacts: string[];
  sourceNotes: string[];
}

const ABBOTT_LIBRE_1_SOURCES = {
  product: 'Abbott FreeStyle Libre Sensor product documentation',
  productUrl: 'https://www.freestyle.abbott/ae-en/product/freestyle-libre-sensor.html',
  nfcUrl: 'https://www.freestyle.abbott/sa-en/support/faq/question-answer.html?q=freestyle-librelink-tab-question-5',
  scanUrl: 'https://www.support.freestyle.abbott/hc/en-ca/articles/14792941559703-How-to-scan-my-FreeStyle-Libre-sensor-with-my-phone',
  ipUrl: 'https://www.freestyle.abbott/sa-en/support/faq/question-answer.html?q=the-freestyle-libre-system-tab-question-25'
} as const;

const ABBOTT_LIBRE_2_SOURCES = {
  product: 'Abbott FreeStyle Libre 2 product documentation',
  productUrl: 'https://www.freestyle.abbott/sa-en/product/freestyle-libre-2.html',
  accuracyUrl: 'https://www.freestyle.abbott/ie-en/support/faq/question-answer.html?q=FSL+2+Systemquestion-13',
  professionalUrl: 'https://pro.freestyle.abbott/content/adc/pro/countries/uk-en/freestyle-portfolio/freestyle-libre-systems/freestyle-libre-2.html',
  pakistanUrl: 'https://www.buyfslibre.pk/'
} as const;

const SIBIONICS_GS1_SOURCES = {
  product: 'SIBIONICS GS1 official product page',
  productUrl: 'https://en.sibionics.com/GS1/index.html',
  detailUrl: 'https://www.sibionicscgm.com/products/special-bulk-purchase-sibionics-gs1-cgm-continuous-glucose-monitoring-system'
} as const;

const ICAN_I3_SOURCES = {
  product: 'Sinocare iCan i3 official product page',
  productUrl: 'https://www.icancgm.com/products/ican-i3/',
  pakistanUrl: 'https://www.icancgm.pk/shop/product/sinocare-ican-cgm-i3',
  pakistanAltUrl: 'https://cgmpakistan.com/product/sinocare-ican-i3-cgm-15-days-continuous-glucose-monitoring-via-ican-cgm-app-full-kit'
} as const;

/**
 * Current controlled dataset. Web-verified specifications are explicitly
 * sourced; Pakistan prices are time-sensitive market observations.
 */
export const COMPETITOR_INTELLIGENCE: CompetitorIntelligenceRecord[] = [
  {
    productId: 'abbott-freestyle-libre-1',
    brandName: 'Abbott FreeStyle Libre 1',
    manufacturer: 'Abbott Diabetes Care',
    variant: 'Original FreeStyle Libre / 14-day sensor',
    facts: {
      pricePKR: {
        value: 16500,
        status: 'USER_PROVIDED',
        source: 'Existing MedRep AI project competitor record',
        notes: 'Legacy project value; current Pakistan price should be verified before quoting.'
      },
      wearDurationDays: {
        value: 14,
        status: 'VERIFIED',
        source: ABBOTT_LIBRE_1_SOURCES.product,
        sourceUrl: ABBOTT_LIBRE_1_SOURCES.productUrl
      },
      mardPercent: {
        value: null,
        status: 'NEEDS_VERIFICATION',
        notes: 'Published studies report different MARD values depending on population/reference method; do not reuse the Libre 2 9.2% figure for Libre 1.'
      },
      realTimeCGM: {
        value: false,
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre scan-based product documentation',
        sourceUrl: ABBOTT_LIBRE_1_SOURCES.productUrl,
        notes: 'The sensor continuously stores glucose data, but the classic system uses scan-based access to readings.'
      },
      connectivity: {
        value: 'NFC',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre NFC support',
        sourceUrl: ABBOTT_LIBRE_1_SOURCES.nfcUrl
      },
      scanWorkflow: {
        value: 'Scan the sensor to obtain the current glucose reading and stored history.',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre scan instructions',
        sourceUrl: ABBOTT_LIBRE_1_SOURCES.scanUrl
      },
      readerRequirement: {
        value: 'Reader or compatible NFC-enabled smartphone/app, depending on supported configuration and market.',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre app/reader documentation',
        sourceUrl: ABBOTT_LIBRE_1_SOURCES.nfcUrl
      },
      waterResistance: {
        value: 'IP27',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre water-resistance FAQ',
        sourceUrl: ABBOTT_LIBRE_1_SOURCES.ipUrl,
        notes: 'Tested for immersion up to 1 meter for up to 30 minutes.'
      },
      monitoringIntervalMinutes: {
        value: 15,
        status: 'VERIFIED',
        source: ABBOTT_LIBRE_1_SOURCES.product,
        sourceUrl: ABBOTT_LIBRE_1_SOURCES.productUrl,
        notes: 'The sensor stores glucose readings every 15 minutes; this should not be conflated with scan frequency.'
      },
      alarmCapability: {
        value: 'No automatic low/high alarms; low/high events require a sensor scan in the classic system.',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre support',
        sourceUrl: 'https://www.freestyle.abbott/en-in/support/does-the-freestyle-libre-system-have-alarms.html'
      }
    },
    marketPriceObservations: [],
    strengths: [
      'High global brand recognition',
      'Established doctor familiarity',
      'Reader and compatible smartphone workflow available'
    ],
    weaknesses: [],
    approvedComparisonFacts: [
      'FreeStyle Libre 1 is a 14-day scan-based system.',
      'Abbott documentation identifies NFC as the wireless technology used for sensor scanning.',
      'Abbott documentation identifies IP27 water resistance for the classic FreeStyle Libre sensor.',
      'Do not use the Libre 2 9.2% MARD figure as a Libre 1 figure.'
    ],
    sourceNotes: [
      'Primary Abbott product/support sources are used for the controlled technical facts.',
      'Libre 1 MARD is intentionally not stored as a single verified value because published results vary by study design and reference method.',
      'Legacy Pakistan price remains USER_PROVIDED and is not a current verified market quote.'
    ]
  },
  {
    productId: 'abbott-freestyle-libre-2',
    brandName: 'Abbott FreeStyle Libre 2',
    manufacturer: 'Abbott Diabetes Care',
    variant: 'FreeStyle Libre 2 Sensor',
    facts: {
      pricePKR: {
        value: 18975,
        status: 'MARKET_OBSERVED',
        source: 'FreeStyle Libre Pakistan webshop',
        sourceUrl: ABBOTT_LIBRE_2_SOURCES.pakistanUrl,
        observedAt: '2026-09-08',
        notes: 'Current observed Pakistan webshop price; promotions/bundles may change the effective price.'
      },
      wearDurationDays: {
        value: 14,
        status: 'VERIFIED',
        source: ABBOTT_LIBRE_2_SOURCES.product,
        sourceUrl: ABBOTT_LIBRE_2_SOURCES.productUrl
      },
      mardPercent: {
        value: 9.2,
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre 2 accuracy performance',
        sourceUrl: ABBOTT_LIBRE_2_SOURCES.accuracyUrl,
        notes: 'Overall adult MARD for the FreeStyle Libre 2 system.'
      },
      realTimeCGM: {
        value: true,
        status: 'VERIFIED',
        source: ABBOTT_LIBRE_2_SOURCES.professionalUrl,
        sourceUrl: ABBOTT_LIBRE_2_SOURCES.professionalUrl,
        notes: 'Automatic real-time readings are supported when the sensor and compatible smartphone are connected; regional/device behavior can vary.'
      },
      connectivity: {
        value: 'Bluetooth Low Energy with compatible smartphone; NFC is used for sensor start/scan workflows in supported configurations.',
        status: 'VERIFIED',
        source: ABBOTT_LIBRE_2_SOURCES.professionalUrl,
        sourceUrl: ABBOTT_LIBRE_2_SOURCES.professionalUrl
      },
      scanWorkflow: {
        value: 'Sensor scan is used to start/access readings in supported workflows; connected compatible smartphones can receive readings automatically in real time.',
        status: 'VERIFIED',
        source: ABBOTT_LIBRE_2_SOURCES.productUrl,
        sourceUrl: ABBOTT_LIBRE_2_SOURCES.productUrl,
        notes: 'Do not describe Libre 2 as identical to classic Libre 1 scanning behavior.'
      },
      readerRequirement: {
        value: 'Compatible smartphone/app or FreeStyle Libre 2 reader, depending on configuration and market.',
        status: 'VERIFIED',
        source: ABBOTT_LIBRE_2_SOURCES.product,
        sourceUrl: ABBOTT_LIBRE_2_SOURCES.productUrl
      },
      waterResistance: {
        value: 'IP27',
        status: 'VERIFIED',
        source: 'FreeStyle Libre 2 system specifications',
        sourceUrl: 'https://freestyleserver.com/Payloads/IFU/2023/q4/DOC48621_rev_A/English/Assets/mi_system_specifications.html',
        notes: 'Up to 1 meter for up to 30 minutes for the referenced Libre 2 sensor specification.'
      },
      monitoringIntervalMinutes: {
        value: 1,
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre 2 product information',
        sourceUrl: ABBOTT_LIBRE_2_SOURCES.professionalUrl,
        notes: 'Abbott states the system checks for alarms every minute; this should not be generalized to every Libre generation.'
      },
      alarmCapability: {
        value: 'Optional low glucose, high glucose, and signal-loss alarms.',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre 2 alarms',
        sourceUrl: 'https://www.freestyle.abbott/ie-en/products/freestyle-libre-2/freestyle-libre-2-alarms.html'
      }
    },
    marketPriceObservations: [
      {
        market: 'Pakistan',
        currency: 'PKR',
        valuePKR: 18975,
        priceType: 'RETAIL',
        status: 'MARKET_OBSERVED',
        source: 'FreeStyle Libre Pakistan webshop',
        sourceUrl: ABBOTT_LIBRE_2_SOURCES.pakistanUrl,
        observedAt: '2026-09-08'
      },
      {
        market: 'Pakistan',
        currency: 'PKR',
        valuePKR: 17999,
        priceType: 'PROMOTIONAL',
        status: 'MARKET_OBSERVED',
        source: 'CGM Pakistan',
        sourceUrl: 'https://cgmpakistan.com/',
        observedAt: '2026-09-08'
      },
      {
        market: 'Pakistan',
        currency: 'PKR',
        valuePKR: 19500,
        priceType: 'RETAIL',
        status: 'MARKET_OBSERVED',
        source: 'CGM Shop Online Pakistan',
        sourceUrl: 'https://cgmshoponline.com/',
        observedAt: '2026-09-08'
      }
    ],
    strengths: [
      'Established Abbott ecosystem',
      'Real-time readings and optional alarms',
      'Strong global doctor familiarity'
    ],
    weaknesses: [],
    approvedComparisonFacts: [
      'FreeStyle Libre 2 has 14-day sensor wear.',
      'Abbott reports 9.2% overall MARD for the Libre 2 sensor in adults.',
      'Libre 2 supports real-time readings and optional alarms in supported configurations.',
      'Pakistan retail observations currently cluster around PKR 17,999–19,500 depending on seller/promotion.'
    ],
    sourceNotes: [
      'Technical claims are sourced from Abbott product/support documentation.',
      'Pakistan pricing is market-observed and must be rechecked before external quoting.',
      'Libre 2 should not be merged with Libre 1 or Libre 2 Plus when making generation-specific claims.'
    ]
  },
  {
    productId: 'sibionics-gs1',
    brandName: 'SIBIONICS GS1',
    manufacturer: 'SIBIONICS Healthcare',
    variant: 'GS1 Continuous Glucose Monitoring System',
    facts: {
      pricePKR: {
        value: null,
        status: 'UNKNOWN',
        notes: 'No sufficiently reliable current Pakistan-local retail price was found in the reviewed sources.'
      },
      wearDurationDays: {
        value: 14,
        status: 'VERIFIED',
        source: SIBIONICS_GS1_SOURCES.product,
        sourceUrl: SIBIONICS_GS1_SOURCES.productUrl
      },
      mardPercent: {
        value: 8.83,
        status: 'VERIFIED',
        source: SIBIONICS_GS1_SOURCES.product,
        sourceUrl: SIBIONICS_GS1_SOURCES.productUrl,
        notes: 'Adult MARD; SIBIONICS also reports a separate pediatric figure.'
      },
      realTimeCGM: {
        value: true,
        status: 'VERIFIED',
        source: SIBIONICS_GS1_SOURCES.detailUrl,
        sourceUrl: SIBIONICS_GS1_SOURCES.detailUrl
      },
      connectivity: {
        value: 'Bluetooth; readings update every 5 minutes after activation.',
        status: 'VERIFIED',
        source: SIBIONICS GS1 official product detail',
        sourceUrl: SIBIONICS_GS1_SOURCES.detailUrl
      },
      scanWorkflow: {
        value: 'Initial activation requires a scan; after activation, readings update via Bluetooth without routine scanning.',
        status: 'VERIFIED',
        source: SIBIONICS official disclaimer/product detail',
        sourceUrl: SIBIONICS_GS1_SOURCES.detailUrl
      },
      readerRequirement: {
        value: 'Compatible smartphone/app workflow; no separate reader requirement is stored as a verified claim.',
        status: 'NEEDS_VERIFICATION',
        source: SIBIONICS official product information',
        sourceUrl: SIBIONICS_GS1_SOURCES.productUrl
      },
      waterResistance: {
        value: 'IP28',
        status: 'VERIFIED',
        source: SIBIONICS GS1 official product page',
        sourceUrl: SIBIONICS_GS1_SOURCES.productUrl
      },
      monitoringIntervalMinutes: {
        value: 5,
        status: 'VERIFIED',
        source: SIBIONICS GS1 official product detail',
        sourceUrl: SIBIONICS_GS1_SOURCES.detailUrl
      },
      alarmCapability: {
        value: 'Customizable glucose alarms.',
        status: 'VERIFIED',
        source: SIBIONICS GS1 official product page',
        sourceUrl: SIBIONICS_GS1_SOURCES.productUrl
      }
    },
    marketPriceObservations: [],
    strengths: [
      '14-day continuous monitoring',
      'Bluetooth-based scan-free ongoing readings after activation',
      'IP28 water resistance'
    ],
    weaknesses: [
      '14-day wear lifecycle compared with EvoCheck 15 days',
      'Current Pakistan-local retail price not sufficiently verified in the reviewed sources'
    ],
    approvedComparisonFacts: [
      'SIBIONICS GS1 has 14-day wear, 8.83% adult MARD, IP28 water resistance, and 5-minute Bluetooth updates.',
      'Initial activation requires a scan; routine ongoing reading retrieval is Bluetooth-based.',
      'Do not invent a Pakistan retail price when the controlled market record is UNKNOWN.'
    ],
    sourceNotes: [
      'Technical specifications are sourced from SIBIONICS official product pages.',
      'Pakistan availability was observed in third-party listings, but a sufficiently reliable current local retail price was not established, so price remains UNKNOWN.'
    ]
  },
  {
    productId: 'ican-sinocare-ican-i3',
    brandName: 'Sinocare iCan i3',
    manufacturer: 'Sinocare',
    variant: 'iCan i3 Continuous Glucose Monitoring System',
    facts: {
      pricePKR: {
        value: 12900,
        status: 'MARKET_OBSERVED',
        source: 'iCan Pakistan official online store',
        sourceUrl: ICAN_I3_SOURCES.pakistanUrl,
        observedAt: '2026-09-08',
        notes: 'Current observed Pakistan retail price; promotional sellers may list lower.'
      },
      wearDurationDays: {
        value: 15,
        status: 'VERIFIED',
        source: ICAN_I3_SOURCES.product,
        sourceUrl: ICAN_I3_SOURCES.productUrl
      },
      mardPercent: {
        value: 8.71,
        status: 'VERIFIED',
        source: ICAN_I3_SOURCES.product,
        sourceUrl: ICAN_I3_SOURCES.productUrl,
        notes: 'Overall adult MARD reported by the manufacturer.'
      },
      realTimeCGM: {
        value: true,
        status: 'VERIFIED',
        source: ICAN_I3_SOURCES.product,
        sourceUrl: ICAN_I3_SOURCES.productUrl
      },
      connectivity: {
        value: 'Real-time connectivity to the iCan app.',
        status: 'VERIFIED',
        source: ICAN_I3_SOURCES.product,
        sourceUrl: ICAN_I3_SOURCES.productUrl
      },
      scanWorkflow: {
        value: 'Scan-free glucose readings after sensor activation.',
        status: 'VERIFIED',
        source: ICAN_I3_SOURCES.product,
        sourceUrl: ICAN_I3_SOURCES.productUrl
      },
      readerRequirement: {
        value: 'Smartphone/app workflow; separate reader requirement not stated in the reviewed official product page.',
        status: 'NEEDS_VERIFICATION',
        source: ICAN_I3_SOURCES.product,
        sourceUrl: ICAN_I3_SOURCES.productUrl
      },
      waterResistance: {
        value: 'IP28',
        status: 'VERIFIED',
        source: ICAN_I3_SOURCES.product,
        sourceUrl: ICAN_I3_SOURCES.productUrl
      },
      monitoringIntervalMinutes: {
        value: 3,
        status: 'VERIFIED',
        source: ICAN_I3_SOURCES.product,
        sourceUrl: ICAN_I3_SOURCES.productUrl
      },
      alarmCapability: {
        value: 'Customizable low and high glucose alerts.',
        status: 'VERIFIED',
        source: ICAN_I3_SOURCES.product,
        sourceUrl: ICAN_I3_SOURCES.productUrl
      }
    },
    marketPriceObservations: [
      {
        market: 'Pakistan',
        currency: 'PKR',
        valuePKR: 12900,
        priceType: 'RETAIL',
        status: 'MARKET_OBSERVED',
        source: 'iCan Pakistan official online store',
        sourceUrl: ICAN_I3_SOURCES.pakistanUrl,
        observedAt: '2026-09-08'
      },
      {
        market: 'Pakistan',
        currency: 'PKR',
        valuePKR: 11500,
        priceType: 'PROMOTIONAL',
        status: 'MARKET_OBSERVED',
        source: 'CGM Pakistan',
        sourceUrl: ICAN_I3_SOURCES.pakistanAltUrl,
        observedAt: '2026-09-08'
      },
      {
        market: 'Pakistan',
        currency: 'PKR',
        valuePKR: 12500,
        priceType: 'PROMOTIONAL',
        status: 'MARKET_OBSERVED',
        source: 'CGM Shop Online Pakistan',
        sourceUrl: 'https://cgmshoponline.com/',
        observedAt: '2026-09-08'
      }
    ],
    strengths: [
      '15-day wear',
      '8.71% adult MARD reported by manufacturer',
      'Scan-free real-time monitoring',
      'IP28 water resistance'
    ],
    weaknesses: [],
    approvedComparisonFacts: [
      'iCan i3 has 15-day wear, 8.71% adult MARD, 3-minute monitoring, and IP28 water resistance.',
      'The official iCan product page describes scan-free glucose readings.',
      'Pakistan price observations currently range from approximately PKR 11,500 to PKR 12,900 depending on seller/promotion.'
    ],
    sourceNotes: [
      'Technical specifications are sourced from Sinocare/iCan official product information.',
      'Pakistan pricing is time-sensitive and should be reconfirmed before quoting.'
    ]
  }
];

export const COMPETITOR_INTELLIGENCE_VERSION = 'v1.5.4-pakistan-evidence';

export const COMPETITOR_INTELLIGENCE_RULES = [
  'Use controlled competitor records as the primary source for comparisons.',
  'Keep product generations/variants separate when their workflows or specifications differ.',
  'Never invent a missing competitor specification.',
  'Never convert a specification difference into a claim of overall clinical superiority without supporting evidence.',
  'Do not quote a USER_PROVIDED or NEEDS_VERIFICATION fact as independently verified.',
  'MARKET_OBSERVED prices are time-sensitive and must be described as current observations, not permanent product truth.',
  'When a field is UNKNOWN, state that the current MedRep knowledge base does not contain the information.',
  'Keep competitor facts separate from EvoCheck approved product claims.',
  'Do not compare MARD values across different product generations or studies as if they were automatically head-to-head clinical evidence.'
] as const;
