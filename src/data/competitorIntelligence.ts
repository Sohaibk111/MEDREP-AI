/**
 * MedRep AI v1.5 — controlled competitor intelligence.
 *
 * Generation-specific evidence is kept separate. Pakistan prices are
 * time-sensitive market observations and must not be treated as permanent
 * product truth.
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

export type CommercialPriceType = 'RETAIL' | 'PATIENT' | 'PROMOTIONAL' | 'BUNDLE';
export type CommercialPriceChannel = 'DISTRIBUTION' | 'ONLINE' | 'MARKETPLACE' | 'UNKNOWN';

export interface CommercialPriceObservation {
  market: 'Pakistan';
  currency: 'PKR';
  valuePKR: number;
  priceType: CommercialPriceType;
  channel: CommercialPriceChannel;
  status: Extract<CompetitorFactStatus, 'VERIFIED' | 'USER_PROVIDED' | 'NEEDS_VERIFICATION'>;
  source: string;
  sourceUrl?: string;
  observedAt: string;
  notes?: string;
}

export const EVOCHECK_COMMERCIAL_PRICING: CommercialPriceObservation[] = [
  {
    market: 'Pakistan', currency: 'PKR', valuePKR: 12900, priceType: 'PATIENT', channel: 'DISTRIBUTION',
    status: 'USER_PROVIDED', source: 'Current Pakistan commercial field intelligence', observedAt: '2026-09-08',
    notes: 'Patient price via distribution; keep distinct from public online pricing.'
  },
  {
    market: 'Pakistan', currency: 'PKR', valuePKR: 13600, priceType: 'PATIENT', channel: 'ONLINE',
    status: 'USER_PROVIDED', source: 'Current Pakistan commercial field intelligence', observedAt: '2026-09-08',
    notes: 'Patient price online; productKnowledge.ts remains the product-truth source for this value.'
  }
];

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
  commercialPrices: CommercialPriceObservation[];
  strengths: string[];
  weaknesses: string[];
  approvedComparisonFacts: string[];
  sourceNotes: string[];
}

const ABBOTT_LIBRE_1 = {
  product: 'https://www.freestyle.abbott/ae-en/product/freestyle-libre-sensor.html',
  nfc: 'https://www.freestyle.abbott/sa-en/support/faq/question-answer.html?q=freestyle-librelink-tab-question-5',
  scan: 'https://www.support.freestyle.abbott/hc/en-ca/articles/14792941559703-How-to-scan-my-FreeStyle-Libre-sensor-with-my-phone',
  ip: 'https://www.freestyle.abbott/sa-en/support/faq/question-answer.html?q=the-freestyle-libre-system-tab-question-25'
} as const;

const ABBOTT_LIBRE_2 = {
  product: 'https://www.freestyle.abbott/sa-en/product/freestyle-libre-2.html',
  accuracy: 'https://www.freestyle.abbott/ie-en/support/faq/question-answer.html?q=FSL+2+Systemquestion-13',
  professional: 'https://pro.freestyle.abbott/content/adc/pro/countries/uk-en/freestyle-portfolio/freestyle-libre-systems/freestyle-libre-2.html',
  ip: 'https://freestyleserver.com/Payloads/IFU/2023/q4/DOC48621_rev_A/English/Assets/mi_system_specifications.html',
  pakistan: 'https://www.buyfslibre.pk/'
} as const;

const SIBIONICS_GS1 = {
  product: 'https://en.sibionics.com/GS1/index.html',
  detail: 'https://www.sibionicscgm.com/products/special-bulk-purchase-sibionics-gs1-cgm-continuous-glucose-monitoring-system'
} as const;

const ICAN_I3 = {
  product: 'https://www.icancgm.com/products/ican-i3/',
  pakistan: 'https://www.icancgm.pk/shop/product/sinocare-ican-cgm-i3',
  pakistanAlt: 'https://cgmpakistan.com/product/sinocare-ican-i3-cgm-15-days-continuous-glucose-monitoring-via-ican-cgm-app-full-kit'
} as const;

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
        source: 'Existing MedRep AI project record',
        notes: 'Legacy value; verify current Pakistan price before quoting.'
      },
      wearDurationDays: {
        value: 14,
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre product documentation',
        sourceUrl: ABBOTT_LIBRE_1.product
      },
      mardPercent: {
        value: 11.4,
        status: 'VERIFIED',
        source: 'ISPAD 2024 consensus guideline, Table 2',
        sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11854985/',
        notes: 'Adult MARD for FreeStyle Libre 1. Keep separate from Libre 2 adult MARD of 9.2%.'
      },
      realTimeCGM: {
        value: false,
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre scan-based documentation',
        sourceUrl: ABBOTT_LIBRE_1.product
      },
      connectivity: {
        value: 'NFC',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre NFC support',
        sourceUrl: ABBOTT_LIBRE_1.nfc
      },
      scanWorkflow: {
        value: 'Scan the sensor to obtain the current glucose reading and stored history.',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre scan instructions',
        sourceUrl: ABBOTT_LIBRE_1.scan
      },
      readerRequirement: {
        value: 'Reader or compatible NFC-enabled smartphone/app, depending on supported configuration and market.',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre NFC/app documentation',
        sourceUrl: ABBOTT_LIBRE_1.nfc
      },
      waterResistance: {
        value: 'IP27',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre water-resistance FAQ',
        sourceUrl: ABBOTT_LIBRE_1.ip,
        notes: 'Up to 1 meter for up to 30 minutes.'
      },
      monitoringIntervalMinutes: {
        value: 15,
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre product documentation',
        sourceUrl: ABBOTT_LIBRE_1.product,
        notes: 'Sensor stores readings every 15 minutes; this is not scan frequency.'
      },
      alarmCapability: {
        value: 'No automatic low/high alarms; low/high events require a sensor scan in the classic system.',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre support',
        sourceUrl: 'https://www.freestyle.abbott/en-in/support/does-the-freestyle-libre-system-have-alarms.html'
      }
    },
    marketPriceObservations: [],
    commercialPrices: [],
    strengths: ['High global brand recognition', 'Established doctor familiarity'],
    weaknesses: [],
    approvedComparisonFacts: [
      'Libre 1 is a 14-day scan-based system.',
      'NFC and IP27 are verified for the classic Libre sensor.',
      'Do not use the Libre 2 9.2% MARD figure as a Libre 1 figure.'
    ],
    sourceNotes: [
      'Primary Abbott sources support the technical facts.',
      'Libre 1 MARD remains NEEDS_VERIFICATION because the reviewed literature is not a single generation-specific canonical value.',
      'Legacy Pakistan price is USER_PROVIDED.'
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
        sourceUrl: ABBOTT_LIBRE_2.pakistan,
        observedAt: '2026-09-08'
      },
      wearDurationDays: {
        value: 14,
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre 2 product documentation',
        sourceUrl: ABBOTT_LIBRE_2.product
      },
      mardPercent: {
        value: 9.2,
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre 2 accuracy performance',
        sourceUrl: ABBOTT_LIBRE_2.accuracy,
        notes: 'Overall adult MARD for Libre 2.'
      },
      realTimeCGM: {
        value: true,
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre 2 professional product information',
        sourceUrl: ABBOTT_LIBRE_2.professional
      },
      connectivity: {
        value: 'Bluetooth Low Energy with compatible smartphone; NFC is used for sensor start/scan workflows in supported configurations.',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre 2 professional product information',
        sourceUrl: ABBOTT_LIBRE_2.professional
      },
      scanWorkflow: {
        value: 'Scan may be used to start/access readings in supported workflows; compatible smartphones can receive readings automatically in real time when connected.',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre 2 product information',
        sourceUrl: ABBOTT_LIBRE_2.product
      },
      readerRequirement: {
        value: 'Compatible smartphone/app or FreeStyle Libre 2 reader, depending on configuration and market.',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre 2 product information',
        sourceUrl: ABBOTT_LIBRE_2.product
      },
      waterResistance: {
        value: 'IP27',
        status: 'VERIFIED',
        source: 'FreeStyle Libre 2 system specifications',
        sourceUrl: ABBOTT_LIBRE_2.ip
      },
      monitoringIntervalMinutes: {
        value: 1,
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre 2 product information',
        sourceUrl: ABBOTT_LIBRE_2.professional,
        notes: 'Abbott states alarm checks every minute; do not generalize this to every Libre generation.'
      },
      alarmCapability: {
        value: 'Optional low glucose, high glucose, and signal-loss alarms.',
        status: 'VERIFIED',
        source: 'Abbott FreeStyle Libre 2 alarms',
        sourceUrl: 'https://www.freestyle.abbott/ie-en/products/freestyle-libre-2/freestyle-libre-2-alarms.html'
      }
    },
    marketPriceObservations: [
      { market: 'Pakistan', currency: 'PKR', valuePKR: 18975, priceType: 'RETAIL', status: 'MARKET_OBSERVED', source: 'FreeStyle Libre Pakistan webshop', sourceUrl: ABBOTT_LIBRE_2.pakistan, observedAt: '2026-09-08' },
      { market: 'Pakistan', currency: 'PKR', valuePKR: 17999, priceType: 'PROMOTIONAL', status: 'MARKET_OBSERVED', source: 'CGM Pakistan', sourceUrl: 'https://cgmpakistan.com/', observedAt: '2026-09-08' },
      { market: 'Pakistan', currency: 'PKR', valuePKR: 19500, priceType: 'RETAIL', status: 'MARKET_OBSERVED', source: 'CGM Shop Online Pakistan', sourceUrl: 'https://cgmshoponline.com/', observedAt: '2026-09-08' }
    ],
    commercialPrices: [],
    strengths: ['Established Abbott ecosystem', 'Real-time readings and optional alarms', 'Strong global doctor familiarity'],
    weaknesses: [],
    approvedComparisonFacts: [
      'Libre 2 has 14-day wear and 9.2% adult MARD according to Abbott.',
      'Libre 2 supports real-time readings and optional alarms in supported configurations.',
      'Current Pakistan price observations are approximately PKR 17,999–19,500 depending on seller/promotion.'
    ],
    sourceNotes: [
      'Technical facts are sourced from Abbott documentation.',
      'Pakistan prices are time-sensitive observations.',
      'Keep Libre 2 separate from Libre 1 and Libre 2 Plus.'
    ]
  },
  {
    productId: 'sibionics-gs1',
    brandName: 'SIBIONICS GS1',
    manufacturer: 'SIBIONICS Healthcare',
    variant: 'GS1 Continuous Glucose Monitoring System',
    facts: {
      pricePKR: { value: null, status: 'UNKNOWN', notes: 'No sufficiently reliable current Pakistan-local retail price was established in the reviewed sources.' },
      wearDurationDays: { value: 14, status: 'VERIFIED', source: 'SIBIONICS GS1 official product page', sourceUrl: SIBIONICS_GS1.product },
      mardPercent: { value: 8.83, status: 'VERIFIED', source: 'SIBIONICS GS1 official product page', sourceUrl: SIBIONICS_GS1.product, notes: 'Adult MARD.' },
      realTimeCGM: { value: true, status: 'VERIFIED', source: 'SIBIONICS GS1 official product detail', sourceUrl: SIBIONICS_GS1.detail },
      connectivity: { value: 'Bluetooth; readings update every 5 minutes after activation.', status: 'VERIFIED', source: 'SIBIONICS GS1 official product detail', sourceUrl: SIBIONICS_GS1.detail },
      scanWorkflow: { value: 'Initial activation requires a scan; after activation, readings update via Bluetooth without routine scanning.', status: 'VERIFIED', source: 'SIBIONICS official product detail', sourceUrl: SIBIONICS_GS1.detail },
      readerRequirement: { value: 'Compatible smartphone/app workflow; separate reader requirement not verified.', status: 'NEEDS_VERIFICATION', source: 'SIBIONICS official product information', sourceUrl: SIBIONICS_GS1.product },
      waterResistance: { value: 'IP28', status: 'VERIFIED', source: 'SIBIONICS GS1 official product page', sourceUrl: SIBIONICS_GS1.product },
      monitoringIntervalMinutes: { value: 5, status: 'VERIFIED', source: 'SIBIONICS GS1 official product detail', sourceUrl: SIBIONICS_GS1.detail },
      alarmCapability: { value: 'Customizable glucose alarms.', status: 'VERIFIED', source: 'SIBIONICS GS1 official product page', sourceUrl: SIBIONICS_GS1.product }
    },
    marketPriceObservations: [],
    commercialPrices: [
      {
        market: 'Pakistan', currency: 'PKR', valuePKR: 14000, priceType: 'RETAIL', channel: 'UNKNOWN',
        status: 'USER_PROVIDED', source: 'Current Pakistan commercial field intelligence', observedAt: '2026-09-08',
        notes: 'Current SIBIONICS GS1 retail price.'
      },
      {
        market: 'Pakistan', currency: 'PKR', valuePKR: 12600, priceType: 'PATIENT', channel: 'DISTRIBUTION',
        status: 'USER_PROVIDED', source: 'Current Pakistan commercial field intelligence', observedAt: '2026-09-08',
        notes: 'Patient price via distribution.'
      }
    ],
    strengths: ['14-day continuous monitoring', 'Bluetooth-based ongoing readings after activation', 'IP28 water resistance'],
    weaknesses: ['14-day wear lifecycle compared with EvoCheck 15 days'],
    approvedComparisonFacts: [
      'SIBIONICS GS1 has 14-day wear, 8.83% adult MARD, IP28, and 5-minute Bluetooth updates.',
      'Initial activation requires a scan; ongoing readings are Bluetooth-based.',
      'Pakistan price remains UNKNOWN in the controlled market dataset.'
    ],
    sourceNotes: [
      'Technical specifications are sourced from SIBIONICS official product pages.',
      'Pakistan-local pricing was not sufficiently verified; do not invent it.'
    ]
  },
  {
    productId: 'ican-sinocare-ican-i3',
    brandName: 'Sinocare iCan i3',
    manufacturer: 'Sinocare',
    variant: 'iCan i3 Continuous Glucose Monitoring System',
    facts: {
      pricePKR: { value: 12900, status: 'MARKET_OBSERVED', source: 'iCan Pakistan official online store', sourceUrl: ICAN_I3.pakistan, observedAt: '2026-09-08' },
      wearDurationDays: { value: 15, status: 'VERIFIED', source: 'Sinocare iCan i3 official product page', sourceUrl: ICAN_I3.product },
      mardPercent: { value: 8.71, status: 'VERIFIED', source: 'Sinocare iCan i3 official product page', sourceUrl: ICAN_I3.product, notes: 'Overall adult MARD.' },
      realTimeCGM: { value: true, status: 'VERIFIED', source: 'Sinocare iCan i3 official product page', sourceUrl: ICAN_I3.product },
      connectivity: { value: 'Real-time connectivity to the iCan app.', status: 'VERIFIED', source: 'Sinocare iCan i3 official product page', sourceUrl: ICAN_I3.product },
      scanWorkflow: { value: 'Scan-free glucose readings after sensor activation.', status: 'VERIFIED', source: 'Sinocare iCan i3 official product page', sourceUrl: ICAN_I3.product },
      readerRequirement: { value: 'Smartphone/app workflow; separate reader requirement not stated in the reviewed official product page.', status: 'NEEDS_VERIFICATION', source: 'Sinocare iCan i3 official product page', sourceUrl: ICAN_I3.product },
      waterResistance: { value: 'IP28', status: 'VERIFIED', source: 'Sinocare iCan i3 official product page', sourceUrl: ICAN_I3.product },
      monitoringIntervalMinutes: { value: 3, status: 'VERIFIED', source: 'Sinocare iCan i3 official product page', sourceUrl: ICAN_I3.product },
      alarmCapability: { value: 'Customizable low and high glucose alerts.', status: 'VERIFIED', source: 'Sinocare iCan i3 official product page', sourceUrl: ICAN_I3.product }
    },
    marketPriceObservations: [
      { market: 'Pakistan', currency: 'PKR', valuePKR: 12900, priceType: 'RETAIL', status: 'MARKET_OBSERVED', source: 'iCan Pakistan official online store', sourceUrl: ICAN_I3.pakistan, observedAt: '2026-09-08' },
      { market: 'Pakistan', currency: 'PKR', valuePKR: 11500, priceType: 'PROMOTIONAL', status: 'MARKET_OBSERVED', source: 'CGM Pakistan', sourceUrl: ICAN_I3.pakistanAlt, observedAt: '2026-09-08' },
      { market: 'Pakistan', currency: 'PKR', valuePKR: 12500, priceType: 'PROMOTIONAL', status: 'MARKET_OBSERVED', source: 'CGM Shop Online Pakistan', sourceUrl: 'https://cgmshoponline.com/', observedAt: '2026-09-08' }
    ],
    commercialPrices: [],
    strengths: ['15-day wear', '8.71% adult MARD', 'Scan-free real-time monitoring', 'IP28 water resistance'],
    weaknesses: [],
    approvedComparisonFacts: [
      'iCan i3 has 15-day wear, 8.71% adult MARD, 3-minute monitoring, and IP28 water resistance.',
      'The official iCan page describes scan-free glucose readings.',
      'Current Pakistan price observations are approximately PKR 11,500–12,900 depending on seller/promotion.'
    ],
    sourceNotes: [
      'Technical specifications are sourced from Sinocare/iCan official product information.',
      'Pakistan pricing is time-sensitive and must be reconfirmed before quoting.'
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
