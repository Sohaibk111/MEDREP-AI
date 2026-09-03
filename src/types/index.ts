export type PriorityTier = 'A' | 'B' | 'C';
export type PrescriberStatus = 'prospect' | 'trialing' | 'active_prescriber' | 'dormant' | 'advocate';
export type CGMPotential = 'high' | 'medium' | 'low';
export type AffordabilityTier = 'premium' | 'upper_middle' | 'middle' | 'lower_middle';
export type VisitStatus = 'planned' | 'in_progress' | 'completed' | 'rescheduled' | 'missed';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type SourceType = 'field_verified' | 'rep_voice_entry' | 'company_provided' | 'web_researched' | 'ai_inferred';

export interface DoctorContact {
  id: string;
  type: 'mobile' | 'whatsapp' | 'clinic_landline' | 'email';
  value: string;
  isPrimary: boolean;
  isVerified: boolean;
}

export interface DoctorTiming {
  id: string;
  locationName: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  dayName: string;
  startTime: string; // "10:00 AM"
  endTime: string;   // "02:00 PM"
  timingType: 'opd' | 'ward_round' | 'private_consultation';
  source: SourceType;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  subSpecialty?: string;
  qualification?: string;
  hospital: string;
  clinic: string;
  area: string; // e.g. "PWD", "Saidpur Road", "Commercial Market", "PIMS", "Shifa International"
  city: string;
  address: string;
  priority: PriorityTier;
  prescriberStatus: PrescriberStatus;
  cgmPotential: CGMPotential;
  affordabilityTier: AffordabilityTier;
  relationshipStrength: number; // 1-5
  potentialScore: number; // 0-100 (factual attributes)
  dailyPriorityScore: number; // 0-100 (dynamic daily rank)
  paName?: string; // Gatekeeper
  paContact?: string;
  contacts: DoctorContact[];
  timings: DoctorTiming[];
  lastVisitedDate?: string;
  nextScheduledVisit?: string;
  totalVisitsCount: number;
  openPatientOpportunitiesCount: number;
  recentObjections?: string[];
  notes?: string;
  isVerified: boolean;
  hasConflict?: boolean;
}

export interface VisitObjective {
  id: string;
  text: string;
  isAchieved: boolean;
}

export interface VisitObjection {
  id: string;
  category: 'price_affordability' | 'sensor_accuracy' | 'wear_duration' | 'competitor_loyalty' | 'patient_compliance' | 'other';
  detail: string;
  responseGiven?: string;
  resolved: boolean;
}

export interface Visit {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  hospitalClinic: string;
  area: string;
  scheduledDate: string;
  scheduledTime: string;
  status: VisitStatus;
  checkInTime?: string;
  checkOutTime?: string;
  durationMinutes?: number;
  objectives: VisitObjective[];
  outcomes?: string[];
  objections?: VisitObjection[];
  summary?: string;
  interestLevel?: 'very_high' | 'moderate' | 'neutral' | 'skeptical' | 'not_interested';
  nextFollowUpDate?: string;
  nextVisitObjective?: string;
}

export interface FollowupTask {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorArea?: string;
  visitId?: string;
  title: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  isCompleted?: boolean;
  source: 'visit' | 'manual' | 'ai_recommendation';
  completedAt?: string;
  completedNotes?: string;
}

export interface AnonymousPatientOpportunity {
  id: string;
  patientCode: string; // e.g. "P-101"
  anonymousPatientCode?: string; // alias
  doctorId: string;
  doctorName?: string;
  clinicalProfile: string; // e.g. "Type 1 Young Adult", "Type 2 Uncontrolled HbA1c > 9%"
  status: 'recommended' | 'trial_scheduled' | 'sensor_installed' | 'reordered' | 'declined';
  stage?: 'recommended' | 'trial_scheduled' | 'sensor_installed' | 'reordered' | 'declined';
  units: number;
  unitPrice?: number;
  totalValue?: number;
  productName?: string;
  declineReason?: string;
  estimatedValuePKR?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FieldPlanStop {
  id: string;
  doctorId: string;
  doctorName?: string;
  doctor?: Doctor;
  specialty?: string;
  hospitalClinic?: string;
  hospitalName?: string;
  preferredTimeSlot?: string;
  area?: string;
  timingSlot?: string;
  priority: PriorityTier;
  plannedTime?: string;
  estDurationMinutes?: number;
  visitId?: string;
  isCompleted?: boolean;
}

export interface DayPlan {
  date: string;
  dayName: string;
  routeClusterName?: string;
  targetArea?: string;
  areaCluster?: string;
  stops: FieldPlanStop[];
}

export interface WeeklyFieldPlan {
  id: string;
  weekIdentifier?: string;
  weekStartDate: string;
  weekEndDate: string;
  days: any; // supports array or keyed map
}

export type ClaimType =
  | 'TECHNICAL_SPECIFICATION'
  | 'PERFORMANCE_METRIC'
  | 'WEAR_DURATION'
  | 'CONNECTIVITY'
  | 'WATER_RESISTANCE'
  | 'ALERT_FEATURE'
  | 'APP_FEATURE'
  | 'PATIENT_USAGE'
  | 'INSTALLATION'
  | 'CLINICAL_INFORMATION'
  | 'REGULATORY_STATUS'
  | 'COMPETITOR_COMPARISON'
  | 'CALCULATED_VALUE';

export type ClaimVerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING_REVIEW'
  | 'PENDING_SOURCE_VERIFICATION'
  | 'VERIFIED'
  | 'WEB_VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'QUARANTINED';

export type ClaimApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'QUARANTINED';

export type ProductSourceType =
  | 'OFFICIAL_COMPANY_WEBSITE'
  | 'OFFICIAL_PRODUCT_DOCUMENT'
  | 'OFFICIAL_IFU'
  | 'REGULATORY_DOCUMENT'
  | 'PROJECT_VERIFIED_INFORMATION'
  | 'EXTERNAL_SOURCE'
  | 'OFFICIAL_TECHNICAL_DOSSIER'
  | 'OFFICIAL_IFU_LABEL'
  | 'CLINICAL_STUDY'
  | 'DRAP_REGULATORY_RECORD'
  | 'PROJECT_PRODUCT_KNOWLEDGE'
  | 'COMPETITOR_PUBLIC_SPEC'
  | 'UNVERIFIED_FIELD_NOTE'
  | 'COMPANY_FIELD_DATA'
  | 'OFFICIAL_MY_PHARM_EVO_LISTING';

export type PricingType = 'DISTRIBUTOR_PRICE' | 'PUBLIC_RETAIL_PRICE' | 'INSTITUTIONAL_PRICE';
export type PricingVisibility = 'INTERNAL' | 'PUBLIC' | 'CONFIDENTIAL';

export interface PricingProvenanceRecord {
  pricing_type: PricingType;
  amount: number;
  currency: string;
  product: string;
  source_type: 'COMPANY_FIELD_DATA' | 'OFFICIAL_MY_PHARM_EVO_LISTING' | ProductSourceType;
  verification_status: 'VERIFIED' | 'WEB_VERIFIED' | ClaimVerificationStatus;
  visibility: PricingVisibility;
  last_verified: string;
  notes?: string;
  regular_amount?: number;
  discount_percentage?: number;
}

export interface ClaimSourceRecord {
  source_type: ProductSourceType;
  source_title: string;
  source_url?: string;
  source_reference?: string;
  verification_status?: ClaimVerificationStatus;
  notes?: string;
}

export interface ProductClaim {
  claim_id: string;
  product_id: string; // e.g. 'evocheck-cgm'
  claim_text: string;
  claim_type: ClaimType;
  value: string | number | boolean;
  unit?: string;
  source_type: ProductSourceType;
  source_document?: string;
  source_reference?: string;
  source_url?: string;
  sources?: ClaimSourceRecord[];
  verification_status: ClaimVerificationStatus;
  approval_status: ClaimApprovalStatus;
  confidence: number; // 0.0 - 1.0
  effective_date?: string;
  review_date?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  calculation_formula?: string;
  is_quarantined?: boolean;
}

export interface PricingCategoryRecord {
  status: 'CURRENT_WEBSITE_PRICE' | 'NOT_CONFIGURED' | 'CONFIGURED' | 'PENDING_REVIEW';
  display_text: string;
  regular_price_pkr?: number;
  sale_price_pkr?: number;
  discount_percentage?: number;
  source: string;
  source_type: ProductSourceType;
  source_url?: string;
  notes?: string;
  effective_date?: string;
}

export interface ProductKnowledgeSourceRecord {
  id: string;
  title: string;
  source_type: ProductSourceType;
  url?: string;
  reference?: string;
  provenance_rank: number; // 1 = highest authoritative level
  description: string;
  last_verified: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface ProductKnowledgeBase {
  version: string;
  last_synced_at: string;
  product_id: string;
  product_name: string;
  system_name: string;
  regulatory_status: 'DRAP_APPROVED' | 'PENDING_REGISTRATION' | 'NOT_REGISTERED';
  regulatory_notes: string;
  sources_registry: ProductKnowledgeSourceRecord[];
  pricing: {
    status: 'NOT_CONFIGURED' | 'CONFIGURED';
    display_text: string;
    current_price_pkr?: number;
    effective_date?: string;
    territory?: string;
    source?: string;
    approval_status?: string;
    historical_prices: { date: string; pricePKR: number; notes?: string }[];
    retail_website_price: PricingCategoryRecord;
    field_distributor_price: PricingCategoryRecord;
    institutional_price: PricingCategoryRecord;
    distributor_price?: PricingProvenanceRecord;
    public_retail_price?: PricingProvenanceRecord;
  };
  core_specifications: {
    mard: { 
      value: number; 
      unit: string; 
      status: ClaimVerificationStatus; 
      label: string;
      source_type: ProductSourceType;
      source_document: string;
      sources?: ClaimSourceRecord[];
    };
    wear_duration: { 
      value: number; 
      unit: string; 
      status: ClaimVerificationStatus; 
      label: string;
      source_type: ProductSourceType;
      source_document: string;
      sources?: ClaimSourceRecord[];
    };
    water_resistance: { 
      value: string; 
      unit?: string; 
      status: ClaimVerificationStatus; 
      label: string;
      source_type: ProductSourceType;
      source_document: string;
      sources?: ClaimSourceRecord[];
    };
    connectivity: { 
      value: string; 
      status: ClaimVerificationStatus; 
      label: string;
      source_type: ProductSourceType;
      source_document: string;
      sources?: ClaimSourceRecord[];
    };
    reading_interval: { 
      value: number; 
      unit: string; 
      status: ClaimVerificationStatus; 
      label: string;
      source_type: ProductSourceType;
      source_document: string;
      sources?: ClaimSourceRecord[];
    };
    daily_readings_calculated: { 
      value: number; 
      unit: string; 
      status: ClaimVerificationStatus; 
      type: 'CALCULATED_VALUE'; 
      formula: string;
      source_type: ProductSourceType;
      sources?: ClaimSourceRecord[];
    };
    sensor_readings_calculated: { 
      value: number; 
      unit: string; 
      status: ClaimVerificationStatus; 
      type: 'CALCULATED_VALUE'; 
      formula: string;
      source_type: ProductSourceType;
      sources?: ClaimSourceRecord[];
    };
    calibration: { 
      value: string; 
      status: ClaimVerificationStatus; 
      label: string;
      source_type: ProductSourceType;
      sources?: ClaimSourceRecord[];
    };
    replacement_warranty: {
      value: number;
      unit: string;
      status: ClaimVerificationStatus;
      label: string;
      source_type: ProductSourceType;
      source_document: string;
      source_url?: string;
      notes: string;
      sources?: ClaimSourceRecord[];
    };
    package_contents: {
      items: string[];
      status: ClaimVerificationStatus;
      label: string;
      source_type: ProductSourceType;
      source_document: string;
      source_url?: string;
      sources?: ClaimSourceRecord[];
    };
  };
  verified_claims: ProductClaim[];
  quarantined_claims: ProductClaim[];
  features: {
    feature_id: string;
    name: string;
    description: string;
    status: ClaimVerificationStatus;
    source_reference?: string;
  }[];
  competitors: CompetitorProduct[];
  objection_guidelines: {
    id: string;
    category: string;
    doctorStatement: string;
    compliantResponse: string;
    grounded_claim_ids: string[];
    what_not_to_say: string;
  }[];
}

export interface CompetitorProduct {
  product_id: string;
  brand_name: string;
  manufacturer: string;
  price_pkr?: number;
  price_display?: string;
  wear_duration_days?: number;
  claimed_mard?: number;
  water_resistance?: string;
  strengths: string[];
  weaknesses: string[];
  approved_comparison_facts: string[];
  source_reference: string;
  verification_status: ClaimVerificationStatus;
}

export interface EvoCheckProductKnowledge {
  version?: string;
  specs: {
    mardScore: number;
    sensorLifeDays: number;
    calibrationRequired: boolean;
    warmupMinutes?: number;
    readingIntervalMinutes?: number;
    dailyReadingsCalculated?: number;
    sensorReadingsCalculated?: number;
    telemetryProtocol: string;
    waterResistanceRating: string;
    calibrationStatus?: string;
  };
  pricing?: {
    status: string;
    display_text: string;
  };
  regulatory?: {
    status: string;
  };
  clinicalClaims: {
    id: string;
    category: string;
    headline: string;
    claimText: string;
    evidenceSource: string;
    drapApprovalDate?: string;
    verificationStatus?: string;
    claimType?: string;
  }[];
  quarantinedClaims?: {
    id: string;
    headline: string;
    claimText: string;
    reason: string;
    quarantineDate: string;
  }[];
  competitors: {
    name: string;
    mardClaim: string;
    approxPricePKR: string;
    ourDifferentiator: string;
    theirWeakness: string;
  }[];
  objectionLibrary: {
    category: string;
    doctorStatement: string;
    compliantResponse: string;
    whatNotToSay?: string;
  }[];
}

export interface AICoachBriefing {
  doctorId: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  priority: PriorityTier;
  whyImportant: {
    type: 'FACT' | 'INFERENCE';
    content: string;
  };
  todayObjective: {
    type: 'RECOMMENDATION';
    content: string;
  };
  suggestedOpening: {
    type: 'RECOMMENDATION';
    content: string;
  };
  keyProductPoints: {
    type: 'FACT';
    content: string;
  }[];
  questionsToAsk: {
    type: 'RECOMMENDATION';
    content: string;
  }[];
  possibleObjections: {
    objection: string;
    suggestedResponse: string;
    type: 'INFERENCE' | 'FACT';
  }[];
  whatNotToSay: {
    type: 'RECOMMENDATION';
    content: string;
  }[];
  suggestedClose: {
    type: 'RECOMMENDATION';
    content: string;
  };
  nextVisitObjective: {
    type: 'RECOMMENDATION';
    content: string;
  };
}

export interface VoiceNoteExtraction {
  doctorId?: string;
  doctorName?: string;
  visitDate: string;
  interestLevel: 'very_high' | 'moderate' | 'neutral' | 'skeptical' | 'not_interested';
  productDiscussed: string;
  keyDiscussionPoints: string[];
  objectionsRaised: {
    category: string;
    detail: string;
    responseGiven?: string;
  }[];
  patientOpportunity?: {
    patientCode?: string;
    clinicalProfile: string;
    units: number;
  };
  actionItems: {
    title: string;
    dueInDays: number;
    priority: TaskPriority;
  }[];
  nextVisitObjective?: string;
  nextFollowUpDate?: string;
  rawTranscript: string;
  confidence: number;
}

export interface DataConflict {
  id: string;
  entityType: 'doctor_timing' | 'doctor_contact' | 'doctor_details';
  entityId: string;
  doctorName: string;
  fieldName: string;
  currentVerifiedValue: string;
  incomingValue: string;
  incomingSource: SourceType;
  detectedAt: string;
  status: 'unresolved' | 'accepted_incoming' | 'retained_current';
}

export interface ApprovedProductClaim {
  id: string;
  category: 'accuracy' | 'wear_duration' | 'convenience' | 'app_connectivity' | 'drap_compliance';
  headline: string;
  claimText: string;
  clinicalSource: string;
  effectiveDate: string;
  status: 'approved' | 'under_review';
}

export interface CompetitorComparison {
  id: string;
  brandName: string;
  manufacturer: string;
  pricePKR: number;
  wearDurationDays: number;
  mardRating: number;
  keyStrengths: string[];
  keyWeaknesses: string[];
  approvedCounterArguments: string[];
}

// ==========================================
// MEDREP AI v1.1 EXPANDED OPERATIONAL TYPES
// ==========================================

export type VisitOutcomeType =
  | 'LOGGED'
  | 'SAMPLE_PROVIDED'
  | 'TRIAL_STARTED'
  | 'FOLLOW_UP_SCHEDULED'
  | 'CME_INVITED'
  | 'NO_INTEREST'
  | 'COMPETITOR_PREFERENCE'
  | 'PRICE_OBJECTION'
  | 'CLINICAL_OBJECTION'
  | 'CONVERTED'
  | 'OTHER';

export type PrescriberJourneyState =
  | 'PROSPECTING'
  | 'TRIALING'
  | 'ADOPTING'
  | 'HIGH_PRESCRIBER';

export interface VisitOutcomeRecord {
  id: string;
  visitId: string;
  doctorId: string;
  outcomeType: VisitOutcomeType;
  timestamp: string;
  notes?: string;
  samplesCount?: number;
  committedUnits?: number;
  nextActionRecommendation: string;
  previousJourneyState?: PrescriberJourneyState;
  updatedJourneyState: PrescriberJourneyState;
  followUpDate?: string;
}

export interface DayEndSummaryMetrics {
  targetDate: string;
  totalPlannedVisits: number;
  completedVisits: number;
  pendingVisits: number;
  samplesProvided: number;
  trialsStarted: number;
  followUpsScheduled: number;
  cmeInvitations: number;
  convertedVisits: number;
  newOpportunitiesCount: number;
  totalCommittedUnits: number;
  totalPipelineValuePKR: number;
}

export interface DayEndSummaryReport {
  summaryId: string;
  date: string;
  generatedAt: string;
  territoryName: string;
  representativeName: string;
  metrics: DayEndSummaryMetrics;
  outcomesBreakdown: Record<VisitOutcomeType, number>;
  completedVisitDetails: {
    visitId: string;
    doctorId: string;
    doctorName: string;
    hospitalClinic: string;
    area: string;
    outcomeType?: VisitOutcomeType;
    interestLevel?: string;
    notes?: string;
    nextFollowUpDate?: string;
  }[];
  notableObjections: {
    doctorId: string;
    doctorName: string;
    category: string;
    detail: string;
    responseGiven?: string;
  }[];
  outstandingFollowups: {
    taskId: string;
    doctorId: string;
    doctorName: string;
    title: string;
    dueDate: string;
    priority: string;
  }[];
  executiveSummaryText: string;
  exportableTextFormat: string;
}

export type ObjectionScenarioId =
  | 'SCENARIO_AFFORDABILITY'
  | 'SCENARIO_COMPETITOR_LIBRE'
  | 'SCENARIO_MARD_ACCURACY'
  | 'SCENARIO_WEAR_DURATION'
  | 'SCENARIO_WATER_RESISTANCE'
  | 'SCENARIO_HOSPITAL_PRICE'
  | 'SCENARIO_DISCOUNT_REQUEST'
  | 'SCENARIO_HYPOGLYCEMIA_PREVENTION'
  | 'SCENARIO_FINGERSTICK_REPLACEMENT'
  | 'SCENARIO_CLINICAL_EVIDENCE';

export interface ObjectionScenarioDefinition {
  id: ObjectionScenarioId;
  title: string;
  category: 'Commercial & Price' | 'Clinical & Evidence' | 'Technical Specs' | 'Competitor Contrast';
  difficulty: 'Standard' | 'Challenging' | 'Advanced';
  doctorPersona: string;
  doctorStatement: string;
  keyEvaluationPoints: string[];
  authorizedResponseFact: string;
  safetyTrapWarning?: string;
}

export interface ObjectionDrillRequest {
  scenarioId: ObjectionScenarioId;
  repResponse: string;
  doctorId?: string;
}

export interface ObjectionDrillDimensionScore {
  name: 'Accuracy' | 'Grounding' | 'Compliance' | 'Persuasiveness' | 'Clarity' | 'Objection Handling';
  score: number; // 0 - 100
  feedback: string;
}

export interface ObjectionDrillResponse {
  drillId: string;
  scenarioId: ObjectionScenarioId;
  scenarioTitle: string;
  doctorStatement: string;
  repResponse: string;
  overallScore: number; // 0 - 100
  isCompliant: boolean;
  accuracyScore: number;
  persuasivenessScore: number;
  dimensions: ObjectionDrillDimensionScore[];
  whatDoneWell: string[];
  whatCouldImprove: string[];
  groundedRecommendedResponse: string;
  safetyFlags: string[];
  verifiedFactsCited: string[];
  evaluatedAt: string;
}

export type RouteStopStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface RouteStopIntelligence {
  stopOrder: number;
  visitId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  hospitalClinic: string;
  area: string;
  consultationWindow: string; // e.g. "10:00 AM - 01:00 PM"
  plannedTime: string;        // e.g. "11:00 AM"
  priorityTier: PriorityTier;
  prescriberJourney: PrescriberJourneyState;
  status: RouteStopStatus;
  priorityScore: number;      // 0 - 100 deterministic
  priorityReason: string;     // Transparent rationale
  openOpportunitiesCount: number;
  hasOverdueFollowup: boolean;
  recommendedFocus: string;
}

export interface RoutePlanResponse {
  date: string;
  targetTerritory: string;
  totalStops: number;
  completedStops: number;
  pendingStops: number;
  stops: RouteStopIntelligence[];
  routeSummaryReasoning: string;
}

export interface DashboardBriefingStats {
  completedVisits: number;
  plannedVisitsToday: number;
  activePatientOpportunities: number;
  verifiedDoctorsCount: number;
}

export interface DashboardBriefingData {
  date: string;
  todayDate: string;
  territory: string;
  visitsTarget: number;
  visitsPlanned: number;
  visitsCompleted: number;
  openOpportunitiesCount: number;
  priorityRouteLevel: string;
  nextVisit?: Visit;
  urgentFollowups: FollowupTask[];
  activeConflictsCount: number;
  knowledgeHub: {
    productName: string;
    claimsCount: number;
    competitorsTracked: number;
  };
  stats: DashboardBriefingStats;
  priorityCallOfTheMoment: any;
  todayVisitsQueue: Visit[];
  urgentTasks: FollowupTask[];
  topTerritoryOpportunities: AnonymousPatientOpportunity[];
}
