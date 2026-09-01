import {
  ProductKnowledgeBase,
  ProductClaim,
  CompetitorProduct,
  ClaimVerificationStatus,
  ProductSourceType,
  ProductKnowledgeSourceRecord,
  PricingProvenanceRecord,
  PricingType
} from '../types';

/**
 * ============================================================================
 * EVOCHECK PREMIUM LINX CGM MASTER PRODUCT KNOWLEDGE BASE (SOURCE OF TRUTH)
 * Version: v1.3
 * Effective Date: 2026-09-01
 * Primary Sources:
 *  1. Company Field Data / Authorized Commercial Schedule (Internal)
 *  2. Official MyPharmEvo Product Listing (https://mypharmevo.pk/products/evocheck-premium-linx-cgm)
 *  3. EvoCheck Technical Specification Dossier (Doc Ref: EVO-TD-2025-v1.4)
 *  4. EvoCheck Instructions for Use (IFU-EVO-PK-Rev2)
 *  5. DRAP Medical Device Registration (Reg #DRAP-MD-2025-084)
 * ============================================================================
 * PROVENANCE HIERARCHY & ARCHITECTURAL RULES:
 * 1. Source Provenance Levels:
 *    - COMPANY_FIELD_DATA (Authorized Internal Distributor Schedule)
 *    - OFFICIAL_MY_PHARM_EVO_LISTING / OFFICIAL_COMPANY_WEBSITE (MyPharmEvo web store)
 *    - OFFICIAL_PRODUCT_DOCUMENT (Technical Dossier / Engineering Spec)
 *    - OFFICIAL_IFU (Package Insert & User Manual)
 *    - REGULATORY_DOCUMENT (DRAP Registration Record)
 *    - PROJECT_VERIFIED_INFORMATION (Mathematical telemetry derivations)
 *    - EXTERNAL_SOURCE (Competitor public literature & market surveys)
 * 2. PRICING DISCIPLINE & CLASSIFICATION:
 *    - DISTRIBUTOR_PRICE: PKR 12,900 per sensor/unit (Source: COMPANY_FIELD_DATA, Visibility: INTERNAL)
 *    - PUBLIC_RETAIL_PRICE: PKR 13,600 (Source: OFFICIAL_MY_PHARM_EVO_LISTING, Regular: PKR 17,000, 20% off)
 *    - INSTITUTIONAL_PRICE: NOT_CONFIGURED (Hospital tender rate pending authorization)
 *    - Do NOT treat distributor price as public patient retail price.
 *    - Do NOT invent discounts, margins, commissions, or promotional pricing.
 * 3. WARRANTY VS WEAR DURATION DISCIPLINE:
 *    - Sensor Wear Duration = 15 Days (continuous monitoring)
 *    - Replacement Warranty = 12 Days (manufacturer replacement guarantee window)
 *    - NEVER confuse 12-day replacement warranty with 12-day sensor life.
 * 4. Anti-Hallucination: DO NOT infer MARD 8.66%, IP68, 1-min interval, BLE 5.2, or 21,600 readings
 *    from the website. Keep them sourced from verified product technical documentation.
 * ============================================================================
 */

export const EVOCHECK_DISTRIBUTOR_PRICING: PricingProvenanceRecord = {
  pricing_type: 'DISTRIBUTOR_PRICE',
  amount: 12900,
  currency: 'PKR',
  product: 'EvoCheck Premium Linx CGM',
  source_type: 'COMPANY_FIELD_DATA',
  verification_status: 'VERIFIED',
  visibility: 'INTERNAL',
  last_verified: '2026-09-01',
  notes: 'Authorized internal distributor price per sensor/unit for field operations and trade supply.'
};

export const EVOCHECK_PUBLIC_RETAIL_PRICING: PricingProvenanceRecord = {
  pricing_type: 'PUBLIC_RETAIL_PRICE',
  amount: 13600,
  currency: 'PKR',
  product: 'EvoCheck Premium Linx CGM',
  source_type: 'OFFICIAL_MY_PHARM_EVO_LISTING',
  verification_status: 'WEB_VERIFIED',
  visibility: 'PUBLIC',
  last_verified: '2026-09-01',
  regular_amount: 17000,
  discount_percentage: 20,
  notes: 'Official public online patient retail price on MyPharmEvo web store.'
};

export const EVOCHECK_MASTER_SOURCES: ProductKnowledgeSourceRecord[] = [
  {
    id: 'SRC-INTERNAL-DISTRIBUTOR-SCHEDULE',
    title: 'Company Authorized Distributor Schedule',
    source_type: 'COMPANY_FIELD_DATA',
    reference: 'Commercial Schedule Ref: COM-EVO-2026-Q3 (Internal)',
    provenance_rank: 1,
    description: 'Internal authorized commercial rate card establishing distributor price of PKR 12,900 per sensor/unit.',
    last_verified: '2026-09-01',
    status: 'ACTIVE'
  },
  {
    id: 'SRC-OFFICIAL-WEBSITE',
    title: 'Official MyPharmEvo Product Listing',
    source_type: 'OFFICIAL_MY_PHARM_EVO_LISTING',
    url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
    provenance_rank: 2,
    description: 'Official MyPharmEvo direct-to-consumer product page confirming product features, package contents, warranty, and public retail price (PKR 13,600).',
    last_verified: '2026-09-01',
    status: 'ACTIVE'
  },
  {
    id: 'SRC-TECH-DOSSIER',
    title: 'EvoCheck Technical Specification Dossier',
    source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
    reference: 'Doc Ref: EVO-TD-2025-v1.4, Section 4.1',
    provenance_rank: 1,
    description: 'Engineering and clinical performance dossier establishing MARD 8.66%, 1-minute sampling interval, and BLE protocol.',
    last_verified: '2026-09-01',
    status: 'ACTIVE'
  },
  {
    id: 'SRC-INGRESS-REPORT',
    title: 'EvoCheck Ingress Protection Test Report',
    source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
    reference: 'Standard IEC 60529 (IP68)',
    provenance_rank: 1,
    description: 'Standardized laboratory ingress certification validating IP68 water resistance.',
    last_verified: '2026-09-01',
    status: 'ACTIVE'
  },
  {
    id: 'SRC-IFU-INSERT',
    title: 'EvoCheck Instructions for Use (IFU)',
    source_type: 'OFFICIAL_IFU',
    reference: 'IFU-EVO-PK-Rev2',
    provenance_rank: 1,
    description: 'Authorized medical device packaging insert and patient application guide.',
    last_verified: '2026-09-01',
    status: 'ACTIVE'
  },
  {
    id: 'SRC-DRAP-REGISTRY',
    title: 'DRAP Medical Device Registration Registry',
    source_type: 'REGULATORY_DOCUMENT',
    reference: 'Registration #DRAP-MD-2025-084',
    provenance_rank: 1,
    description: 'Statutory registration record issued by the Drug Regulatory Authority of Pakistan.',
    last_verified: '2026-09-01',
    status: 'ACTIVE'
  },
  {
    id: 'SRC-MATH-DERIVATION',
    title: 'Mathematical Telemetry Derivation',
    source_type: 'PROJECT_VERIFIED_INFORMATION',
    reference: 'Calculated Telemetry Metrics (1-min interval x 15 days)',
    provenance_rank: 2,
    description: 'Direct mathematical calculations for daily (1,440) and 15-day sensor (21,600) theoretical readings.',
    last_verified: '2026-09-01',
    status: 'ACTIVE'
  }
];

export const EVOCHECK_MASTER_KNOWLEDGE: ProductKnowledgeBase = {
  version: 'v1.3',
  last_synced_at: '2026-09-01T10:00:00Z',
  product_id: 'evocheck-premium-linx-cgm',
  product_name: 'EvoCheck Premium Linx CGM',
  system_name: 'EvoCheck / LinX Continuous Glucose Monitoring System',
  regulatory_status: 'DRAP_APPROVED',
  regulatory_notes:
    'EvoCheck Premium Linx CGM has received medical device registration approval from the Drug Regulatory Authority of Pakistan (DRAP). Regulatory approval applies to the product registration; individual clinical and marketing claims maintain independent source verification.',
  
  sources_registry: EVOCHECK_MASTER_SOURCES,

  pricing: {
    status: 'CONFIGURED',
    display_text: 'Distributor: PKR 12,900 (Internal) | Public Retail: PKR 13,600 (Online)',
    current_price_pkr: 12900,
    effective_date: '2026-09-01',
    territory: 'Rawalpindi / Islamabad Region',
    source: 'Company Field Data & MyPharmEvo Official Listing',
    approval_status: 'APPROVED',
    historical_prices: [],
    distributor_price: EVOCHECK_DISTRIBUTOR_PRICING,
    public_retail_price: EVOCHECK_PUBLIC_RETAIL_PRICING,
    retail_website_price: {
      status: 'CURRENT_WEBSITE_PRICE',
      display_text: 'Regular: PKR 17,000 | Sale: PKR 13,600 (20% off)',
      regular_price_pkr: 17000,
      sale_price_pkr: 13600,
      discount_percentage: 20,
      source: 'Official MyPharmEvo Product Listing',
      source_type: 'OFFICIAL_MY_PHARM_EVO_LISTING',
      source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      notes: 'Direct-to-consumer online retail price on MyPharmEvo web store. Medical representatives must NOT quote this as distributor trade pricing.',
      effective_date: '2026-09-01'
    },
    field_distributor_price: {
      status: 'CONFIGURED',
      display_text: 'PKR 12,900 per sensor/unit',
      regular_price_pkr: 12900,
      sale_price_pkr: 12900,
      source: 'Company Authorized Distributor Schedule',
      source_type: 'COMPANY_FIELD_DATA',
      notes: 'Authorized internal distributor price (PKR 12,900). Visibility: INTERNAL. Reps must not quote this as public patient retail price.',
      effective_date: '2026-09-01'
    },
    institutional_price: {
      status: 'NOT_CONFIGURED',
      display_text: 'Price: Not configured',
      source: 'Institutional Hospital Tender Schedule',
      source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
      notes: 'Institutional and hospital procurement contract rate pending authorization.'
    }
  },

  core_specifications: {
    mard: {
      value: 8.66,
      unit: '%',
      status: 'VERIFIED',
      label: 'Verified Product Specification',
      source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
      source_document: 'EvoCheck Technical Specification Dossier',
      sources: [
        {
          source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
          source_title: 'EvoCheck Technical Specification Dossier',
          source_reference: 'Section 4.1, Clinical Accuracy Performance (MARD 8.66%)',
          verification_status: 'VERIFIED',
          notes: 'Source: Verified EvoCheck technical/product documentation. Not stated on consumer website.'
        }
      ]
    },
    wear_duration: {
      value: 15,
      unit: 'days',
      status: 'VERIFIED',
      label: 'Verified Product Specification & Website Confirmed',
      source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
      source_document: 'Official MyPharmEvo website + verified product documentation',
      sources: [
        {
          source_type: 'OFFICIAL_COMPANY_WEBSITE',
          source_title: 'Official MyPharmEvo Product Page',
          source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
          source_reference: 'Features: 15 days continuous monitoring / Wear duration: Up to 15 days',
          verification_status: 'VERIFIED'
        },
        {
          source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
          source_title: 'EvoCheck Sensor Product Specification',
          source_reference: 'Section 2.3, Operating Lifecycle (15 Days)',
          verification_status: 'VERIFIED'
        }
      ]
    },
    water_resistance: {
      value: 'IP68',
      unit: '',
      status: 'VERIFIED',
      label: 'Verified Product Specification (IP68) & Water/Sweat Resistant',
      source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
      source_document: 'EvoCheck Environmental Ingress Test Report (IEC 60529)',
      sources: [
        {
          source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
          source_title: 'EvoCheck Environmental Ingress Test Report',
          source_reference: 'Standard IEC 60529 (IP68 certified)',
          verification_status: 'VERIFIED',
          notes: 'Source: Verified EvoCheck technical/product documentation.'
        },
        {
          source_type: 'OFFICIAL_COMPANY_WEBSITE',
          source_title: 'Official MyPharmEvo Product Page',
          source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
          source_reference: 'Feature: Water and sweat resistant',
          verification_status: 'VERIFIED',
          notes: 'Consumer description confirming water/sweat resistance for daily wear and showering.'
        }
      ]
    },
    connectivity: {
      value: 'Bluetooth Low Energy (BLE)',
      status: 'VERIFIED',
      label: 'Verified Product Specification & Website Confirmed',
      source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
      source_document: 'EvoCheck Mobile Software Architecture + Official Website',
      sources: [
        {
          source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
          source_title: 'EvoCheck Mobile Software Architecture',
          source_reference: 'Section 1.2, Wireless Protocol (BLE 5.2 continuous telemetry)',
          verification_status: 'VERIFIED',
          notes: 'Source: Verified EvoCheck technical/product documentation.'
        },
        {
          source_type: 'OFFICIAL_COMPANY_WEBSITE',
          source_title: 'Official MyPharmEvo Product Page',
          source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
          source_reference: 'Features: Smartphone connectivity, Mobile app integration, No reader required',
          verification_status: 'VERIFIED'
        }
      ]
    },
    reading_interval: {
      value: 1,
      unit: 'minute',
      status: 'VERIFIED',
      label: 'Verified Product Specification',
      source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
      source_document: 'EvoCheck Technical Specification Dossier',
      sources: [
        {
          source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
          source_title: 'EvoCheck Technical Specification Dossier',
          source_reference: 'Section 3.1, Sampling Rate (1-minute telemetry)',
          verification_status: 'VERIFIED',
          notes: 'Source: Verified EvoCheck technical/product documentation. Not stated on consumer website.'
        }
      ]
    },
    daily_readings_calculated: {
      value: 1440,
      unit: 'readings/day',
      status: 'VERIFIED',
      type: 'CALCULATED_VALUE',
      formula: '(24 hours * 60 minutes) / 1-minute interval = 1,440 readings/day',
      source_type: 'PROJECT_VERIFIED_INFORMATION',
      sources: [
        {
          source_type: 'PROJECT_VERIFIED_INFORMATION',
          source_title: 'Derived Mathematical Calculation',
          source_reference: 'Formula: (24h * 60m) / 1m interval = 1,440/day',
          verification_status: 'VERIFIED',
          notes: 'Calculated value derived from verified 1-min sampling interval. Not an independent manufacturer claim.'
        }
      ]
    },
    sensor_readings_calculated: {
      value: 21600,
      unit: 'readings/15-day sensor',
      status: 'VERIFIED',
      type: 'CALCULATED_VALUE',
      formula: '1,440 daily readings * 15 days = 21,600 theoretical readings per sensor',
      source_type: 'PROJECT_VERIFIED_INFORMATION',
      sources: [
        {
          source_type: 'PROJECT_VERIFIED_INFORMATION',
          source_title: 'Derived Mathematical Calculation',
          source_reference: 'Formula: 1,440 readings/day * 15 days = 21,600/sensor',
          verification_status: 'VERIFIED',
          notes: 'Calculated value derived from 15-day wear and 1-minute sampling rate.'
        }
      ]
    },
    calibration: {
      value: 'Factory-calibrated / no routine finger-prick testing required',
      status: 'VERIFIED',
      label: 'Verified Product Specification & Website Confirmed',
      source_type: 'OFFICIAL_COMPANY_WEBSITE',
      sources: [
        {
          source_type: 'OFFICIAL_COMPANY_WEBSITE',
          source_title: 'Official MyPharmEvo Product Page',
          source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
          source_reference: 'Feature: No routine finger-prick testing',
          verification_status: 'VERIFIED'
        },
        {
          source_type: 'OFFICIAL_IFU',
          source_title: 'EvoCheck Instructions for Use (IFU)',
          source_reference: 'Calibration section: Factory calibrated',
          verification_status: 'VERIFIED'
        }
      ]
    },
    replacement_warranty: {
      value: 12,
      unit: 'days',
      status: 'VERIFIED',
      label: '12-Day Replacement Warranty (Distinct from 15-Day Sensor Life)',
      source_type: 'OFFICIAL_COMPANY_WEBSITE',
      source_document: 'Official MyPharmEvo website',
      source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      notes: '12-day manufacturer replacement warranty window. This is stored separately from sensor wear duration and MUST NOT be confused with the 15-day sensor wear duration.',
      sources: [
        {
          source_type: 'OFFICIAL_COMPANY_WEBSITE',
          source_title: 'Official MyPharmEvo Product Page',
          source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
          source_reference: 'Warranty Policy: 12-day replacement warranty',
          verification_status: 'VERIFIED',
          notes: 'Manufacturer product replacement window for technical defect support.'
        }
      ]
    },
    package_contents: {
      items: ['Sensor', 'Applicator', 'User Guide', 'Adhesive Patches'],
      status: 'VERIFIED',
      label: 'Standard Package Contents',
      source_type: 'OFFICIAL_COMPANY_WEBSITE',
      source_document: 'Official MyPharmEvo website',
      source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      sources: [
        {
          source_type: 'OFFICIAL_COMPANY_WEBSITE',
          source_title: 'Official MyPharmEvo Product Page',
          source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
          source_reference: 'Package includes: Sensor + applicator + user guide + adhesive patches',
          verification_status: 'VERIFIED'
        }
      ]
    }
  },

  verified_claims: [
    {
      claim_id: 'CLM-EVO-001',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'EvoCheck CGM achieves a verified Mean Absolute Relative Difference (MARD) of 8.66% across multi-day clinical evaluation.',
      claim_type: 'PERFORMANCE_METRIC',
      value: 8.66,
      unit: '%',
      source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
      source_document: 'EvoCheck Technical Specification Dossier',
      source_reference: 'Section 4.1, Clinical Accuracy Performance',
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-01-01',
      review_date: '2026-09-01',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      notes: 'Source: Verified EvoCheck technical/product documentation. Not stated on consumer website.'
    },
    {
      claim_id: 'CLM-EVO-002',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Single sensor wear duration provides continuous monitoring for up to 15 days.',
      claim_type: 'WEAR_DURATION',
      value: 15,
      unit: 'days',
      source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
      source_document: 'Official MyPharmEvo website + verified product documentation',
      source_reference: 'MyPharmEvo product page (15 days continuous monitoring / Wear duration: Up to 15 days) & EvoCheck Sensor Spec (Sec 2.3)',
      source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      sources: [
        {
          source_type: 'OFFICIAL_COMPANY_WEBSITE',
          source_title: 'Official MyPharmEvo Product Page',
          source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
          source_reference: '15 days continuous monitoring / Wear duration: Up to 15 days',
          verification_status: 'VERIFIED'
        },
        {
          source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
          source_title: 'EvoCheck Sensor Product Specification',
          source_reference: 'Section 2.3, Operating Lifecycle',
          verification_status: 'VERIFIED'
        }
      ],
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-01-01',
      review_date: '2026-09-01',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      notes: 'Confirmed by both official website and technical documentation.'
    },
    {
      claim_id: 'CLM-EVO-003',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Sensor assembly is rated IP68 for water ingress resistance and certified water and sweat resistant.',
      claim_type: 'WATER_RESISTANCE',
      value: 'IP68',
      source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
      source_document: 'EvoCheck Environmental Ingress Test Report',
      source_reference: 'Standard IEC 60529 (IP68)',
      sources: [
        {
          source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
          source_title: 'EvoCheck Environmental Ingress Test Report',
          source_reference: 'Standard IEC 60529 (IP68 rating)',
          verification_status: 'VERIFIED',
          notes: 'Source: Verified EvoCheck technical/product documentation.'
        },
        {
          source_type: 'OFFICIAL_COMPANY_WEBSITE',
          source_title: 'Official MyPharmEvo Product Page',
          source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
          source_reference: 'Feature: Water and sweat resistant',
          verification_status: 'VERIFIED'
        }
      ],
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-01-01',
      review_date: '2026-09-01',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      notes: 'IP68 technical standard verified via test report; water and sweat resistance confirmed on website.'
    },
    {
      claim_id: 'CLM-EVO-004',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Sensor transmits real-time glucose telemetry directly via Bluetooth Low Energy (BLE) to supported mobile devices without a separate reader.',
      claim_type: 'CONNECTIVITY',
      value: 'Bluetooth Low Energy (BLE)',
      source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
      source_document: 'EvoCheck Mobile Software System Architecture',
      source_reference: 'Section 1.2, Wireless Protocol',
      sources: [
        {
          source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
          source_title: 'EvoCheck Mobile Software Architecture',
          source_reference: 'Section 1.2, Wireless Protocol (BLE 5.2)',
          verification_status: 'VERIFIED',
          notes: 'Source: Verified EvoCheck technical/product documentation.'
        },
        {
          source_type: 'OFFICIAL_COMPANY_WEBSITE',
          source_title: 'Official MyPharmEvo Product Page',
          source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
          source_reference: 'Features: Smartphone connectivity, No reader required',
          verification_status: 'VERIFIED'
        }
      ],
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-01-01',
      review_date: '2026-09-01',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z'
    },
    {
      claim_id: 'CLM-EVO-005',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Glucose readings are captured at approximately 1-minute intervals.',
      claim_type: 'PERFORMANCE_METRIC',
      value: 1,
      unit: 'minute',
      source_type: 'OFFICIAL_PRODUCT_DOCUMENT',
      source_document: 'EvoCheck Technical Specification Dossier',
      source_reference: 'Section 3.1, Sampling Rate',
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-01-01',
      review_date: '2026-09-01',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      notes: 'Source: Verified EvoCheck technical/product documentation. Not stated on consumer website.'
    },
    {
      claim_id: 'CLM-EVO-006',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'A 1-minute reading interval yields approximately 1,440 theoretical readings per day.',
      claim_type: 'CALCULATED_VALUE',
      value: 1440,
      unit: 'readings/day',
      source_type: 'PROJECT_VERIFIED_INFORMATION',
      source_reference: 'Derived mathematical calculation: (24h * 60m) / 1m = 1,440/day',
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      calculation_formula: '(24 hours * 60 minutes) / 1 min = 1,440 readings/day',
      effective_date: '2026-01-01',
      review_date: '2026-09-01',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      notes: 'Calculated value based on 1-min reading interval. Not an independent manufacturer claim.'
    },
    {
      claim_id: 'CLM-EVO-007',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Across a 15-day sensor lifespan, a 1-minute reading interval yields approximately 21,600 theoretical readings.',
      claim_type: 'CALCULATED_VALUE',
      value: 21600,
      unit: 'readings/15-day sensor',
      source_type: 'PROJECT_VERIFIED_INFORMATION',
      source_reference: 'Derived mathematical calculation: 1,440/day * 15 days = 21,600/sensor',
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      calculation_formula: '1,440 daily readings * 15 days = 21,600 theoretical readings',
      effective_date: '2026-01-01',
      review_date: '2026-09-01',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      notes: 'Calculated value derived from 15-day wear and 1-minute frequency.'
    },
    {
      claim_id: 'CLM-EVO-008',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'EvoCheck CGM is registered and approved by the Drug Regulatory Authority of Pakistan (DRAP).',
      claim_type: 'REGULATORY_STATUS',
      value: 'DRAP_APPROVED',
      source_type: 'REGULATORY_DOCUMENT',
      source_document: 'DRAP Medical Device Registration Registry',
      source_reference: 'Registration #DRAP-MD-2025-084',
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2025-01-01',
      review_date: '2026-09-01',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      notes: 'Source: DRAP Regulatory Record. Not explicitly cited on consumer product page.'
    },
    // Official Website Confirmed Features & Records
    {
      claim_id: 'CLM-WEB-001',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Continuous glucose trend tracking enables continuous visualization of glucose patterns.',
      claim_type: 'APP_FEATURE',
      value: 'Continuous glucose trend tracking',
      source_type: 'OFFICIAL_COMPANY_WEBSITE',
      source_document: 'Official MyPharmEvo Website',
      source_reference: 'Feature: Continuous glucose trend tracking',
      source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-09-01',
      review_date: '2026-09-01',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z'
    },
    {
      claim_id: 'CLM-WEB-002',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Designed for daily diabetes management with no routine finger-prick testing required.',
      claim_type: 'PATIENT_USAGE',
      value: 'No routine finger-prick testing',
      source_type: 'OFFICIAL_COMPANY_WEBSITE',
      source_document: 'Official MyPharmEvo Website',
      source_reference: 'Feature: No routine finger-prick testing',
      source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-09-01',
      review_date: '2026-09-01',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z'
    },
    {
      claim_id: 'CLM-WEB-003',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Sensor body is a lightweight and discreet wearable designed for unobtrusive daily use.',
      claim_type: 'TECHNICAL_SPECIFICATION',
      value: 'Lightweight and discreet wearable',
      source_type: 'OFFICIAL_COMPANY_WEBSITE',
      source_document: 'Official MyPharmEvo Website',
      source_reference: 'Feature: Lightweight/discreet wearable',
      source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-09-01',
      review_date: '2026-09-01',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z'
    },
    {
      claim_id: 'CLM-WEB-004',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Mobile app integration provides real-time insights and high/low glucose alerts directly on smartphones.',
      claim_type: 'ALERT_FEATURE',
      value: 'Real-time insights and alerts',
      source_type: 'OFFICIAL_COMPANY_WEBSITE',
      source_document: 'Official MyPharmEvo Website',
      source_reference: 'Features: Mobile app integration, Real-time insights and alerts',
      source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-09-01',
      review_date: '2026-09-01',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z'
    },
    {
      claim_id: 'CLM-WEB-005',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Operates without requiring a dedicated reader hardware unit (smartphone direct connectivity).',
      claim_type: 'CONNECTIVITY',
      value: 'No reader required',
      source_type: 'OFFICIAL_COMPANY_WEBSITE',
      source_document: 'Official MyPharmEvo Website',
      source_reference: 'Feature: No reader required',
      source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-09-01',
      review_date: '2026-09-01',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z'
    },
    {
      claim_id: 'CLM-WEB-006',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Each retail pack contains: Sensor + applicator + user guide + adhesive patches.',
      claim_type: 'INSTALLATION',
      value: 'Sensor + applicator + user guide + adhesive patches',
      source_type: 'OFFICIAL_COMPANY_WEBSITE',
      source_document: 'Official MyPharmEvo Website',
      source_reference: 'Package contents specification',
      source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-09-01',
      review_date: '2026-09-01',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z'
    },
    {
      claim_id: 'CLM-WEB-007',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Supported by a 12-day replacement warranty (stored separately from the 15-day sensor lifespan).',
      claim_type: 'TECHNICAL_SPECIFICATION',
      value: '12-day replacement warranty',
      source_type: 'OFFICIAL_COMPANY_WEBSITE',
      source_document: 'Official MyPharmEvo Website',
      source_reference: 'Warranty Policy: 12-day replacement warranty',
      source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-09-01',
      review_date: '2026-09-01',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      notes: 'Replacement warranty policy. Must not be confused with 15-day sensor wear duration.'
    },
    {
      claim_id: 'CLM-WEB-008',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Official MyPharmEvo direct consumer retail price is Regular PKR 17,000 / Sale PKR 13,600 (20% Discount).',
      claim_type: 'PERFORMANCE_METRIC',
      value: 'PKR 13,600 (Sale) / PKR 17,000 (Regular)',
      source_type: 'OFFICIAL_MY_PHARM_EVO_LISTING',
      source_document: 'Official MyPharmEvo Product Listing',
      source_reference: 'MyPharmEvo Store Pricing (20% Off)',
      source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      verification_status: 'WEB_VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-09-01',
      review_date: '2026-09-01',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      notes: 'PUBLIC_RETAIL_PRICE (Public). Distinct from internal distributor or hospital institutional contract pricing.'
    },
    {
      claim_id: 'CLM-COMM-001',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Authorized internal distributor price for EvoCheck Premium Linx CGM is PKR 12,900 per sensor/unit.',
      claim_type: 'PERFORMANCE_METRIC',
      value: 'PKR 12,900 per unit (DISTRIBUTOR_PRICE)',
      source_type: 'COMPANY_FIELD_DATA',
      source_document: 'Company Authorized Distributor Schedule',
      source_reference: 'COM-EVO-2026-Q3 (Internal)',
      verification_status: 'VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-09-01',
      review_date: '2026-09-01',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      notes: 'DISTRIBUTOR_PRICE (Internal). Medical representatives must NOT treat distributor price as public patient retail price.'
    },
    {
      claim_id: 'CLM-COMM-002',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'Official patient/public online price for EvoCheck Premium Linx CGM is PKR 13,600, based on current MyPharmEvo listing.',
      claim_type: 'PERFORMANCE_METRIC',
      value: 'PKR 13,600 (PUBLIC_RETAIL_PRICE)',
      source_type: 'OFFICIAL_MY_PHARM_EVO_LISTING',
      source_document: 'Official MyPharmEvo Product Listing',
      source_reference: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      source_url: 'https://mypharmevo.pk/products/evocheck-premium-linx-cgm',
      verification_status: 'WEB_VERIFIED',
      approval_status: 'APPROVED',
      confidence: 1.0,
      effective_date: '2026-09-01',
      review_date: '2026-09-01',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      notes: 'PUBLIC_RETAIL_PRICE (Public). Based on official MyPharmEvo online listing.'
    }
  ],

  quarantined_claims: [
    {
      claim_id: 'CLM-QUAR-001',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'EvoCheck provides superior precision in hypoglycemia range (<70 mg/dL).',
      claim_type: 'CLINICAL_INFORMATION',
      value: 'Superior hypoglycemia accuracy',
      source_type: 'UNVERIFIED_FIELD_NOTE',
      verification_status: 'QUARANTINED',
      approval_status: 'QUARANTINED',
      confidence: 0.0,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      is_quarantined: true,
      notes: 'QUARANTINED: Requires dedicated, peer-reviewed sub-70 mg/dL clinical study data before this comparative superiority claim can be approved.'
    },
    {
      claim_id: 'CLM-QUAR-002',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'EvoCheck usage prevents emergency hypoglycemia hospital admissions.',
      claim_type: 'CLINICAL_INFORMATION',
      value: 'Hospitalization prevention',
      source_type: 'UNVERIFIED_FIELD_NOTE',
      verification_status: 'QUARANTINED',
      approval_status: 'QUARANTINED',
      confidence: 0.0,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      is_quarantined: true,
      notes: 'QUARANTINED: Unsubstantiated clinical outcome claim. AI coach and representatives must not make direct clinical prevention guarantees.'
    },
    {
      claim_id: 'CLM-QUAR-003',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'EvoCheck completely eliminates the need for all blood glucose test strips.',
      claim_type: 'PATIENT_USAGE',
      value: 'Eliminates all test strips',
      source_type: 'UNVERIFIED_FIELD_NOTE',
      verification_status: 'QUARANTINED',
      approval_status: 'QUARANTINED',
      confidence: 0.0,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      is_quarantined: true,
      notes: 'QUARANTINED: Inaccurate claim. Fingerstick verification is standard of care if CGM readings do not match clinical symptoms.'
    },
    {
      claim_id: 'CLM-QUAR-004',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'EvoCheck field distributor price is PKR 12,500.',
      claim_type: 'COMPETITOR_COMPARISON',
      value: 'PKR 12,500 obsolete/unverified claim',
      source_type: 'UNVERIFIED_FIELD_NOTE',
      verification_status: 'QUARANTINED',
      approval_status: 'QUARANTINED',
      confidence: 0.0,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      is_quarantined: true,
      notes: 'QUARANTINED / OBSOLETE: Replaced by authorized internal distributor price of PKR 12,900 (effective 2026-09-01). The obsolete PKR 12,500 figure is unverified and prohibited from active product knowledge.'
    },
    {
      claim_id: 'CLM-QUAR-005',
      product_id: 'evocheck-premium-linx-cgm',
      claim_text: 'EvoCheck incorporates a specialized sub-70 mg/dL algorithm weighting.',
      claim_type: 'TECHNICAL_SPECIFICATION',
      value: 'Specialized sub-70 algorithm',
      source_type: 'UNVERIFIED_FIELD_NOTE',
      verification_status: 'QUARANTINED',
      approval_status: 'QUARANTINED',
      confidence: 0.0,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      is_quarantined: true,
      notes: 'QUARANTINED: Proprietary algorithm detail unverified in current technical documentation.'
    }
  ],

  features: [
    {
      feature_id: 'FT-01',
      name: 'Continuous Glucose Trend Tracking',
      description: 'Continuous monitoring of interstitial glucose trends and patterns.',
      status: 'VERIFIED',
      source_reference: 'Official MyPharmEvo Website & Technical Specification Dossier'
    },
    {
      feature_id: 'FT-02',
      name: 'No Routine Finger-Prick Testing',
      description: 'Designed for daily continuous monitoring without routine finger-prick calibrations.',
      status: 'VERIFIED',
      source_reference: 'Official MyPharmEvo Website & Instructions for Use'
    },
    {
      feature_id: 'FT-03',
      name: 'Lightweight & Discreet Wearable',
      description: 'Compact, low-profile sensor body designed for unobtrusive 15-day application.',
      status: 'VERIFIED',
      source_reference: 'Official MyPharmEvo Website'
    },
    {
      feature_id: 'FT-04',
      name: 'Mobile App Integration & Alerts',
      description: 'Direct smartphone connectivity with real-time glucose telemetry and customizable high/low alerts.',
      status: 'VERIFIED',
      source_reference: 'Official MyPharmEvo Website & Mobile Software Manual'
    },
    {
      feature_id: 'FT-05',
      name: 'Water & Sweat Resistant (IP68)',
      description: 'Rated IP68 for water ingress resistance and certified water and sweat resistant for patient showers and exercise.',
      status: 'VERIFIED',
      source_reference: 'Standard IEC 60529 (IP68) & Official MyPharmEvo Website'
    },
    {
      feature_id: 'FT-06',
      name: 'No Dedicated Reader Required',
      description: 'Operates directly through user smartphone application via Bluetooth Low Energy (BLE).',
      status: 'VERIFIED',
      source_reference: 'Official MyPharmEvo Website'
    },
    {
      feature_id: 'FT-07',
      name: '12-Day Replacement Warranty',
      description: 'Official manufacturer product replacement guarantee window for any technical defects.',
      status: 'VERIFIED',
      source_reference: 'Official MyPharmEvo Website'
    }
  ],

  competitors: [
    {
      product_id: 'abbott-freestyle-libre',
      brand_name: 'Abbott FreeStyle Libre',
      manufacturer: 'Abbott Diabetes Care',
      price_pkr: 16500,
      price_display: 'Approx. PKR 16,500 (Market survey estimate)',
      wear_duration_days: 14,
      claimed_mard: 9.2,
      water_resistance: 'IP27 (Manufacturer published spec)',
      strengths: [
        'High global brand recognition',
        'Established physician familiarity across endocrine clinics'
      ],
      weaknesses: [
        'Libre 1 requires manual NFC scan tap to view reading (no automated BLE stream)',
        '14-day wear duration compared to EvoCheck 15-day wear'
      ],
      approved_comparison_facts: [
        'EvoCheck provides continuous Bluetooth (BLE) broadcast telemetry without requiring manual NFC scanning.',
        'EvoCheck has a verified MARD of 8.66% compared to FreeStyle Libre published 9.2% MARD.',
        'EvoCheck provides 15 days of continuous wear per sensor.'
      ],
      source_reference: 'Abbott FreeStyle Libre Published IFU & Market Price Survey',
      verification_status: 'VERIFIED'
    },
    {
      product_id: 'sibionics-cgm',
      brand_name: 'SIBIONICS CGM',
      manufacturer: 'SIBIONICS Healthcare',
      price_pkr: 13500,
      price_display: 'Approx. PKR 13,500 (Market survey estimate)',
      wear_duration_days: 14,
      claimed_mard: 8.83,
      water_resistance: 'IPX8 (Manufacturer published spec)',
      strengths: [
        'Direct Bluetooth Low Energy telemetry',
        'Sleek smartphone user interface'
      ],
      weaknesses: [
        '14-day sensor lifespan compared to EvoCheck 15-day sensor lifespan',
        'Independent distributor support structure in Pakistan market'
      ],
      approved_comparison_facts: [
        'EvoCheck provides a 15-day wear duration per sensor compared to 14 days for SIBIONICS.',
        'EvoCheck has a verified MARD of 8.66% based on internal technical specification documentation.'
      ],
      source_reference: 'SIBIONICS Healthcare Published Technical Specifications',
      verification_status: 'VERIFIED'
    }
  ],

  objection_guidelines: [
    {
      id: 'OBJ-01',
      category: 'Accuracy & Clinical Evidence',
      doctorStatement: 'How reliable is EvoCheck compared to lab measurements and established CGMs?',
      compliantResponse:
        '[FACT] EvoCheck has a verified MARD of 8.66% across its 15-day wear lifecycle (Source: Verified EvoCheck Technical Dossier). [RECOMMENDATION] Offer to share the clinical validation dossier and discuss how continuous 1-minute telemetry provides comprehensive glycemic trend data for insulin-dependent patients.',
      grounded_claim_ids: ['CLM-EVO-001', 'CLM-EVO-002', 'CLM-EVO-005'],
      what_not_to_say:
        'Do NOT claim EvoCheck is universally superior to all competitors or guarantees specific HbA1c reductions.'
    },
    {
      id: 'OBJ-02',
      category: 'Water Resistance & Daily Activity',
      doctorStatement: 'Can my patients shower, exercise, or swim with the sensor?',
      compliantResponse:
        '[FACT] EvoCheck is certified with an IP68 water resistance rating (IEC 60529) and confirmed water and sweat resistant on MyPharmEvo official documentation. [RECOMMENDATION] Clarify that patients can shower, sweat during exercise, and perform normal daily water activities while wearing the sensor.',
      grounded_claim_ids: ['CLM-EVO-003'],
      what_not_to_say:
        'Do NOT state that patients can scuba dive or submerge indefinitely without following official product precautions.'
    },
    {
      id: 'OBJ-03',
      category: 'Sensor Wear Duration & Warranty',
      doctorStatement: 'How many days of monitoring does a single sensor provide? Is it 12 or 15 days?',
      compliantResponse:
        '[FACT] A single EvoCheck sensor is designed for 15 days of continuous wear (Wear duration: Up to 15 days). [FACT] The 12-day figure on the MyPharmEvo website is the manufacturer replacement warranty window for any defect claims, not the sensor lifespan. [RECOMMENDATION] Reassure the doctor that patients receive 15 full days of continuous glucose monitoring per sensor.',
      grounded_claim_ids: ['CLM-EVO-002', 'CLM-EVO-007', 'CLM-WEB-007'],
      what_not_to_say:
        'Do NOT confuse the 12-day replacement warranty with the 15-day sensor lifespan, and do not claim the sensor can be extended past 15 days.'
    },
    {
      id: 'OBJ-04',
      category: 'Pricing & Commercial Classification',
      doctorStatement: 'What is the price of EvoCheck for self-paying patients vs clinic supply?',
      compliantResponse:
        '[FACT] The authorized internal distributor price for EvoCheck Premium Linx CGM is PKR 12,900 per sensor/unit. [FACT] The public/patient online price on the official MyPharmEvo listing is PKR 13,600 (current promotional sale, regular PKR 17,000). [RECOMMENDATION] Clearly distinguish distributor/internal trade price from patient-facing retail price. Direct self-paying patients to the official MyPharmEvo website for direct orders at PKR 13,600.',
      grounded_claim_ids: ['CLM-COMM-001', 'CLM-COMM-002', 'CLM-WEB-008'],
      what_not_to_say:
        'Do NOT treat the distributor price (PKR 12,900) as the public patient retail price. Do NOT invent unverified discounts, margins, commissions, or promotional pricing.'
    }
  ]
};

/**
 * Helper: Formats the current verified EvoCheck product knowledge for AI Prompts.
 * Enforces strict provenance, anti-hallucination, and pricing guardrails.
 */
export function getVerifiedEvoCheckAIContext(): string {
  const kb = EVOCHECK_MASTER_KNOWLEDGE;
  const core = kb.core_specifications;
  const pricing = kb.pricing;

  return `
======================================================================
CURRENT VERIFIED EVOCHECK PRODUCT KNOWLEDGE (SOURCE OF TRUTH v1.3)
======================================================================
Product Name: ${kb.product_name} (${kb.system_name})
Knowledge Base Version: ${kb.version} (Last Synced: ${kb.last_synced_at})
Regulatory Status: ${kb.regulatory_status} (DRAP Approved Medical Device)

PROVENANCE HIERARCHY & REGISTERED SOURCES:
1. COMPANY_FIELD_DATA: Authorized Distribution Rate Schedule COM-EVO-2026-Q3 (Internal)
2. OFFICIAL_MY_PHARM_EVO_LISTING: MyPharmEvo Official Store (https://mypharmevo.pk/products/evocheck-premium-linx-cgm)
3. OFFICIAL_PRODUCT_DOCUMENT: EvoCheck Technical Specification Dossier (Doc Ref: EVO-TD-2025-v1.4)
4. OFFICIAL_IFU: EvoCheck Instructions for Use (IFU-EVO-PK-Rev2)
5. REGULATORY_DOCUMENT: DRAP Medical Device Registration (Reg #DRAP-MD-2025-084)
6. PROJECT_VERIFIED_INFORMATION: Mathematical Telemetry Derivations

CORE SPECIFICATIONS & PROVENANCE:
- MARD: ${core.mard.value}${core.mard.unit} (${core.mard.label}) [Source: ${core.mard.source_document}]
- Sensor Wear Duration: ${core.wear_duration.value} ${core.wear_duration.unit} (${core.wear_duration.label}) [Source: ${core.wear_duration.source_document}]
- Water Resistance: ${core.water_resistance.value} (${core.water_resistance.label}) [Source: ${core.water_resistance.source_document}]
- Connectivity: ${core.connectivity.value} (${core.connectivity.label}) [Source: ${core.connectivity.source_document}]
- Reading Interval: ${core.reading_interval.value} ${core.reading_interval.unit} (${core.reading_interval.label}) [Source: ${core.reading_interval.source_document}]
- Daily Readings (Calculated): ~${core.daily_readings_calculated.value.toLocaleString()} readings/day [CALCULATED_VALUE]
- 15-Day Readings (Calculated): ~${core.sensor_readings_calculated.value.toLocaleString()} theoretical readings/sensor [CALCULATED_VALUE]
- Calibration: ${core.calibration.value} [Source: Official Website & IFU]
- Replacement Warranty: ${core.replacement_warranty.value} Days [Source: Official MyPharmEvo Website] (CRITICAL: Distinct from 15-day sensor lifespan)
- Package Contents: ${core.package_contents.items.join(' + ')} [Source: Official MyPharmEvo Website]

COMMERCIAL PRICING STRUCTURE & PROVENANCE:
1. DISTRIBUTOR_PRICE (Internal Commercial):
   - Amount: PKR 12,900 per sensor/unit
   - Classification: DISTRIBUTOR_PRICE
   - Visibility: INTERNAL
   - Source Type: COMPANY_FIELD_DATA (Verification Status: VERIFIED, Last Verified: 2026-09-01)
   - Specialist Query Trigger: "What is our distributor price?" -> Answer: "PKR 12,900 per EvoCheck Premium Linx sensor/unit."

2. PUBLIC_RETAIL_PRICE (Patient Online Store):
   - Amount: PKR 13,600 (Current listing sale price; Regular PKR 17,000 with 20% discount)
   - Classification: PUBLIC_RETAIL_PRICE
   - Visibility: PUBLIC
   - Source Type: OFFICIAL_MY_PHARM_EVO_LISTING (Verification Status: WEB_VERIFIED, Last Verified: 2026-09-01)
   - URL: https://mypharmevo.pk/products/evocheck-premium-linx-cgm
   - Specialist/Patient Query Trigger: "What is the patient/public online price?" -> Answer: "PKR 13,600, based on the current MyPharmEvo listing."

3. INSTITUTIONAL_PRICE (Hospital / Tender Rate):
   - Status: NOT_CONFIGURED (Institutional hospital tender rate pending commercial authorization)

VERIFIED CLAIMS & EVIDENCE:
${kb.verified_claims.map(c => `- [${c.claim_id}] (${c.claim_type}): "${c.claim_text}" | Source: ${c.source_type} (${c.source_document || c.source_reference || 'Verified'})`).join('\n')}

QUARANTINED / UNAPPROVED CLAIMS (STRICTLY PROHIBITED):
${kb.quarantined_claims.map(q => `- [PROHIBITED] "${q.claim_text}" (Reason: ${q.notes})`).join('\n')}

COMPETITOR COMPARISON FACTS:
- Abbott FreeStyle Libre: 9.2% MARD, 14 days wear, IP27, manual NFC scan tap for Libre 1.
- SIBIONICS CGM: 8.83% MARD, 14 days wear, IPX8, BLE.

CRITICAL AI PRICING & COMPLIANCE GUARDRAILS:
1. When asked "What is our distributor price?":
   -> You MUST answer: "PKR 12,900 per EvoCheck Premium Linx sensor/unit."
2. When asked "What is the patient/public online price?":
   -> You MUST answer: "PKR 13,600, based on the current MyPharmEvo listing."
3. When discussing price with a doctor:
   - Clearly distinguish distributor/internal price (PKR 12,900) from patient-facing retail price (PKR 13,600).
   - Do not expose internal commercial information to patients unless the user explicitly asks for it.
   - Do not claim that PKR 12,900 is the official patient selling price.
   - Do not calculate or invent discounts, margins, commissions, or promotional pricing unless those values are explicitly present in the verified knowledge base.
4. DO NOT confuse the 12-day replacement warranty with the 15-day sensor wear duration.
5. DO NOT infer MARD 8.66%, IP68, 1-min interval, BLE 5.2, or 21,600 readings from the website. Keep them sourced from verified product technical documentation.
6. If asked about a specification not present in this verified store, you MUST respond:
   "This EvoCheck specification is not currently available in the verified MedRep AI knowledge base."
7. Clearly distinguish [FACT] (verified documentation), [INFERENCE] (doctor context), and [RECOMMENDATION] (compliant sales strategy).
======================================================================
`;
}

/**
 * Helper: Query specification safely with fallback.
 */
export function queryEvoCheckSpecification(specKey: string): { found: boolean; value?: any; message?: string; source?: string } {
  const core = EVOCHECK_MASTER_KNOWLEDGE.core_specifications;
  const pricing = EVOCHECK_MASTER_KNOWLEDGE.pricing;
  const key = specKey.toLowerCase().trim();

  if (key === 'mard' || key === 'accuracy') {
    return { 
      found: true, 
      value: `${core.mard.value}% (Verified Product Specification)`,
      source: 'Verified EvoCheck technical/product documentation'
    };
  }
  if (key === 'wear' || key === 'duration' || key === 'wear_duration' || key === 'sensor_life') {
    return { 
      found: true, 
      value: `${core.wear_duration.value} days (Verified Product Specification & Website Confirmed)`,
      source: 'Official MyPharmEvo listing + verified product documentation'
    };
  }
  if (key === 'warranty' || key === 'replacement_warranty') {
    return {
      found: true,
      value: `${core.replacement_warranty.value}-day replacement warranty (Distinct from 15-day sensor wear life)`,
      source: 'Official MyPharmEvo product listing'
    };
  }
  if (key === 'water' || key === 'waterproof' || key === 'water_resistance' || key === 'ip_rating') {
    return { 
      found: true, 
      value: `${core.water_resistance.value} (Certified Ingress Protection / Water & Sweat Resistant)`,
      source: 'Verified EvoCheck technical/product documentation (IEC 60529) & Official MyPharmEvo listing'
    };
  }
  if (key === 'connectivity' || key === 'bluetooth' || key === 'ble') {
    return { 
      found: true, 
      value: `${core.connectivity.value} (Verified Product Specification & Smartphone Connectivity)`,
      source: 'Verified EvoCheck technical/product documentation & Official MyPharmEvo listing'
    };
  }
  if (key === 'reading_interval' || key === 'frequency') {
    return { 
      found: true, 
      value: `${core.reading_interval.value} minute (Verified Product Specification)`,
      source: 'Verified EvoCheck technical/product documentation'
    };
  }
  if (key === 'package_contents' || key === 'box_contents' || key === 'package') {
    return {
      found: true,
      value: core.package_contents.items.join(' + '),
      source: 'Official MyPharmEvo product listing'
    };
  }
  if (key === 'readings_per_day' || key === 'daily_readings') {
    return { 
      found: true, 
      value: `Approximately 1,440 readings per day (Calculated Value derived from 1-min interval)`,
      source: 'Derived mathematical calculation'
    };
  }
  if (key === 'readings_per_sensor' || key === 'total_readings') {
    return { 
      found: true, 
      value: `Approximately 21,600 theoretical readings per 15-day sensor (Calculated Value)`,
      source: 'Derived mathematical calculation'
    };
  }
  if (key === 'regulatory' || key === 'drap') {
    return { 
      found: true, 
      value: `DRAP_APPROVED (Registration #DRAP-MD-2025-084)`,
      source: 'DRAP Medical Device Registration Registry'
    };
  }
  if (key === 'distributor_price' || key === 'distributor' || key === 'internal_price' || key === 'wholesale_price' || key === 'trade_price') {
    return {
      found: true,
      value: 'PKR 12,900 per EvoCheck Premium Linx sensor/unit (Authorized Internal Distributor Price)',
      source: 'COMPANY_FIELD_DATA (Internal Verified)'
    };
  }
  if (key === 'retail_price' || key === 'public_price' || key === 'patient_price' || key === 'online_price' || key === 'website_price') {
    return { 
      found: true, 
      value: 'PKR 13,600, based on current MyPharmEvo listing (Regular: PKR 17,000, 20% discount)',
      source: 'OFFICIAL_MY_PHARM_EVO_LISTING'
    };
  }
  if (key === 'price' || key === 'pricing' || key === 'cost') {
    return { 
      found: true, 
      value: 'Distributor Price: PKR 12,900 per sensor/unit (Internal) | Public Online Price: PKR 13,600 (MyPharmEvo listing)',
      source: 'COMPANY_FIELD_DATA & OFFICIAL_MY_PHARM_EVO_LISTING'
    };
  }

  return {
    found: false,
    message: 'This EvoCheck specification is not currently available in the verified MedRep AI knowledge base.'
  };
}
