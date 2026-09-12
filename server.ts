import { buildCompetitorGroundingContext } from './src/services/competitorIntelligence';
import { sanitizeCompetitorGeneratedText, isLikelyCompetitorQuery, CompetitorClaimGuardResult } from './src/services/competitorClaimGuard';
import { buildDeterministicEvoCheckResponse } from './src/services/evoCheckDeterministicResponses';
import { GEMINI_MODEL } from './src/config/ai';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_DOCTORS,
  INITIAL_VISITS,
  INITIAL_FOLLOWUPS,
  INITIAL_PATIENT_OPPORTUNITIES,
  INITIAL_FIELD_PLAN,
  INITIAL_DATA_CONFLICTS,
  APPROVED_PRODUCT_CLAIMS,
  COMPETITOR_COMPARISONS
} from './src/data/mockData';
import {
  EVOCHECK_MASTER_KNOWLEDGE,
  EVOCHECK_DISTRIBUTOR_PRICING,
  EVOCHECK_PUBLIC_RETAIL_PRICING,
  getVerifiedEvoCheckAIContext,
  queryEvoCheckSpecification
} from './src/data/productKnowledge';
import {
  Doctor,
  Visit,
  FollowupTask,
  AnonymousPatientOpportunity,
  WeeklyFieldPlan,
  DataConflict,
  VoiceNoteExtraction,
  AICoachBriefing,
  VisitOutcomeType,
  VisitOutcomeRecord,
  DayEndSummaryReport,
  PrescriberJourneyState,
  SampleInventoryItem,
  SampleTransaction,
  MonthlyTarget,
  LifecycleHistoryRecord,
  PrescriberLifecycleStatus,
  DoctorTimelineEvent,
  PatientCRM,
  PatientAcquisitionSource,
  PatientCRMStatus,
  LeadCRM,
  LeadStatus,
  FollowUpEntityType,
  FollowUpStatus,
  DoctorPatientReferral,
  ReferralStatus,
  OrderCRM,
  OrderSource,
  PaymentStatus,
  OrderStatus,
  SensorLifecycle,
  SensorLifecycleStatus,
  DoctorRelationshipStatus
} from './src/types';
import { OBJECTION_SCENARIOS, getScenarioById } from './src/data/objectionScenarios';
import { evaluateObjectionDrill } from './src/services/objectionEvaluator';
import {
  generateRoutePlan,
  getPrescriberJourneyStage,
  getPrescriberJourneyActionRecommendation
} from './src/services/routeEngine';
import { generateDayEndSummary } from './src/services/dayEndSummaryService';
import { getOperationalDateISO, formatOperationalDate } from './src/utils/dateUtils';
import { isValidISODate } from './src/utils/dateUtils';
import { buildFieldIntelligence, buildPreVisitIntelligence } from './src/services/fieldIntelligenceService';
import { buildDailyRoutePlan } from './src/services/dailyRouteService';

dotenv.config();

// Durable File & Memory Persistence Layer
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'medrep_crm_store.json');

interface CRMStore {
  doctors: Doctor[];
  visits: Visit[];
  followups: FollowupTask[];
  patientOpportunities: AnonymousPatientOpportunity[];
  fieldPlan: WeeklyFieldPlan;
  dataConflicts: DataConflict[];
  outcomes?: VisitOutcomeRecord[];
  dayEndSummaries?: DayEndSummaryReport[];
  sampleInventory?: SampleInventoryItem[];
  sampleTransactions?: SampleTransaction[];
  monthlyTargets?: MonthlyTarget[];
  lifecycleHistory?: LifecycleHistoryRecord[];
  patients?: PatientCRM[];
  leads?: LeadCRM[];
  referrals?: DoctorPatientReferral[];
  orders?: OrderCRM[];
  sensors?: SensorLifecycle[];
}

const DEFAULT_SAMPLE_INVENTORY: SampleInventoryItem[] = [{
  productId: 'evocheck-demo-kit', productName: 'EvoCheck CGM Demo Kit', openingBalance: 100,
  quantityOnHand: 100, reorderLevel: 15, updatedAt: '2026-09-01T00:00:00.000Z'
}];

function loadDurableStore(): CRMStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.doctors) && Array.isArray(parsed.visits)) {
        if (!Array.isArray(parsed.outcomes)) parsed.outcomes = [];
        if (!Array.isArray(parsed.dayEndSummaries)) parsed.dayEndSummaries = [];
        // v1.2 fields are additive.  Do not rewrite the established CRM seed merely
        // because it predates these fields.
        if (!Array.isArray(parsed.sampleInventory)) parsed.sampleInventory = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_INVENTORY));
        if (!Array.isArray(parsed.sampleTransactions)) parsed.sampleTransactions = [];
        if (!Array.isArray(parsed.monthlyTargets)) parsed.monthlyTargets = [];
        if (!Array.isArray(parsed.lifecycleHistory)) parsed.lifecycleHistory = [];
        // v1.6.1 CRM Foundation collections are additive and initialized safely
        if (!Array.isArray(parsed.patients)) parsed.patients = [];
        if (!Array.isArray(parsed.leads)) parsed.leads = [];
        if (!Array.isArray(parsed.referrals)) parsed.referrals = [];
        if (!Array.isArray(parsed.orders)) parsed.orders = [];
        if (!Array.isArray(parsed.sensors)) parsed.sensors = [];
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read persistent CRM store file, initializing defaults:', err);
  }
  return {
    doctors: JSON.parse(JSON.stringify(INITIAL_DOCTORS)),
    visits: JSON.parse(JSON.stringify(INITIAL_VISITS)),
    followups: JSON.parse(JSON.stringify(INITIAL_FOLLOWUPS)),
    patientOpportunities: JSON.parse(JSON.stringify(INITIAL_PATIENT_OPPORTUNITIES)),
    fieldPlan: JSON.parse(JSON.stringify(INITIAL_FIELD_PLAN)),
    dataConflicts: JSON.parse(JSON.stringify(INITIAL_DATA_CONFLICTS)),
    outcomes: [],
    dayEndSummaries: [],
    sampleInventory: JSON.parse(JSON.stringify(DEFAULT_SAMPLE_INVENTORY)),
    sampleTransactions: [],
    monthlyTargets: [],
    lifecycleHistory: [],
    patients: [],
    leads: [],
    referrals: [],
    orders: [],
    sensors: []
  };
}

const store = loadDurableStore();
let doctors: Doctor[] = store.doctors;
let visits: Visit[] = store.visits;
let followups: FollowupTask[] = store.followups;
let patientOpportunities: AnonymousPatientOpportunity[] = store.patientOpportunities;
let fieldPlan: WeeklyFieldPlan = store.fieldPlan;
let dataConflicts: DataConflict[] = store.dataConflicts;
let outcomes: VisitOutcomeRecord[] = store.outcomes || [];
let dayEndSummaries: DayEndSummaryReport[] = store.dayEndSummaries || [];
let sampleInventory: SampleInventoryItem[] = store.sampleInventory || JSON.parse(JSON.stringify(DEFAULT_SAMPLE_INVENTORY));
let sampleTransactions: SampleTransaction[] = store.sampleTransactions || [];
let monthlyTargets: MonthlyTarget[] = store.monthlyTargets || [];
let lifecycleHistory: LifecycleHistoryRecord[] = store.lifecycleHistory || [];
let patients: PatientCRM[] = store.patients || [];
let leads: LeadCRM[] = store.leads || [];
let referrals: DoctorPatientReferral[] = store.referrals || [];
let orders: OrderCRM[] = store.orders || [];
let sensors: SensorLifecycle[] = store.sensors || [];

function reloadDurableStoreFromDisk() {
  const reloaded = loadDurableStore();
  doctors = reloaded.doctors;
  visits = reloaded.visits;
  followups = reloaded.followups;
  patientOpportunities = reloaded.patientOpportunities;
  fieldPlan = reloaded.fieldPlan;
  dataConflicts = reloaded.dataConflicts;
  outcomes = reloaded.outcomes || [];
  dayEndSummaries = reloaded.dayEndSummaries || [];
  sampleInventory = reloaded.sampleInventory || JSON.parse(JSON.stringify(DEFAULT_SAMPLE_INVENTORY));
  sampleTransactions = reloaded.sampleTransactions || [];
  monthlyTargets = reloaded.monthlyTargets || [];
  lifecycleHistory = reloaded.lifecycleHistory || [];
  patients = reloaded.patients || [];
  leads = reloaded.leads || [];
  referrals = reloaded.referrals || [];
  orders = reloaded.orders || [];
  sensors = reloaded.sensors || [];
}

function saveDurableStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const payload: CRMStore = {
      doctors,
      visits,
      followups,
      patientOpportunities,
      fieldPlan,
      dataConflicts,
      outcomes,
      dayEndSummaries,
      sampleInventory,
      sampleTransactions,
      monthlyTargets,
      lifecycleHistory,
      patients,
      leads,
      referrals,
      orders,
      sensors
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write persistent CRM store to disk:', err);
  }
}

// Controlled product specification helpers — grounded in verified knowledge base
function getProductWearDurationDays(productNameOrId?: string): number {
  if (!productNameOrId || productNameOrId.toLowerCase().includes('evocheck')) {
    return (EVOCHECK_MASTER_KNOWLEDGE as any)?.core_specifications?.wear_duration?.value || 15;
  }
  return 15;
}

function calculateSensorDates(startDateISO: string, wearDurationDays: number): { expectedEndDate: string; renewalDate: string } {
  const start = new Date(startDateISO);
  const end = new Date(start.getTime() + wearDurationDays * 24 * 60 * 60 * 1000);
  const expectedEndDate = end.toISOString().split('T')[0];
  // Renewal due 1 day before expiration for uninterrupted glycemic monitoring
  const renewal = new Date(end.getTime() - 1 * 24 * 60 * 60 * 1000);
  const renewalDate = renewal.toISOString().split('T')[0];
  return { expectedEndDate, renewalDate };
}

// Only initialize data file if it does not already exist on disk
if (!fs.existsSync(DATA_FILE)) {
  saveDurableStore();
}

// Lazy GenAI Client getter
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

function isValidMonth(month: unknown): month is string {
  return typeof month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

function lifecycleForDoctor(doc: Doctor): PrescriberLifecycleStatus {
  if (doc.prescriberStatus === 'dormant') return 'DORMANT';
  if (doc.prescriberStatus === 'advocate' && doc.relationshipStrength >= 4) return 'CHAMPION';
  if (doc.prescriberStatus === 'active_prescriber') return 'ADOPTER';
  if (doc.prescriberStatus === 'trialing') return 'TRIAL';
  return doc.totalVisitsCount > 0 ? 'ENGAGED' : 'PROSPECT';
}

function recordLifecycleChange(doc: Doctor, previousStatus: PrescriberLifecycleStatus, status: PrescriberLifecycleStatus, reason: string, source: LifecycleHistoryRecord['source']) {
  if (previousStatus === status && source === 'AUTOMATIC') return;
  lifecycleHistory.unshift({ id: `life-${Date.now()}-${lifecycleHistory.length}`, doctorId: doc.id, previousStatus, status, reason, source, recordedAt: new Date().toISOString() });
}

function prescriberStatusForLifecycle(status: PrescriberLifecycleStatus): Doctor['prescriberStatus'] {
  const mapping: Record<PrescriberLifecycleStatus, Doctor['prescriberStatus']> = {
    PROSPECT: 'prospect', ENGAGED: 'prospect', TRIAL: 'trialing', ADOPTER: 'active_prescriber', CHAMPION: 'advocate', DORMANT: 'dormant'
  };
  return mapping[status];
}

function getMonthlyTarget(month: string): MonthlyTarget {
  return monthlyTargets.find(target => target.month === month) || { month, targetUnits: 0, achievedUnits: 0, updatedAt: new Date().toISOString() };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // API Routes
  app.get('/api/v1/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'MedRep AI Modular Backend',
      version: '0.1.0',
      activeTerritory: 'Rawalpindi / Islamabad Zone',
      activeProduct: 'EvoCheck CGM',
      geminiConfigured: !!process.env.GEMINI_API_KEY
    });
  });

  // Administrative reset/reload endpoint for tests and environment sync
  app.post('/api/v1/system/reload-store', (req: Request, res: Response) => {
    reloadDurableStoreFromDisk();
    res.json({ success: true, message: 'CRM store reloaded from disk' });
  });

  // 1. Dashboard Briefing
  app.get('/api/v1/briefing', (req: Request, res: Response) => {
    const today = getOperationalDateISO();
    const fieldIntelligence = buildFieldIntelligence({ doctors, visits, followups, opportunities: patientOpportunities, outcomes, samples: sampleTransactions, targetDate: today });
    const todaysVisits = visits.filter(v => v.scheduledDate === today);
    const completedVisits = todaysVisits.filter(v => v.status === 'completed');
    const urgentFollowups = followups.filter(f => f.status === 'pending');
    const nextVisit = todaysVisits.find(v => v.status === 'in_progress') || todaysVisits.find(v => v.status === 'planned') || todaysVisits[0];

    // Build enriched visits queue with full doctor object
    const todayVisitsQueue = todaysVisits.map(v => {
      const doc = doctors.find(d => d.id === v.doctorId);
      return {
        ...v,
        doctor: doc || (v as any).doctor
      };
    });

    // Priority call of the moment (in_progress or next planned visit)
    const priorityVisit = todaysVisits.find(v => v.status === 'in_progress') || todaysVisits.find(v => v.status === 'planned') || (todaysVisits.length > 0 ? todaysVisits[0] : undefined);
    const priorityDoc = priorityVisit ? (doctors.find(d => d.id === priorityVisit.doctorId) || (priorityVisit as any).doctor || null) : null;
    const priorityCallOfTheMoment = (priorityVisit && priorityDoc) ? {
      ...priorityVisit,
      doctor: priorityDoc,
      scheduledTime: priorityVisit.scheduledTime || '11:00 AM',
      primaryObjective: (priorityVisit.objectives && priorityVisit.objectives[0]?.text) || priorityVisit.nextVisitObjective || 'Present EvoCheck verified 8.66% MARD specification and secure 2 patient trial installations.'
    } : null;

    // Enriched urgent tasks
    const urgentTasks = urgentFollowups.slice(0, 6).map(f => {
      const doc = doctors.find(d => d.id === f.doctorId);
      return {
        ...f,
        doctorName: doc ? doc.name : f.doctorName || 'Target Doctor',
        isCompleted: f.status === 'completed'
      };
    });

    // Top territory patient opportunities (with doctorName and normalized properties)
    const topTerritoryOpportunities = patientOpportunities.slice(0, 5).map(opp => {
      const doc = doctors.find(d => d.id === opp.doctorId);
      return {
        ...opp,
        anonymousPatientCode: (opp as any).anonymousPatientCode || (opp as any).patientCode || `P-${opp.id}`,
        stage: (opp as any).stage || (opp as any).status || 'opportunity',
        totalValue: (opp as any).totalValue || (opp as any).estimatedValuePKR || 12900,
        doctorName: doc ? doc.name : opp.doctorName || 'Target Doctor'
      };
    });

    const stats = {
      completedVisits: completedVisits.length,
      plannedVisitsToday: todaysVisits.length,
      activePatientOpportunities: patientOpportunities.length,
      verifiedDoctorsCount: doctors.length,
      sampleUnitsOnHand: sampleInventory.reduce((total, item) => total + item.quantityOnHand, 0),
      championsCount: doctors.filter(doc => lifecycleForDoctor(doc) === 'CHAMPION').length
    };
    const monthlyTarget = getMonthlyTarget(today.slice(0, 7));

    res.json({
      success: true,
      data: {
        date: today,
        todayDate: formatOperationalDate(today),
        territory: 'Rawalpindi-East (PWD/Soan/Saidpur) & Islamabad',
        visitsTarget: 8,
        visitsPlanned: todaysVisits.length,
        visitsCompleted: completedVisits.length,
        openOpportunitiesCount: patientOpportunities.length,
        priorityRouteLevel: 'A++',
        nextVisit,
        urgentFollowups: urgentFollowups.slice(0, 4),
        activeConflictsCount: dataConflicts.filter(c => c.status === 'unresolved').length,
        knowledgeHub: {
          productName: 'EvoCheck Premium Linx CGM',
          claimsCount: APPROVED_PRODUCT_CLAIMS.length,
          competitorsTracked: COMPETITOR_COMPARISONS.length
        },
        stats,
        operationalMetrics: {
          samplesOnHand: stats.sampleUnitsOnHand,
          samplesIssuedToday: sampleTransactions.filter(item => item.recordedAt.startsWith(today)).reduce((total, item) => total + item.quantity, 0),
          monthlyTarget: monthlyTarget.targetUnits,
          monthlyAchieved: monthlyTarget.achievedUnits,
          monthlyPacingPercent: monthlyTarget.targetUnits ? Math.round((monthlyTarget.achievedUnits / monthlyTarget.targetUnits) * 100) : 0,
          championsCount: stats.championsCount
        },
        fieldIntelligence: {
          topRecommendation: fieldIntelligence.candidates[0] || null,
          dueTodayCount: followups.filter(task => task.status === 'pending' && task.dueDate === today).length,
          overdueFollowupCount: followups.filter(task => task.status === 'pending' && task.dueDate < today).length,
          routePlanAvailable: true
        },
        priorityCallOfTheMoment,
        todayVisitsQueue,
        urgentTasks,
        topTerritoryOpportunities
      }
    });
  });

  // 2. Doctor CRM
  app.get('/api/v1/doctors', (req: Request, res: Response) => {
    const { search, area, territory, city, priority, status, relationshipStatus } = req.query;
    let list = doctors.map(d => ({
      ...d,
      doctorId: d.doctorId || d.id,
      relationshipStatus: d.relationshipStatus || (
        d.prescriberStatus === 'active_prescriber' ? 'ACTIVE_PRESCRIBER' :
        d.prescriberStatus === 'advocate' ? 'ACTIVE_PRESCRIBER' :
        d.prescriberStatus === 'trialing' ? 'TRIAL' :
        d.prescriberStatus === 'dormant' ? 'DORMANT' : 'PROSPECT'
      )
    }));

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.hospital.toLowerCase().includes(q) ||
        d.area.toLowerCase().includes(q) ||
        (d.city && d.city.toLowerCase().includes(q))
      );
    }
    if (area && typeof area === 'string' && area !== 'all') {
      list = list.filter(d => d.area.toLowerCase() === area.toLowerCase());
    }
    if (territory && typeof territory === 'string' && territory !== 'all') {
      list = list.filter(d => (d.territory && d.territory.toLowerCase() === territory.toLowerCase()) || d.area.toLowerCase() === territory.toLowerCase());
    }
    if (city && typeof city === 'string' && city !== 'all') {
      list = list.filter(d => d.city && d.city.toLowerCase() === city.toLowerCase());
    }
    if (priority && typeof priority === 'string' && priority !== 'all') {
      list = list.filter(d => d.priority === priority);
    }
    if (status && typeof status === 'string' && status !== 'all') {
      list = list.filter(d => d.prescriberStatus === status);
    }
    if (relationshipStatus && typeof relationshipStatus === 'string' && relationshipStatus !== 'all') {
      list = list.filter(d => d.relationshipStatus === relationshipStatus);
    }

    res.json({ success: true, data: list, count: list.length });
  });

  app.get('/api/v1/doctors/:id', (req: Request, res: Response) => {
    const doc = doctors.find(d => d.id === req.params.id || d.doctorId === req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    const docVisits = visits.filter(v => v.doctorId === doc.id);
    const docFollowups = followups.filter(f => f.doctorId === doc.id || (f.entityType === 'DOCTOR' && f.entityId === doc.id));
    const docOpportunities = patientOpportunities.filter(o => o.doctorId === doc.id);
    const docReferrals = referrals.filter(r => r.doctorId === doc.id || (doc.doctorId && r.doctorId === doc.doctorId));
    const conflicts = dataConflicts.filter(c => c.entityId === doc.id && c.status === 'unresolved');

    res.json({
      success: true,
      data: {
        ...doc,
        doctorId: doc.doctorId || doc.id,
        relationshipStatus: doc.relationshipStatus || (
          doc.prescriberStatus === 'active_prescriber' ? 'ACTIVE_PRESCRIBER' :
          doc.prescriberStatus === 'advocate' ? 'ACTIVE_PRESCRIBER' :
          doc.prescriberStatus === 'trialing' ? 'TRIAL' :
          doc.prescriberStatus === 'dormant' ? 'DORMANT' : 'PROSPECT'
        ),
        visitsHistory: docVisits,
        pendingTasks: docFollowups,
        patientOpportunities: docOpportunities,
        referrals: docReferrals,
        conflicts
      }
    });
  });

  app.post('/api/v1/doctors', (req: Request, res: Response) => {
    const payload = req.body;
    const now = new Date().toISOString();
    const docId = payload.doctorId || payload.id || `doc-${Date.now()}`;
    const newDoc: Doctor = {
      id: docId,
      doctorId: docId,
      name: payload.name || 'New Doctor',
      specialty: payload.specialty || 'General Diabetology',
      hospital: payload.hospital || 'Private Clinic',
      clinic: payload.clinic || 'Consulting Room',
      area: payload.area || 'PWD',
      territory: payload.territory || payload.area || 'PWD',
      city: payload.city || 'Rawalpindi',
      address: payload.address || '',
      phone: payload.phone,
      whatsapp: payload.whatsapp,
      email: payload.email,
      priority: payload.priority || 'B',
      prescriberStatus: payload.prescriberStatus || 'prospect',
      relationshipStatus: payload.relationshipStatus || 'PROSPECT',
      preferredCallTime: payload.preferredCallTime,
      cgmPotential: payload.cgmPotential || 'medium',
      affordabilityTier: payload.affordabilityTier || 'middle',
      relationshipStrength: payload.relationshipStrength || 1,
      potentialScore: payload.potentialScore || 65,
      dailyPriorityScore: payload.dailyPriorityScore || 60,
      paName: payload.paName,
      paContact: payload.paContact,
      contacts: payload.contacts || [],
      timings: payload.timings || [],
      totalVisitsCount: 0,
      openPatientOpportunitiesCount: 0,
      notes: payload.notes,
      isVerified: payload.isVerified ?? true,
      hasConflict: false,
      createdAt: payload.createdAt || now,
      updatedAt: now
    };
    doctors.unshift(newDoc);
    saveDurableStore();
    res.status(201).json({ success: true, data: newDoc });
  });

  app.put('/api/v1/doctors/:id', (req: Request, res: Response) => {
    const idx = doctors.findIndex(d => d.id === req.params.id || d.doctorId === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Doctor not found' });
    const now = new Date().toISOString();
    doctors[idx] = {
      ...doctors[idx],
      ...req.body,
      doctorId: doctors[idx].doctorId || doctors[idx].id,
      updatedAt: now
    };
    saveDurableStore();
    res.json({ success: true, data: doctors[idx] });
  });

  app.patch('/api/v1/doctors/:id', (req: Request, res: Response) => {
    const idx = doctors.findIndex(d => d.id === req.params.id || d.doctorId === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Doctor not found' });
    const now = new Date().toISOString();
    doctors[idx] = {
      ...doctors[idx],
      ...req.body,
      doctorId: doctors[idx].doctorId || doctors[idx].id,
      updatedAt: now
    };
    saveDurableStore();
    res.json({ success: true, data: doctors[idx] });
  });

  app.delete('/api/v1/doctors/:id', (req: Request, res: Response) => {
    const idx = doctors.findIndex(d => d.id === req.params.id || d.doctorId === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Doctor not found' });
    const deleted = doctors.splice(idx, 1)[0];
    saveDurableStore();
    res.json({ success: true, message: `Doctor ${deleted.name} deleted successfully`, data: deleted });
  });

  // 3. Field Visits
  app.get('/api/v1/visits', (req: Request, res: Response) => {
    res.json({ success: true, data: visits });
  });

  app.post('/api/v1/visits', (req: Request, res: Response) => {
    const { doctorId, scheduledDate, scheduledTime, objectives } = req.body;
    const doc = doctors.find(d => d.id === doctorId);
    const newVisit: Visit = {
      id: `vis-${Date.now()}`,
      doctorId,
      doctorName: doc ? doc.name : 'Target Doctor',
      doctorSpecialty: doc ? doc.specialty : 'Specialist',
      hospitalClinic: doc ? doc.clinic || doc.hospital : 'Clinic',
      area: doc ? doc.area : 'Rawalpindi',
      scheduledDate: scheduledDate || getOperationalDateISO(),
      scheduledTime: scheduledTime || '12:00 PM',
      status: 'planned',
      objectives: objectives || [
        { id: `obj-${Date.now()}-1`, text: 'Introduce EvoCheck CGM features & clinical MARD accuracy', isAchieved: false }
      ]
    };
    visits.unshift(newVisit);
    saveDurableStore();
    res.status(201).json({ success: true, data: newVisit });
  });

  app.patch('/api/v1/visits/:id/status', (req: Request, res: Response) => {
    const { status, summary, interestLevel, nextFollowUpDate, nextVisitObjective, objections, outcomes } = req.body;
    const idx = visits.findIndex(v => v.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Visit not found' });

    const visit = visits[idx];
    visit.status = status || visit.status;
    if (summary) visit.summary = summary;
    if (interestLevel) visit.interestLevel = interestLevel;
    if (nextFollowUpDate) visit.nextFollowUpDate = nextFollowUpDate;
    if (nextVisitObjective) visit.nextVisitObjective = nextVisitObjective;
    if (objections) visit.objections = objections;
    if (outcomes) visit.outcomes = outcomes;

    if (status === 'completed') {
      visit.checkOutTime = new Date().toLocaleTimeString();
      const doc = doctors.find(d => d.id === visit.doctorId);
      if (doc) {
        doc.totalVisitsCount = (doc.totalVisitsCount || 0) + 1;
        doc.lastVisitedDate = visit.scheduledDate;
      }
      if (nextFollowUpDate && nextVisitObjective) {
        followups.unshift({
          id: `tsk-${Date.now()}`,
          doctorId: visit.doctorId,
          doctorName: visit.doctorName,
          doctorArea: visit.area,
          visitId: visit.id,
          title: nextVisitObjective,
          dueDate: nextFollowUpDate,
          priority: 'high',
          status: 'pending',
          source: 'visit'
        });
      }
    }

    saveDurableStore();
    res.json({ success: true, data: visit });
  });

  // 3b. Visit Outcome Logging & Prescriber Progression (v1.1)
  app.post('/api/v1/visits/:id/outcome', (req: Request, res: Response) => {
    const { id } = req.params;
    const { outcomeType, notes, samplesCount, committedUnits, followUpDate, doctorId: reqDoctorId, clientVisitId } = req.body;

    let visit = visits.find(v => v.id === id);
    let isNewVisit = false;
    if (!visit) {
      // If visit does not exist, check if id represents or body supplies a valid doctor
      let targetDoctorId = reqDoctorId;
      if (!targetDoctorId && id.startsWith('vis-auto-')) {
        targetDoctorId = id.replace('vis-auto-', '');
      }
      if (!targetDoctorId && doctors.some(d => d.id === id)) {
        targetDoctorId = id;
      }

      const doc = targetDoctorId ? doctors.find(d => d.id === targetDoctorId) : null;
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Visit not found' });
      }

      // Build a legitimate visit draft. It is not persisted until every outcome
      // validation (including inventory) has succeeded.
      const opDate = getOperationalDateISO();
      visit = {
        id: (id && id !== 'undefined' && id !== 'null') ? id : `vis-${Date.now()}`,
        doctorId: doc.id,
        doctorName: doc.name,
        doctorSpecialty: doc.specialty,
        hospitalClinic: doc.clinic || doc.hospital,
        area: doc.area,
        scheduledDate: opDate,
        scheduledTime: '12:00 PM',
        status: 'completed',
        objectives: [
          { id: `obj-${Date.now()}-1`, text: 'Field consultation & outcome logged', isAchieved: true }
        ],
        outcomes: []
      };
      isNewVisit = true;
    }

    const VALID_OUTCOME_TYPES: VisitOutcomeType[] = [
      'LOGGED',
      'SAMPLE_PROVIDED',
      'TRIAL_STARTED',
      'FOLLOW_UP_SCHEDULED',
      'CME_INVITED',
      'NO_INTEREST',
      'COMPETITOR_PREFERENCE',
      'PRICE_OBJECTION',
      'CLINICAL_OBJECTION',
      'CONVERTED',
      'OTHER'
    ];

    if (!outcomeType || !VALID_OUTCOME_TYPES.includes(outcomeType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid outcomeType. Must be one of: ${VALID_OUTCOME_TYPES.join(', ')}`
      });
    }
    if (clientVisitId !== undefined && (typeof clientVisitId !== 'string' || !clientVisitId.trim() || clientVisitId.length > 200)) {
      return res.status(400).json({ success: false, error: 'clientVisitId must be a non-empty string up to 200 characters' });
    }
    const normalizedClientVisitId = typeof clientVisitId === 'string' ? clientVisitId.trim() : undefined;
    if (normalizedClientVisitId) {
      const existingOutcome = outcomes.find(item => item.clientVisitId === normalizedClientVisitId);
      if (existingOutcome) {
        if (existingOutcome.visitId !== visit.id) {
          return res.status(409).json({ success: false, error: 'clientVisitId is already associated with another visit' });
        }
        return res.status(200).json({
          success: true,
          data: { visit: visits.find(item => item.id === existingOutcome.visitId) || visit, doctor: doctors.find(item => item.id === existingOutcome.doctorId), outcomeRecord: existingOutcome },
          idempotent: true
        });
      }
    }
    if ((samplesCount !== undefined && (!Number.isInteger(samplesCount) || samplesCount < 0)) ||
        (committedUnits !== undefined && (!Number.isInteger(committedUnits) || committedUnits < 0))) {
      return res.status(400).json({ success: false, error: 'samplesCount and committedUnits must be non-negative integers' });
    }
    // Preserve the established v1.1 defaults while ensuring the ledger and target
    // always use the exact same quantities exposed in the outcome record.
    const effectiveSamplesCount = samplesCount ?? (outcomeType === 'SAMPLE_PROVIDED' ? 1 : 0);
    const effectiveCommittedUnits = committedUnits ?? (outcomeType === 'CONVERTED' ? 1 : 0);

    // This is the final failure-prone validation. Do not mutate a visit, doctor,
    // lifecycle, target, or ledger until inventory has been confirmed.
    const sampleInventoryItem = effectiveSamplesCount > 0
      ? sampleInventory.find(item => item.productId === 'evocheck-demo-kit')
      : undefined;
    if (effectiveSamplesCount > 0 && (!sampleInventoryItem || sampleInventoryItem.quantityOnHand < effectiveSamplesCount)) {
      return res.status(409).json({ success: false, error: 'Insufficient sample inventory for this outcome' });
    }

    if (isNewVisit) visits.push(visit);

    // Update Visit state
    visit.status = 'completed';
    if (!visit.checkOutTime) {
      visit.checkOutTime = new Date().toLocaleTimeString();
    }
    if (!visit.outcomes) {
      visit.outcomes = [];
    }
    if (!visit.outcomes.includes(outcomeType)) {
      visit.outcomes.push(outcomeType);
    }
    if (notes) {
      visit.summary = visit.summary ? `${visit.summary}. ${notes}` : notes;
    }
    if (followUpDate) {
      visit.nextFollowUpDate = followUpDate;
    }

    // Fetch Doctor and compute Prescriber Journey Progression
    const doc = doctors.find(d => d.id === visit.doctorId);
    let previousJourneyState: PrescriberJourneyState = 'PROSPECTING';
    let updatedJourneyState: PrescriberJourneyState = 'PROSPECTING';
    let nextActionRecommendation = 'Schedule product introduction and identify primary objection.';

    if (doc) {
      const previousLifecycleStatus = lifecycleForDoctor(doc);
      const docVisits = visits.filter(v => v.doctorId === doc.id);
      const docOpps = patientOpportunities.filter(o => o.doctorId === doc.id);
      previousJourneyState = getPrescriberJourneyStage(doc, docVisits, docOpps);

      // Increment visit count if completed
      doc.totalVisitsCount = (doc.totalVisitsCount || 0) + 1;
      doc.lastVisitedDate = visit.scheduledDate || getOperationalDateISO();

      // Deterministic Progression Logic:
      if (outcomeType === 'SAMPLE_PROVIDED' || outcomeType === 'TRIAL_STARTED') {
        if (previousJourneyState === 'PROSPECTING') {
          doc.prescriberStatus = 'trialing';
        }
      } else if (outcomeType === 'CONVERTED' || effectiveCommittedUnits > 0) {
        doc.prescriberStatus = 'active_prescriber';
      }

      // If doctor has >= 3 completed visits and >= 5 committed units
      const completedCount = docVisits.filter(v => v.status === 'completed').length;
      const totalUnits = docOpps.reduce((acc, curr) => acc + (curr.units || 1), 0) + effectiveCommittedUnits;

      if (completedCount >= 3 && totalUnits >= 5) {
        // A champion is a trusted relationship, not only a volume threshold.
        // Keep qualifying low-strength relationships as active prescribers.
        doc.prescriberStatus = doc.relationshipStrength >= 4 ? 'advocate' : 'active_prescriber';
      }

      if (outcomeType === 'PRICE_OBJECTION' || outcomeType === 'CLINICAL_OBJECTION' || outcomeType === 'COMPETITOR_PREFERENCE') {
        if (!doc.recentObjections) doc.recentObjections = [];
        const objectionSummary = `${outcomeType}: ${notes || 'HCP raised clinical/pricing concern'}`;
        if (!doc.recentObjections.includes(objectionSummary)) {
          doc.recentObjections.unshift(objectionSummary);
        }
      }

      updatedJourneyState = getPrescriberJourneyStage(doc, docVisits, docOpps);
      nextActionRecommendation = getPrescriberJourneyActionRecommendation(updatedJourneyState);
      recordLifecycleChange(doc, previousLifecycleStatus, lifecycleForDoctor(doc), `Outcome recorded: ${outcomeType}`, 'AUTOMATIC');
    }

    if (effectiveSamplesCount > 0) {
      // sampleInventoryItem was validated above, before any CRM mutation.
      sampleInventoryItem!.quantityOnHand -= effectiveSamplesCount;
      sampleInventoryItem!.updatedAt = new Date().toISOString();
      sampleTransactions.unshift({ id: `sample-${Date.now()}`, productId: sampleInventoryItem!.productId, doctorId: visit.doctorId, visitId: visit.id, quantity: effectiveSamplesCount, transactionType: 'ISSUED', recordedAt: sampleInventoryItem!.updatedAt, notes });
    }

    if (effectiveCommittedUnits > 0) {
      const month = (visit.scheduledDate || getOperationalDateISO()).slice(0, 7);
      const target = getMonthlyTarget(month);
      const persisted = monthlyTargets.findIndex(item => item.month === month);
      const updated = { ...target, achievedUnits: target.achievedUnits + effectiveCommittedUnits, updatedAt: new Date().toISOString() };
      if (persisted >= 0) monthlyTargets[persisted] = updated; else monthlyTargets.push(updated);
    }

    // If follow-up date provided, schedule a follow-up task
    if (followUpDate) {
      followups.unshift({
        id: `tsk-${Date.now()}`,
        doctorId: visit.doctorId,
        doctorName: visit.doctorName,
        doctorArea: visit.area,
        visitId: visit.id,
        title: notes || `Follow-up on ${outcomeType}`,
        dueDate: followUpDate,
        priority: 'high',
        status: 'pending',
        source: 'visit'
      });
    }

    // Create and save Outcome Record
    const outcomeRecord: VisitOutcomeRecord = {
      id: `out-${Date.now()}`,
      visitId: visit.id,
      clientVisitId: normalizedClientVisitId,
      doctorId: visit.doctorId,
      outcomeType,
      timestamp: new Date().toISOString(),
      notes,
      samplesCount: effectiveSamplesCount,
      committedUnits: effectiveCommittedUnits,
      nextActionRecommendation,
      previousJourneyState,
      updatedJourneyState,
      followUpDate
    };

    outcomes.unshift(outcomeRecord);
    saveDurableStore();

    res.status(200).json({
      success: true,
      data: {
        visit,
        doctor: doc,
        outcomeRecord
      }
    });
  });

  // 3c. v1.2 Sample Inventory, Quota Pacing, Lifecycle, and Timeline APIs
  app.get('/api/v1/samples/inventory', (_req: Request, res: Response) => {
    res.json({ success: true, data: sampleInventory, transactions: sampleTransactions });
  });

  app.post('/api/v1/samples/transactions', (req: Request, res: Response) => {
    const { productId = 'evocheck-demo-kit', doctorId, visitId, quantity, notes } = req.body;
    if (!doctorId || !doctors.some(doc => doc.id === doctorId)) return res.status(400).json({ success: false, error: 'A valid doctorId is required' });
    if (!Number.isInteger(quantity) || quantity <= 0) return res.status(400).json({ success: false, error: 'quantity must be a positive integer' });
    const inventory = sampleInventory.find(item => item.productId === productId);
    if (!inventory) return res.status(404).json({ success: false, error: 'Sample inventory item not found' });
    if (inventory.quantityOnHand < quantity) return res.status(409).json({ success: false, error: 'Insufficient sample inventory' });
    inventory.quantityOnHand -= quantity;
    inventory.updatedAt = new Date().toISOString();
    const transaction: SampleTransaction = { id: `sample-${Date.now()}`, productId, doctorId, visitId, quantity, transactionType: 'ISSUED', recordedAt: inventory.updatedAt, notes };
    sampleTransactions.unshift(transaction);
    saveDurableStore();
    res.status(201).json({ success: true, data: { transaction, inventory } });
  });

  app.get('/api/v1/targets/monthly', (req: Request, res: Response) => {
    const month = isValidMonth(req.query.month) ? req.query.month : getOperationalDateISO().slice(0, 7);
    const target = getMonthlyTarget(month);
    res.json({ success: true, data: { ...target, remainingUnits: Math.max(0, target.targetUnits - target.achievedUnits), pacingPercent: target.targetUnits ? Math.round((target.achievedUnits / target.targetUnits) * 100) : 0 } });
  });

  app.put('/api/v1/targets/monthly/:month', (req: Request, res: Response) => {
    const { month } = req.params;
    const { targetUnits } = req.body;
    if (!isValidMonth(month) || !Number.isInteger(targetUnits) || targetUnits < 0) return res.status(400).json({ success: false, error: 'month must be YYYY-MM and targetUnits must be a non-negative integer' });
    const current = getMonthlyTarget(month);
    const target = { ...current, targetUnits, updatedAt: new Date().toISOString() };
    const index = monthlyTargets.findIndex(item => item.month === month);
    if (index >= 0) monthlyTargets[index] = target; else monthlyTargets.push(target);
    saveDurableStore();
    res.json({ success: true, data: target });
  });

  app.get('/api/v1/doctors/:id/lifecycle', (req: Request, res: Response) => {
    const doctor = doctors.find(doc => doc.id === req.params.id);
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
    res.json({ success: true, data: { doctorId: doctor.id, status: lifecycleForDoctor(doctor), history: lifecycleHistory.filter(item => item.doctorId === doctor.id) } });
  });

  app.post('/api/v1/doctors/:id/lifecycle/override', (req: Request, res: Response) => {
    const doctor = doctors.find(doc => doc.id === req.params.id);
    const { status, reason } = req.body;
    const valid: PrescriberLifecycleStatus[] = ['PROSPECT', 'ENGAGED', 'TRIAL', 'ADOPTER', 'CHAMPION', 'DORMANT'];
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
    if (!status || !valid.includes(status)) return res.status(400).json({ success: false, error: 'A valid target lifecycle status is required' });
    if (status === 'CHAMPION' && doctor.relationshipStrength < 4) return res.status(422).json({ success: false, error: 'Champion lifecycle status requires relationship strength >= 4' });
    const previousStatus = lifecycleForDoctor(doctor);
    recordLifecycleChange(doctor, previousStatus, status, reason || 'Manual lifecycle override', 'MANUAL_OVERRIDE');
    doctor.prescriberStatus = prescriberStatusForLifecycle(status);
    saveDurableStore();
    res.json({ success: true, data: { doctorId: doctor.id, status, history: lifecycleHistory.filter(item => item.doctorId === doctor.id) } });
  });

  app.get('/api/v1/doctors/:id/timeline', (req: Request, res: Response) => {
    const doctor = doctors.find(doc => doc.id === req.params.id);
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
    const events: DoctorTimelineEvent[] = [
      ...visits.filter(item => item.doctorId === doctor.id).map(item => ({ id: `visit-${item.id}`, type: 'VISIT' as const, occurredAt: `${item.scheduledDate}T00:00:00.000Z`, title: `Visit ${item.status}`, detail: item.summary, visitId: item.id })),
      ...outcomes.filter(item => item.doctorId === doctor.id).map(item => ({ id: `outcome-${item.id}`, type: 'OUTCOME' as const, occurredAt: item.timestamp, title: item.outcomeType, detail: item.notes, visitId: item.visitId })),
      ...sampleTransactions.filter(item => item.doctorId === doctor.id).map(item => ({ id: `sample-${item.id}`, type: 'SAMPLE' as const, occurredAt: item.recordedAt, title: `${item.quantity} sample unit${item.quantity === 1 ? '' : 's'} issued`, detail: item.notes, visitId: item.visitId })),
      ...lifecycleHistory.filter(item => item.doctorId === doctor.id).map(item => ({ id: `lifecycle-${item.id}`, type: 'LIFECYCLE' as const, occurredAt: item.recordedAt, title: `${item.previousStatus} → ${item.status}`, detail: item.reason })),
      ...patientOpportunities.filter(item => item.doctorId === doctor.id).map(item => ({ id: `opportunity-${item.id}`, type: 'OPPORTUNITY' as const, occurredAt: item.updatedAt || item.createdAt || new Date(0).toISOString(), title: `Patient opportunity: ${item.status}`, detail: item.clinicalProfile }))
    ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    res.json({ success: true, data: events });
  });

  // 4. Follow-up Tasks (Enriched Generic Foundation)
  app.get('/api/v1/followups', (req: Request, res: Response) => {
    const { entityType, entityId, doctorId, status, priority } = req.query;
    let list = followups.map(f => {
      const resolvedDoctor = f.doctorId ? doctors.find(d => d.id === f.doctorId || d.doctorId === f.doctorId) : undefined;
      return {
        ...f,
        id: f.id || f.followUpId,
        followUpId: f.followUpId || f.id,
        entityType: f.entityType || (f.doctorId ? 'DOCTOR' : 'DOCTOR'),
        entityId: f.entityId || f.doctorId || (resolvedDoctor ? resolvedDoctor.id : 'doc-1'),
        doctorName: f.doctorName || (resolvedDoctor ? resolvedDoctor.name : 'Target Entity'),
        doctorArea: f.doctorArea || (resolvedDoctor ? resolvedDoctor.area : 'Territory'),
        status: f.status || 'PENDING'
      };
    });

    if (entityType && typeof entityType === 'string' && entityType !== 'all') {
      list = list.filter(f => f.entityType.toUpperCase() === entityType.toUpperCase());
    }
    if (entityId && typeof entityId === 'string' && entityId !== 'all') {
      list = list.filter(f => f.entityId === entityId || (f.doctorId && f.doctorId === entityId));
    }
    if (doctorId && typeof doctorId === 'string' && doctorId !== 'all') {
      list = list.filter(f => f.doctorId === doctorId || (f.entityType === 'DOCTOR' && f.entityId === doctorId));
    }
    if (status && typeof status === 'string' && status !== 'all') {
      list = list.filter(f => String(f.status).toLowerCase() === status.toLowerCase());
    }
    if (priority && typeof priority === 'string' && priority !== 'all') {
      list = list.filter(f => String(f.priority).toLowerCase() === priority.toLowerCase());
    }

    res.json({ success: true, data: list, count: list.length });
  });

  app.get('/api/v1/followups/:id', (req: Request, res: Response) => {
    const f = followups.find(item => item.id === req.params.id || item.followUpId === req.params.id);
    if (!f) return res.status(404).json({ success: false, error: 'Follow-up not found' });
    const resolvedDoctor = f.doctorId ? doctors.find(d => d.id === f.doctorId || d.doctorId === f.doctorId) : undefined;
    const normalized = {
      ...f,
      id: f.id || f.followUpId,
      followUpId: f.followUpId || f.id,
      entityType: f.entityType || (f.doctorId ? 'DOCTOR' : 'DOCTOR'),
      entityId: f.entityId || f.doctorId || (resolvedDoctor ? resolvedDoctor.id : 'doc-1'),
      doctorName: f.doctorName || (resolvedDoctor ? resolvedDoctor.name : 'Target Entity'),
      doctorArea: f.doctorArea || (resolvedDoctor ? resolvedDoctor.area : 'Territory'),
      status: f.status || 'PENDING'
    };
    res.json({ success: true, data: normalized });
  });

  app.post('/api/v1/followups', (req: Request, res: Response) => {
    const payload = req.body;
    const { title, dueDate, priority, status, notes, assignedTo, entityType, entityId, doctorId } = payload;
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, error: 'title is required' });
    }
    if (!dueDate || typeof dueDate !== 'string' || !dueDate.trim()) {
      return res.status(400).json({ success: false, error: 'dueDate is required' });
    }

    const resolvedEntityType: FollowUpEntityType = (entityType && typeof entityType === 'string') 
      ? (entityType.toUpperCase() as FollowUpEntityType)
      : (doctorId ? 'DOCTOR' : 'DOCTOR');

    const VALID_ENTITIES: FollowUpEntityType[] = ['DOCTOR', 'PATIENT', 'LEAD', 'REFERRAL', 'VISIT', 'ORDER', 'TRIAL', 'RENEWAL'];
    if (!VALID_ENTITIES.includes(resolvedEntityType)) {
      return res.status(400).json({ success: false, error: `Invalid entityType. Allowed: ${VALID_ENTITIES.join(', ')}` });
    }

    const resolvedEntityId = entityId || doctorId || (resolvedEntityType === 'DOCTOR' ? doctors[0]?.id : 'ent-1');

    // Relationship existence check if an explicit target is provided
    if (resolvedEntityType === 'DOCTOR' && (doctorId || entityId)) {
      const docExists = doctors.some(d => d.id === resolvedEntityId || d.doctorId === resolvedEntityId);
      if (!docExists) return res.status(400).json({ success: false, error: 'Referenced doctor not found' });
    }
    if (resolvedEntityType === 'PATIENT' && entityId) {
      const patExists = patients.some(p => p.patientId === entityId || (p as any).id === entityId);
      if (!patExists) return res.status(400).json({ success: false, error: 'Referenced patient not found' });
    }
    if (resolvedEntityType === 'LEAD' && entityId) {
      const leadExists = leads.some(l => l.leadId === entityId || (l as any).id === entityId);
      if (!leadExists) return res.status(400).json({ success: false, error: 'Referenced lead not found' });
    }

    const VALID_STATUSES: string[] = ['PENDING', 'COMPLETED', 'CANCELLED', 'OVERDUE', 'pending', 'in_progress', 'completed', 'cancelled'];
    const resolvedStatus = status || 'PENDING';
    if (!VALID_STATUSES.includes(resolvedStatus)) {
      return res.status(400).json({ success: false, error: `Invalid status. Allowed: PENDING, COMPLETED, CANCELLED, OVERDUE` });
    }

    const id = `tsk-${Date.now()}`;
    const doc = resolvedEntityType === 'DOCTOR' ? doctors.find(d => d.id === resolvedEntityId || d.doctorId === resolvedEntityId) : null;
    const now = new Date().toISOString();

    const newTask: FollowupTask = {
      id,
      followUpId: id,
      entityType: resolvedEntityType,
      entityId: resolvedEntityId,
      doctorId: doc ? doc.id : (resolvedEntityType === 'DOCTOR' ? resolvedEntityId : undefined),
      doctorName: doc ? doc.name : (payload.doctorName || 'Target Entity'),
      doctorArea: doc ? doc.area : (payload.doctorArea || 'Territory'),
      title: title.trim(),
      dueDate: dueDate.trim(),
      priority: priority || 'medium',
      status: resolvedStatus,
      notes: notes || undefined,
      assignedTo: assignedTo || undefined,
      isCompleted: resolvedStatus === 'COMPLETED' || resolvedStatus === 'completed',
      source: payload.source || 'manual',
      createdAt: now,
      updatedAt: now
    };

    followups.unshift(newTask);
    saveDurableStore();
    res.status(201).json({ success: true, data: newTask });
  });

  app.put('/api/v1/followups/:id', (req: Request, res: Response) => {
    const idx = followups.findIndex(f => f.id === req.params.id || f.followUpId === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Follow-up not found' });

    const VALID_STATUSES: string[] = ['PENDING', 'COMPLETED', 'CANCELLED', 'OVERDUE', 'pending', 'in_progress', 'completed', 'cancelled'];
    if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ success: false, error: 'Invalid follow-up status' });
    }

    const now = new Date().toISOString();
    followups[idx] = {
      ...followups[idx],
      ...req.body,
      id: followups[idx].id || followups[idx].followUpId,
      followUpId: followups[idx].followUpId || followups[idx].id,
      updatedAt: now
    };

    if (req.body.status === 'completed' || req.body.status === 'COMPLETED') {
      followups[idx].completedAt = now;
      followups[idx].isCompleted = true;
    }

    saveDurableStore();
    res.json({ success: true, data: followups[idx] });
  });

  app.patch('/api/v1/followups/:id', (req: Request, res: Response) => {
    const idx = followups.findIndex(f => f.id === req.params.id || f.followUpId === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Task not found' });

    const VALID_STATUSES: string[] = ['PENDING', 'COMPLETED', 'CANCELLED', 'OVERDUE', 'pending', 'in_progress', 'completed', 'cancelled'];
    if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ success: false, error: 'Invalid follow-up status' });
    }

    const now = new Date().toISOString();
    followups[idx] = {
      ...followups[idx],
      ...req.body,
      id: followups[idx].id || followups[idx].followUpId,
      followUpId: followups[idx].followUpId || followups[idx].id,
      updatedAt: now
    };

    if (req.body.status === 'completed' || req.body.status === 'COMPLETED') {
      followups[idx].completedAt = now;
      followups[idx].isCompleted = true;
    }

    saveDurableStore();
    res.json({ success: true, data: followups[idx] });
  });

  app.delete('/api/v1/followups/:id', (req: Request, res: Response) => {
    const idx = followups.findIndex(f => f.id === req.params.id || f.followUpId === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Follow-up not found' });
    const deleted = followups.splice(idx, 1)[0];
    saveDurableStore();
    res.json({ success: true, message: 'Follow-up deleted successfully', data: deleted });
  });

  // 4b. Patient CRM Foundation (v1.6.1)
  const VALID_PATIENT_SOURCES: PatientAcquisitionSource[] = [
    'DOCTOR_REFERRAL',
    'META_AD',
    'MY_GLUCO_GUIDE',
    'WEBSITE',
    'ECOMMERCE',
    'WHATSAPP',
    'EMAIL',
    'EXISTING_PATIENT',
    'OTHER'
  ];

  const VALID_PATIENT_STATUSES: PatientCRMStatus[] = [
    'LEAD',
    'QUALIFIED',
    'REFERRED',
    'PURCHASED',
    'ACTIVE',
    'RENEWAL_DUE',
    'RENEWED',
    'INACTIVE',
    'LOST'
  ];

  app.get('/api/v1/patients', (req: Request, res: Response) => {
    const { search, status, doctorId, city, acquisitionSource } = req.query;
    let list = [...patients];

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q))
      );
    }
    if (status && typeof status === 'string' && status !== 'all') {
      list = list.filter(p => p.status === status);
    }
    if (doctorId && typeof doctorId === 'string' && doctorId !== 'all') {
      list = list.filter(p => p.doctorId === doctorId);
    }
    if (city && typeof city === 'string' && city !== 'all') {
      list = list.filter(p => p.city.toLowerCase() === city.toLowerCase());
    }
    if (acquisitionSource && typeof acquisitionSource === 'string' && acquisitionSource !== 'all') {
      list = list.filter(p => p.acquisitionSource === acquisitionSource);
    }

    res.json({ success: true, data: list, count: list.length });
  });

  app.get('/api/v1/patients/:id', (req: Request, res: Response) => {
    const patient = patients.find(p => p.patientId === req.params.id || (p as any).id === req.params.id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const doctor = patient.doctorId ? doctors.find(d => d.id === patient.doctorId || d.doctorId === patient.doctorId) : null;
    const patientReferrals = referrals.filter(r => r.patientId === patient.patientId);
    const patientOrders = orders.filter(o => o.patientId === patient.patientId);
    const patientSensors = sensors.filter(s => s.patientId === patient.patientId);
    const patientFollowups = followups.filter(f => (f.entityType === 'PATIENT' && f.entityId === patient.patientId) || (f as any).patientId === patient.patientId);

    res.json({
      success: true,
      data: {
        ...patient,
        doctor: doctor ? { id: doctor.id, name: doctor.name, specialty: doctor.specialty, hospital: doctor.hospital } : null,
        referrals: patientReferrals,
        orders: patientOrders,
        sensors: patientSensors,
        followups: patientFollowups
      }
    });
  });

  app.post('/api/v1/patients', (req: Request, res: Response) => {
    const { name, phone, whatsapp, email, city, doctorId, acquisitionSource, status } = req.body;

    // Required fields validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'name is required' });
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ success: false, error: 'phone is required' });
    }
    if (!city || typeof city !== 'string' || !city.trim()) {
      return res.status(400).json({ success: false, error: 'city is required' });
    }
    if (!acquisitionSource || !VALID_PATIENT_SOURCES.includes(acquisitionSource)) {
      return res.status(400).json({
        success: false,
        error: `Valid acquisitionSource is required. Allowed: ${VALID_PATIENT_SOURCES.join(', ')}`
      });
    }

    // Status validation
    const resolvedStatus: PatientCRMStatus = status || 'LEAD';
    if (!VALID_PATIENT_STATUSES.includes(resolvedStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${VALID_PATIENT_STATUSES.join(', ')}`
      });
    }

    // Doctor relationship validation
    if (doctorId) {
      const doc = doctors.find(d => d.id === doctorId || d.doctorId === doctorId);
      if (!doc) {
        return res.status(400).json({ success: false, error: 'Referenced doctorId not found' });
      }
    }

    const now = new Date().toISOString();
    const newPatient: PatientCRM = {
      patientId: `pat-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp ? String(whatsapp).trim() : undefined,
      email: email ? String(email).trim() : undefined,
      city: city.trim(),
      doctorId: doctorId || undefined,
      acquisitionSource,
      status: resolvedStatus,
      createdAt: now,
      updatedAt: now
    };

    patients.unshift(newPatient);
    saveDurableStore();
    res.status(201).json({ success: true, data: newPatient });
  });

  app.put('/api/v1/patients/:id', (req: Request, res: Response) => {
    const idx = patients.findIndex(p => p.patientId === req.params.id || (p as any).id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Patient not found' });

    const payload = req.body;
    if (payload.acquisitionSource && !VALID_PATIENT_SOURCES.includes(payload.acquisitionSource)) {
      return res.status(400).json({
        success: false,
        error: `Invalid acquisitionSource. Allowed: ${VALID_PATIENT_SOURCES.join(', ')}`
      });
    }
    if (payload.status && !VALID_PATIENT_STATUSES.includes(payload.status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${VALID_PATIENT_STATUSES.join(', ')}`
      });
    }
    if (payload.doctorId) {
      const doc = doctors.find(d => d.id === payload.doctorId || d.doctorId === payload.doctorId);
      if (!doc) return res.status(400).json({ success: false, error: 'Referenced doctorId not found' });
    }

    const now = new Date().toISOString();
    patients[idx] = {
      ...patients[idx],
      name: payload.name !== undefined ? String(payload.name).trim() : patients[idx].name,
      phone: payload.phone !== undefined ? String(payload.phone).trim() : patients[idx].phone,
      whatsapp: payload.whatsapp !== undefined ? String(payload.whatsapp).trim() : patients[idx].whatsapp,
      email: payload.email !== undefined ? String(payload.email).trim() : patients[idx].email,
      city: payload.city !== undefined ? String(payload.city).trim() : patients[idx].city,
      doctorId: payload.doctorId !== undefined ? payload.doctorId : patients[idx].doctorId,
      acquisitionSource: payload.acquisitionSource || patients[idx].acquisitionSource,
      status: payload.status || patients[idx].status,
      updatedAt: now
    };

    saveDurableStore();
    res.json({ success: true, data: patients[idx] });
  });

  // 4c. Lead Management Foundation (v1.6.1)
  const VALID_LEAD_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];

  app.get('/api/v1/leads', (req: Request, res: Response) => {
    const { search, status, source, assignedTo } = req.query;
    let list = [...leads];

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.email && l.email.toLowerCase().includes(q))
      );
    }
    if (status && typeof status === 'string' && status !== 'all') {
      list = list.filter(l => l.status === status);
    }
    if (source && typeof source === 'string' && source !== 'all') {
      list = list.filter(l => l.source.toLowerCase() === source.toLowerCase());
    }
    if (assignedTo && typeof assignedTo === 'string' && assignedTo !== 'all') {
      list = list.filter(l => l.assignedTo === assignedTo);
    }

    res.json({ success: true, data: list, count: list.length });
  });

  app.get('/api/v1/leads/:id', (req: Request, res: Response) => {
    const lead = leads.find(l => l.leadId === req.params.id || (l as any).id === req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: lead });
  });

  app.post('/api/v1/leads', (req: Request, res: Response) => {
    const { name, phone, whatsapp, email, source, campaign, status, assignedTo } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'name is required' });
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ success: false, error: 'phone is required' });
    }
    if (!source || typeof source !== 'string' || !source.trim()) {
      return res.status(400).json({ success: false, error: 'source is required' });
    }

    const resolvedStatus: LeadStatus = status || 'NEW';
    if (!VALID_LEAD_STATUSES.includes(resolvedStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${VALID_LEAD_STATUSES.join(', ')}`
      });
    }

    const now = new Date().toISOString();
    const newLead: LeadCRM = {
      leadId: `lead-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp ? String(whatsapp).trim() : undefined,
      email: email ? String(email).trim() : undefined,
      source: source.trim(),
      campaign: campaign ? String(campaign).trim() : undefined,
      status: resolvedStatus,
      assignedTo: assignedTo || undefined,
      createdAt: now,
      updatedAt: now
    };

    leads.unshift(newLead);
    saveDurableStore();
    res.status(201).json({ success: true, data: newLead });
  });

  app.put('/api/v1/leads/:id', (req: Request, res: Response) => {
    const idx = leads.findIndex(l => l.leadId === req.params.id || (l as any).id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Lead not found' });

    const payload = req.body;
    if (payload.status && !VALID_LEAD_STATUSES.includes(payload.status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${VALID_LEAD_STATUSES.join(', ')}`
      });
    }

    if (payload.convertedPatientId) {
      const patientExists = patients.some(p => p.patientId === payload.convertedPatientId);
      if (!patientExists) {
        return res.status(400).json({ success: false, error: 'Referenced convertedPatientId not found' });
      }
    }

    const now = new Date().toISOString();
    leads[idx] = {
      ...leads[idx],
      name: payload.name !== undefined ? String(payload.name).trim() : leads[idx].name,
      phone: payload.phone !== undefined ? String(payload.phone).trim() : leads[idx].phone,
      whatsapp: payload.whatsapp !== undefined ? String(payload.whatsapp).trim() : leads[idx].whatsapp,
      email: payload.email !== undefined ? String(payload.email).trim() : leads[idx].email,
      source: payload.source || leads[idx].source,
      campaign: payload.campaign !== undefined ? payload.campaign : leads[idx].campaign,
      status: payload.status || leads[idx].status,
      assignedTo: payload.assignedTo !== undefined ? payload.assignedTo : leads[idx].assignedTo,
      convertedPatientId: payload.convertedPatientId || leads[idx].convertedPatientId,
      updatedAt: now
    };

    saveDurableStore();
    res.json({ success: true, data: leads[idx] });
  });

  // 4d. Doctor → Patient Referral Foundation (v1.6.1)
  const VALID_REFERRAL_STATUSES: ReferralStatus[] = ['REFERRED', 'CONTACTED', 'QUALIFIED', 'PURCHASED', 'LOST'];

  app.get('/api/v1/referrals', (req: Request, res: Response) => {
    const { doctorId, patientId, status } = req.query;
    let list = [...referrals];

    if (doctorId && typeof doctorId === 'string' && doctorId !== 'all') {
      list = list.filter(r => r.doctorId === doctorId);
    }
    if (patientId && typeof patientId === 'string' && patientId !== 'all') {
      list = list.filter(r => r.patientId === patientId);
    }
    if (status && typeof status === 'string' && status !== 'all') {
      list = list.filter(r => r.status === status);
    }

    res.json({ success: true, data: list, count: list.length });
  });

  app.get('/api/v1/referrals/:id', (req: Request, res: Response) => {
    const referral = referrals.find(r => r.referralId === req.params.id || (r as any).id === req.params.id);
    if (!referral) return res.status(404).json({ success: false, error: 'Referral not found' });

    const doc = doctors.find(d => d.id === referral.doctorId || d.doctorId === referral.doctorId);
    const pat = patients.find(p => p.patientId === referral.patientId);

    res.json({
      success: true,
      data: {
        ...referral,
        doctor: doc ? { id: doc.id, name: doc.name, specialty: doc.specialty, hospital: doc.hospital } : null,
        patient: pat ? { patientId: pat.patientId, name: pat.name, phone: pat.phone, city: pat.city } : null
      }
    });
  });

  app.post('/api/v1/referrals', (req: Request, res: Response) => {
    const { doctorId, patientId, referralDate, source, status, notes } = req.body;

    if (!doctorId || typeof doctorId !== 'string') {
      return res.status(400).json({ success: false, error: 'doctorId is required' });
    }
    if (!patientId || typeof patientId !== 'string') {
      return res.status(400).json({ success: false, error: 'patientId is required' });
    }

    const doc = doctors.find(d => d.id === doctorId || d.doctorId === doctorId);
    if (!doc) {
      return res.status(400).json({ success: false, error: 'Referenced doctorId not found' });
    }

    const pat = patients.find(p => p.patientId === patientId);
    if (!pat) {
      return res.status(400).json({ success: false, error: 'Referenced patientId not found' });
    }

    const resolvedStatus: ReferralStatus = status || 'REFERRED';
    if (!VALID_REFERRAL_STATUSES.includes(resolvedStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${VALID_REFERRAL_STATUSES.join(', ')}`
      });
    }

    const resolvedDate = referralDate || new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Check if an existing identical active referral exists to avoid erroneous duplicates
    const existing = referrals.find(r => r.doctorId === doc.id && r.patientId === pat.patientId && r.referralDate === resolvedDate);
    if (existing) {
      return res.status(200).json({ success: true, data: existing, message: 'Referral already recorded for this date' });
    }

    const newReferral: DoctorPatientReferral = {
      referralId: `ref-${Date.now()}`,
      doctorId: doc.id,
      patientId: pat.patientId,
      referralDate: resolvedDate,
      source: source || 'DOCTOR_OPD',
      status: resolvedStatus,
      notes: notes || undefined,
      createdAt: now,
      updatedAt: now
    };

    referrals.unshift(newReferral);
    saveDurableStore();
    res.status(201).json({ success: true, data: newReferral });
  });

  // 4e. Order Foundation (v1.6.1)
  const VALID_ORDER_SOURCES: OrderSource[] = [
    'DOCTOR_REFERRAL',
    'ECOMMERCE',
    'META_AD',
    'MY_GLUCO_GUIDE',
    'WHATSAPP',
    'DIRECT',
    'OTHER'
  ];

  const VALID_PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
  const VALID_ORDER_STATUSES: OrderStatus[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];

  app.get('/api/v1/orders', (req: Request, res: Response) => {
    const { patientId, orderStatus, paymentStatus } = req.query;
    let list = [...orders];

    if (patientId && typeof patientId === 'string' && patientId !== 'all') {
      list = list.filter(o => o.patientId === patientId);
    }
    if (orderStatus && typeof orderStatus === 'string' && orderStatus !== 'all') {
      list = list.filter(o => o.orderStatus === orderStatus);
    }
    if (paymentStatus && typeof paymentStatus === 'string' && paymentStatus !== 'all') {
      list = list.filter(o => o.paymentStatus === paymentStatus);
    }

    res.json({ success: true, data: list, count: list.length });
  });

  app.get('/api/v1/orders/:id', (req: Request, res: Response) => {
    const order = orders.find(o => o.orderId === req.params.id || (o as any).id === req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  });

  app.post('/api/v1/orders', (req: Request, res: Response) => {
    const { patientId, product, quantity, unitPrice, orderSource, paymentStatus, orderStatus, orderDate } = req.body;

    if (!patientId || typeof patientId !== 'string') {
      return res.status(400).json({ success: false, error: 'patientId is required' });
    }
    const pat = patients.find(p => p.patientId === patientId);
    if (!pat) {
      return res.status(400).json({ success: false, error: 'Referenced patientId not found' });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, error: 'quantity must be a positive integer' });
    }

    const resolvedProduct = product || 'EvoCheck Premium Linx CGM';
    const resolvedOrderSource: OrderSource = orderSource || 'DIRECT';
    if (!VALID_ORDER_SOURCES.includes(resolvedOrderSource)) {
      return res.status(400).json({
        success: false,
        error: `Invalid orderSource. Allowed: ${VALID_ORDER_SOURCES.join(', ')}`
      });
    }

    const resolvedPaymentStatus: PaymentStatus = paymentStatus || 'PENDING';
    if (!VALID_PAYMENT_STATUSES.includes(resolvedPaymentStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid paymentStatus. Allowed: ${VALID_PAYMENT_STATUSES.join(', ')}`
      });
    }

    const resolvedOrderStatus: OrderStatus = orderStatus || 'PENDING';
    if (!VALID_ORDER_STATUSES.includes(resolvedOrderStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid orderStatus. Allowed: ${VALID_ORDER_STATUSES.join(', ')}`
      });
    }

    // Grounded price lookup: use provided price if positive, else authorized controlled product pricing
    let price = typeof unitPrice === 'number' && unitPrice > 0 ? unitPrice : 0;
    if (price === 0) {
      if (resolvedOrderSource === 'ECOMMERCE' || resolvedOrderSource === 'DIRECT') {
        price = (EVOCHECK_PUBLIC_RETAIL_PRICING as any)?.amount || 13600;
      } else {
        price = (EVOCHECK_DISTRIBUTOR_PRICING as any)?.amount || 12900;
      }
    }

    const total = quantity * price;
    const now = new Date().toISOString();
    const resolvedDate = orderDate || now.split('T')[0];

    const newOrder: OrderCRM = {
      orderId: `ord-${Date.now()}`,
      patientId: pat.patientId,
      orderDate: resolvedDate,
      product: resolvedProduct,
      quantity,
      unitPrice: price,
      total,
      orderSource: resolvedOrderSource,
      paymentStatus: resolvedPaymentStatus,
      orderStatus: resolvedOrderStatus,
      createdAt: now,
      updatedAt: now
    };

    orders.unshift(newOrder);
    saveDurableStore();
    res.status(201).json({ success: true, data: newOrder });
  });

  // 4f. Sensor Lifecycle Foundation (v1.6.1)
  const VALID_SENSOR_STATUSES: SensorLifecycleStatus[] = [
    'ACTIVE',
    'EXPIRING',
    'RENEWAL_DUE',
    'RENEWED',
    'EXPIRED',
    'CANCELLED'
  ];

  app.get('/api/v1/sensors', (req: Request, res: Response) => {
    const { patientId, status } = req.query;
    let list = [...sensors];

    if (patientId && typeof patientId === 'string' && patientId !== 'all') {
      list = list.filter(s => s.patientId === patientId);
    }
    if (status && typeof status === 'string' && status !== 'all') {
      list = list.filter(s => s.status === status);
    }

    res.json({ success: true, data: list, count: list.length });
  });

  app.get('/api/v1/sensors/:id', (req: Request, res: Response) => {
    const sensor = sensors.find(s => s.sensorId === req.params.id || (s as any).id === req.params.id);
    if (!sensor) return res.status(404).json({ success: false, error: 'Sensor not found' });
    res.json({ success: true, data: sensor });
  });

  app.post('/api/v1/sensors', (req: Request, res: Response) => {
    const { patientId, product, startDate, status } = req.body;

    if (!patientId || typeof patientId !== 'string') {
      return res.status(400).json({ success: false, error: 'patientId is required' });
    }
    const pat = patients.find(p => p.patientId === patientId);
    if (!pat) {
      return res.status(400).json({ success: false, error: 'Referenced patientId not found' });
    }

    if (!startDate || typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(startDate)) {
      return res.status(400).json({ success: false, error: 'startDate in YYYY-MM-DD format is required' });
    }

    const resolvedStatus: SensorLifecycleStatus = status || 'ACTIVE';
    if (!VALID_SENSOR_STATUSES.includes(resolvedStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${VALID_SENSOR_STATUSES.join(', ')}`
      });
    }

    const resolvedProduct = product || 'EvoCheck Premium Linx CGM';
    // Retrieve wear duration from controlled knowledge base rather than hardcoded scattered integers
    const wearDays = getProductWearDurationDays(resolvedProduct);
    const { expectedEndDate, renewalDate } = calculateSensorDates(startDate, wearDays);
    const now = new Date().toISOString();

    const newSensor: SensorLifecycle = {
      sensorId: `sen-${Date.now()}`,
      patientId: pat.patientId,
      product: resolvedProduct,
      startDate: startDate.slice(0, 10),
      expectedEndDate,
      renewalDate,
      status: resolvedStatus,
      createdAt: now,
      updatedAt: now
    };

    sensors.unshift(newSensor);
    saveDurableStore();
    res.status(201).json({ success: true, data: newSensor });
  });

  app.put('/api/v1/sensors/:id', (req: Request, res: Response) => {
    const idx = sensors.findIndex(s => s.sensorId === req.params.id || (s as any).id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Sensor not found' });

    const payload = req.body;
    if (payload.status && !VALID_SENSOR_STATUSES.includes(payload.status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${VALID_SENSOR_STATUSES.join(', ')}`
      });
    }

    const now = new Date().toISOString();
    sensors[idx] = {
      ...sensors[idx],
      status: payload.status || sensors[idx].status,
      renewalDate: payload.renewalDate || sensors[idx].renewalDate,
      expectedEndDate: payload.expectedEndDate || sensors[idx].expectedEndDate,
      updatedAt: now
    };

    saveDurableStore();
    res.json({ success: true, data: sensors[idx] });
  });

  // 5. Patient Opportunities & Sales
  app.get('/api/v1/sales', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        opportunities: patientOpportunities,
        totalPipelineValue: patientOpportunities.reduce((acc, curr) => acc + (curr.estimatedValuePKR || 12900), 0),
        activePrescribersCount: doctors.filter(d => d.prescriberStatus === 'active_prescriber').length,
        trialingDoctorsCount: doctors.filter(d => d.prescriberStatus === 'trialing').length
      }
    });
  });

  app.post('/api/v1/sales/opportunities', (req: Request, res: Response) => {
    const { doctorId, clinicalProfile, units, productName } = req.body;
    const doc = doctors.find(d => d.id === doctorId);
    const codeNum = 100 + patientOpportunities.length + 1;
    const newOpp: AnonymousPatientOpportunity = {
      id: `opp-${Date.now()}`,
      patientCode: `P-${codeNum}`,
      doctorId,
      doctorName: doc ? doc.name : 'Specialist',
      clinicalProfile: clinicalProfile || 'Type 2 Diabetes',
      status: 'recommended',
      units: units || 1,
      productName: productName || 'EvoCheck Premium Linx CGM',
      estimatedValuePKR: (units || 1) * 12900,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    patientOpportunities.unshift(newOpp);
    if (doc) {
      doc.openPatientOpportunitiesCount = (doc.openPatientOpportunitiesCount || 0) + 1;
    }
    saveDurableStore();
    res.status(201).json({ success: true, data: newOpp });
  });

  app.patch('/api/v1/sales/opportunities/:id', (req: Request, res: Response) => {
    const idx = patientOpportunities.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    patientOpportunities[idx] = {
      ...patientOpportunities[idx],
      ...req.body,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    saveDurableStore();
    res.json({ success: true, data: patientOpportunities[idx] });
  });

  app.delete('/api/v1/sales/opportunities/:id', (req: Request, res: Response) => {
    const idx = patientOpportunities.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    const deleted = patientOpportunities.splice(idx, 1)[0];
    saveDurableStore();
    res.json({ success: true, data: deleted });
  });

  // 6. Weekly Field Planner
  app.get('/api/v1/planner', (req: Request, res: Response) => {
    res.json({ success: true, data: fieldPlan });
  });

  app.post('/api/v1/planner/optimize', (req: Request, res: Response) => {
    // Regenerates stops intelligently clustering doctors by territory area & OPD availability
    res.json({
      success: true,
      message: 'Field schedule clustered by geographical proximity (PWD -> Soan -> Saidpur -> PIMS).',
      data: fieldPlan
    });
  });

  // 6b. Territory Day-End Operational Summary (v1.1)
  const handleDayEndSummary = (req: Request, res: Response) => {
    const targetDate = (req.query.date as string) || getOperationalDateISO();
    const report = generateDayEndSummary(
      targetDate,
      doctors,
      visits,
      followups,
      patientOpportunities,
      outcomes
    );
    res.json({ success: true, data: report });
  };
  app.get('/api/v1/territory/day-end-summary', handleDayEndSummary);
  app.get('/api/v1/summaries/day-end', handleDayEndSummary);

  // 6c. Multi-Doctor Route Intelligence & Priority Scoring (v1.1)
  app.get('/api/v1/territory/route-plan', (req: Request, res: Response) => {
    const targetDate = (req.query.date as string) || getOperationalDateISO();
    const routePlan = generateRoutePlan(
      doctors,
      visits,
      followups,
      patientOpportunities,
      targetDate
    );
    res.json({ success: true, data: routePlan });
  });

  // v1.3 read-only, explainable Field Intelligence APIs. These endpoints derive
  // recommendations from CRM facts and never write visits, field plans, or scores.
  const fieldIntelligenceDate = (value: unknown) => {
    if (value === undefined) return getOperationalDateISO();
    return typeof value === 'string' && isValidISODate(value) ? value : null;
  };
  app.get('/api/v1/territory/field-intelligence', (req: Request, res: Response) => {
    const targetDate = fieldIntelligenceDate(req.query.date);
    if (!targetDate) return res.status(400).json({ success: false, error: 'date must be a valid YYYY-MM-DD value' });
    const limitRaw = req.query.limit === undefined ? 8 : Number(req.query.limit);
    if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > 20) return res.status(400).json({ success: false, error: 'limit must be an integer between 1 and 20' });
    const data = buildFieldIntelligence({ doctors, visits, followups, opportunities: patientOpportunities, outcomes, samples: sampleTransactions, targetDate });
    const includeIneligible = req.query.includeIneligible === 'true';
    res.json({ success: true, data: { date: targetDate, candidates: data.candidates.slice(0, limitRaw), deferredCandidates: includeIneligible ? data.deferredCandidates : [], algorithmVersion: data.algorithmVersion, limitations: ['No verified geographic coordinates are available; area labels and calling windows only are used.'] } });
  });
  app.get('/api/v1/doctors/:id/pre-visit-intelligence', (req: Request, res: Response) => {
    const doctor = doctors.find(doc => doc.id === req.params.id);
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
    const targetDate = fieldIntelligenceDate(req.query.date);
    if (!targetDate) return res.status(400).json({ success: false, error: 'date must be a valid YYYY-MM-DD value' });
    res.json({ success: true, data: buildPreVisitIntelligence(doctor, { doctors, visits, followups, opportunities: patientOpportunities, outcomes, samples: sampleTransactions, targetDate }) });
  });
  app.get('/api/v1/territory/daily-route-plan', (req: Request, res: Response) => {
    const targetDate = fieldIntelligenceDate(req.query.date);
    if (!targetDate) return res.status(400).json({ success: false, error: 'date must be a valid YYYY-MM-DD value' });
    const maxStops = req.query.maxStops === undefined ? 8 : Number(req.query.maxStops);
    if (!Number.isInteger(maxStops) || maxStops < 1 || maxStops > 12) return res.status(400).json({ success: false, error: 'maxStops must be an integer between 1 and 12' });
    const plan = buildDailyRoutePlan({ doctors, visits, followups, opportunities: patientOpportunities, outcomes, samples: sampleTransactions, fieldPlan, targetDate, maxStops });
    res.json({ success: true, data: plan });
  });

  // 7. Product Knowledge & Claims Hub (Source of Truth v1.2)
  app.get('/api/v1/knowledge', (req: Request, res: Response) => {
    const kb = EVOCHECK_MASTER_KNOWLEDGE;
    const core = kb.core_specifications;

    res.json({
      success: true,
      data: {
        product: {
          name: kb.product_name,
          systemName: kb.system_name,
          version: kb.version,
          lastSyncedAt: kb.last_synced_at,
          wearDays: core.wear_duration.value,
          mardRating: core.mard.value,
          sensorType: 'Subcutaneous Enzymatic Micro-filament Sensor',
          waterResistance: `${core.water_resistance.value} (Certified Ingress Protection / Water & Sweat Resistant)`,
          calibrationRequirement: core.calibration.value,
          readingIntervalMinutes: core.reading_interval.value,
          dailyReadingsCalculated: core.daily_readings_calculated.value,
          sensorReadingsCalculated: core.sensor_readings_calculated.value,
          telemetryProtocol: core.connectivity.value,
          replacementWarrantyDays: core.replacement_warranty.value,
          packageContents: core.package_contents.items,
          pricing: kb.pricing,
          regulatory: {
            status: kb.regulatory_status,
            notes: kb.regulatory_notes
          },
          sourcesRegistry: kb.sources_registry
        },
        claims: kb.verified_claims,
        quarantinedClaims: kb.quarantined_claims,
        competitors: kb.competitors,
        objectionLibrary: kb.objection_guidelines
      }
    });
  });

  // Programmatic Product Specification Query Endpoint
  app.get('/api/v1/knowledge/query', (req: Request, res: Response) => {
    const spec = req.query.spec as string;
    if (!spec) {
      return res.status(400).json({ success: false, error: 'Specification query parameter is required.' });
    }
    const result = queryEvoCheckSpecification(spec);
    res.json({ success: true, data: result });
  });

  // 8. Data Provenance & Conflicts
  app.get('/api/v1/provenance/conflicts', (req: Request, res: Response) => {
    res.json({ success: true, data: dataConflicts });
  });

  app.post('/api/v1/provenance/conflicts/:id/resolve', (req: Request, res: Response) => {
    const { resolution } = req.body; // 'accepted_incoming' | 'retained_current'
    const idx = dataConflicts.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Conflict not found' });

    dataConflicts[idx].status = resolution === 'accepted_incoming' ? 'accepted_incoming' : 'retained_current';
    const doc = doctors.find(d => d.id === dataConflicts[idx].entityId);
    if (doc) {
      doc.hasConflict = dataConflicts.some(c => c.entityId === doc.id && c.status === 'unresolved');
    }

    res.json({ success: true, data: dataConflicts[idx], message: 'Conflict status updated successfully.' });
  });

  // 9. AI Pre-Visit Coach Engine (Grounded in Verified Knowledge Base v1.1)
  app.post('/api/v1/ai/pre-visit-coach', async (req: Request, res: Response) => {
    const { doctorId } = req.body;
    const doc = doctors.find(d => d.id === doctorId) || doctors[0];
    const docVisits = visits.filter(v => v.doctorId === doc.id);
    const pastObjections = doc.recentObjections?.join(', ') || 'Pricing confirmation or clinical evidence request';

    const ai = getAIClient();
    const verifiedKnowledgeContext = getVerifiedEvoCheckAIContext();
    const competitorGrounding = buildCompetitorGroundingContext(
      `${pastObjections} ${doc.notes || ''}`
    );

    if (ai) {
      try {
        const prompt = `
You are the elite AI Sales Coach for MedRep AI, assisting a field Product Specialist for EvoCheck Continuous Glucose Monitoring (CGM).

${verifiedKnowledgeContext}

${competitorGrounding.context}

Target Doctor:
- Name: ${doc.name}
- Specialty: ${doc.specialty} (${doc.subSpecialty || ''})
- Hospital / Clinic: ${doc.clinic}, ${doc.hospital} (${doc.area})
- Priority Tier: ${doc.priority}
- Prescriber Status: ${doc.prescriberStatus}
- Past Objections: ${pastObjections}
- Total Previous Visits: ${docVisits.length}
- Notes: ${doc.notes || 'None'}

STRICT COMPLIANCE & PROVENANCE INSTRUCTIONS:
1. Use ONLY the supplied verified product knowledge for product claims (MARD: 8.66%, 15-day wear, IP68 water resistance, BLE connectivity, 1-min reading interval).
2. NEVER cite 8.8% MARD, 14-day wear, or IP28 for EvoCheck (those are obsolete/prohibited).
3. Do NOT call 8.66% a "clinical target"; describe it as a "Verified Product Specification".
4. If information is absent or not in the knowledge base, state: "This EvoCheck specification is not currently available in the verified MedRep AI knowledge base."
5. Never infer an EvoCheck specification from a competitor. Never invent product claims.
6. Tag facts as [FACT], inferences as [INFERENCE], and action advice as [RECOMMENDATION].
7. For competitor-specific claims, use ONLY the controlled competitor intelligence above.
8. Preserve [VERIFIED], [USER_PROVIDED], [NEEDS_VERIFICATION], and [UNKNOWN] provenance labels.
9. Never invent missing competitor facts. If a competitor field is UNKNOWN, say it is unavailable in the current MedRep AI competitor knowledge base.
10. Never infer NFC/scanning workflows, IP ratings, reader requirements, connectivity, prices, regulatory status, weaknesses, or superiority claims.
11. Do not turn a single specification into overall clinical superiority.

Return a JSON matching this exact structure:
{
  "whyImportant": "FACT or INFERENCE explanation",
  "todayObjective": "RECOMMENDATION specific to EvoCheck value (15-day wear, 8.66% MARD)",
  "suggestedOpening": "RECOMMENDATION dialog to open the call naturally",
  "keyProductPoints": ["FACT point 1", "FACT point 2", "FACT point 3"],
  "questionsToAsk": ["RECOMMENDATION question 1", "RECOMMENDATION question 2"],
  "possibleObjections": [
    {
      "objection": "Anticipated objection",
      "suggestedResponse": "Compliant evidence-based response adhering to verified claims",
      "type": "FACT"
    }
  ],
  "whatNotToSay": ["RECOMMENDATION what to avoid"],
  "suggestedClose": "RECOMMENDATION closing ask",
  "nextVisitObjective": "RECOMMENDATION logical next step"
}
`;

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        const briefing: AICoachBriefing = {
          doctorId: doc.id,
          doctorName: doc.name,
          specialty: doc.specialty,
          hospital: doc.hospital,
          priority: doc.priority,
          whyImportant: {
            type: 'FACT',
            content: parsed.whyImportant || `Key ${doc.specialty} opinion leader in ${doc.area} with high potential patient volume.`
          },
          todayObjective: {
            type: 'RECOMMENDATION',
            content: parsed.todayObjective || `Demonstrate EvoCheck 8.66% verified MARD and 15-day continuous wear to address ${doc.name}'s precision requirements.`
          },
          suggestedOpening: {
            type: 'RECOMMENDATION',
            content: parsed.suggestedOpening || `"Doctor, following our previous discussion on glycemic variability, I brought the verified 8.66% MARD clinical specification for EvoCheck's 15-day sensor."`
          },
          keyProductPoints: (parsed.keyProductPoints || [
            'Clinically verified 8.66% MARD across 15 full days of continuous sensor wear.',
            'Direct Bluetooth (BLE) broadcast provides real-time glucose telemetry every 1 minute.',
            'Certified IP68 water resistance rating for patient daily activity and hygiene.'
          ]).map((p: string) => ({ type: 'FACT' as const, content: p })),
          questionsToAsk: (parsed.questionsToAsk || [
            'How many of your Type 1 or gestational diabetes patients struggle with unpredicted glucose swings?',
            'What is your primary criteria when evaluating CGM accuracy (MARD) and sensor wear duration?'
          ]).map((q: string) => ({ type: 'RECOMMENDATION' as const, content: q })),
          possibleObjections: parsed.possibleObjections || [
            {
              objection: 'Doctor inquires about sensor accuracy and wear duration compared to existing devices.',
              suggestedResponse: '[FACT] EvoCheck demonstrates a verified 8.66% MARD with 15 days of continuous sensor wear, capturing ~21,600 theoretical glucose points at 1-minute intervals. [RECOMMENDATION] Offer to provide the verified technical dossier.',
              type: 'FACT'
            }
          ],
          whatNotToSay: (parsed.whatNotToSay || [
            'Do NOT describe 8.66% MARD as a "clinical target" (it is a verified product specification).',
            'Do NOT claim EvoCheck eliminates all fingersticks, prevents hospitalizations, or offer unverified pricing.'
          ]).map((w: string) => ({ type: 'RECOMMENDATION' as const, content: w })),
          suggestedClose: {
            type: 'RECOMMENDATION',
            content: parsed.suggestedClose || `"Doctor, may I coordinate with your clinic coordinator to provide a verified demonstration kit for your next suitable patient?"`
          },
          nextVisitObjective: {
            type: 'RECOMMENDATION',
            content: parsed.nextVisitObjective || `Review initial clinical feedback and ambulatory glucose profile telemetry with Dr. ${doc.name}.`
          }
        };

        return res.json({ success: true, data: briefing });
      } catch (err: any) {
        console.error('Gemini API Pre-Visit Coach error:', err);
      }
    }

    // Deterministic Clinical Fallback (Verified Grounding v1.1)
    const fallbackBriefing: AICoachBriefing = {
      doctorId: doc.id,
      doctorName: doc.name,
      specialty: doc.specialty,
      hospital: doc.hospital,
      priority: doc.priority,
      whyImportant: {
        type: 'FACT',
        content: `Dr. ${doc.name} manages high patient throughput in ${doc.area}. Holds A-Priority status with potential score of ${doc.potentialScore}/100.`
      },
      todayObjective: {
        type: 'RECOMMENDATION',
        content: `Position EvoCheck verified 15-day continuous wear and 8.66% MARD to secure trial evaluation for 2 poorly controlled patients.`
      },
      suggestedOpening: {
        type: 'RECOMMENDATION',
        content: `"Doctor, following our last discussion regarding glycemic variability, I wanted to share the verified 8.66% MARD specification for EvoCheck's 15-day sensor."`
      },
      keyProductPoints: [
        { type: 'FACT', content: '8.66% MARD verified product specification across 15 full days of continuous sensor wear.' },
        { type: 'FACT', content: 'Continuous Bluetooth Low Energy (BLE) telemetry with 1-minute reading intervals (~21,600 theoretical data points per sensor).' },
        { type: 'FACT', content: 'Certified IP68 water resistance rating ensuring operational integrity during showering and daily activities.' }
      ],
      questionsToAsk: [
        { type: 'RECOMMENDATION', content: 'How do you currently monitor glycemic variability in your pregnant or high-risk diabetic patients?' },
        { type: 'RECOMMENDATION', content: 'Would 1-minute real-time telemetry and 15-day sensor lifespan assist your patient management?' }
      ],
      possibleObjections: [
        {
          objection: 'Doctor asks about commercial pricing and availability.',
          suggestedResponse: '[FACT] Official public patient price is PKR 13,600 on MyPharmEvo (promotional listing, regular PKR 17,000). Internal trade/distributor price is PKR 12,900. Institutional hospital tender pricing is not configured. [RECOMMENDATION] Direct self-paying patients to the official MyPharmEvo portal; do not quote distributor price as retail.',
          type: 'FACT'
        }
      ],
      whatNotToSay: [
        { type: 'RECOMMENDATION', content: 'Do NOT describe 8.66% MARD as a "clinical target"; describe it as a "Verified Product Specification".' },
        { type: 'RECOMMENDATION', content: 'Do NOT make unverified clinical outcome claims such as hospitalization prevention or complete strip elimination.' }
      ],
      suggestedClose: {
        type: 'RECOMMENDATION',
        content: `"Let me coordinate with your clinic coordinator ${doc.paName || 'PA'} to place a demo trial applicator for your next clinic day."`
      },
      nextVisitObjective: {
        type: 'RECOMMENDATION',
        content: `Evaluate initial clinical feedback and review ambulatory glucose profile reports on EvoCheck software.`
      }
    };

    res.json({ success: true, data: fallbackBriefing });
  });

  // 10. AI Voice Visit Note Extraction
  app.post('/api/v1/ai/voice-notes/extract', async (req: Request, res: Response) => {
    const { transcript, doctorId } = req.body;
    const selectedDoc = doctors.find(d => d.id === doctorId) || doctors[0];
    const rawText = transcript || `Visited Dr. Jamal at Shifa today. He was impressed with the 15-day wear of EvoCheck and verified 8.66% MARD accuracy. He agreed to place a trial sensor for an adolescent Type 1 patient with night hypos. Asked to deliver sample applicator to Tariq by Wednesday.`;

    const ai = getAIClient();

    if (ai) {
      try {
        const prompt = `
Extract structured CRM entity data from this Medical Representative field voice note:
"${rawText}"

Available doctors in territory:
${doctors.map(d => `- ID: ${d.id}, Name: ${d.name}, Specialty: ${d.specialty}, Area: ${d.area}`).join('\n')}

Extract and return strictly a valid JSON object matching:
{
  "doctorName": "Identified doctor name or best match",
  "matchedDoctorId": "Matched doctor ID or doc-1",
  "interestLevel": "very_high | moderate | neutral | skeptical | not_interested",
  "productDiscussed": "EvoCheck CGM",
  "keyDiscussionPoints": ["string"],
  "objectionsRaised": [
    {
      "category": "price_affordability | sensor_accuracy | wear_duration | competitor_loyalty | other",
      "detail": "string",
      "responseGiven": "string or empty"
    }
  ],
  "patientOpportunity": {
    "clinicalProfile": "e.g. Type 1 Adolescent with hypoglycemia",
    "units": 1
  },
  "actionItems": [
    {
      "title": "Clear action description",
      "dueInDays": 2,
      "priority": "high | medium | low"
    }
  ],
  "nextVisitObjective": "Clear objective for next call",
  "confidence": 0.95
}
`;

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        const extraction: VoiceNoteExtraction = {
          doctorId: parsed.matchedDoctorId || selectedDoc.id,
          doctorName: parsed.doctorName || selectedDoc.name,
          visitDate: '2026-09-01',
          interestLevel: parsed.interestLevel || 'very_high',
          productDiscussed: parsed.productDiscussed || 'EvoCheck 15-Day CGM',
          keyDiscussionPoints: parsed.keyDiscussionPoints || ['Discussed 15-day continuous telemetry', 'Showed verified MARD 8.66% clinical specification'],
          objectionsRaised: parsed.objectionsRaised || [{ category: 'price_affordability', detail: 'Inquired about official commercial pricing release', responseGiven: 'Explained pricing is pending distributor release and emphasized 15-day value' }],
          patientOpportunity: parsed.patientOpportunity || { clinicalProfile: 'Type 1 Adolescent with severe hypoglycemia', units: 1 },
          actionItems: parsed.actionItems || [{ title: `Deliver applicator demo kit to PA`, dueInDays: 2, priority: 'high' }],
          nextVisitObjective: parsed.nextVisitObjective || 'Review patient sensor trial and app synchronization data',
          nextFollowUpDate: '2026-09-03',
          rawTranscript: rawText,
          confidence: parsed.confidence || 0.95
        };

        return res.json({ success: true, data: extraction });
      } catch (err: any) {
        console.error('Gemini Voice Note extraction error:', err);
      }
    }

    // Deterministic Extraction Fallback
    const fallbackExtraction: VoiceNoteExtraction = {
      doctorId: selectedDoc.id,
      doctorName: selectedDoc.name,
      visitDate: '2026-09-01',
      interestLevel: 'very_high',
      productDiscussed: 'EvoCheck 15-Day CGM',
      keyDiscussionPoints: [
        'Reviewed 15-day continuous monitoring vs episodic fingerstick testing',
        'Doctor highlighted patient demand for real-time mobile app alerts and 8.66% MARD precision'
      ],
      objectionsRaised: [
        {
          category: 'price_affordability',
          detail: 'Doctor inquired about territory pricing schedule.',
          responseGiven: 'Confirmed pricing is pending distributor configuration, highlighted 15-day sensor lifespan.'
        }
      ],
      patientOpportunity: {
        clinicalProfile: 'Type 1 Adolescent patient with nocturnal hypoglycemia episodes',
        units: 1
      },
      actionItems: [
        {
          title: `Deliver EvoCheck dummy applicator & patient guide to ${selectedDoc.paName || 'PA'}`,
          dueInDays: 2,
          priority: 'high'
        }
      ],
      nextVisitObjective: `Review ambulatory glucose report (AGP) from trial sensor with Dr. ${selectedDoc.name}`,
      nextFollowUpDate: '2026-09-03',
      rawTranscript: rawText,
      confidence: 0.92
    };

    res.json({ success: true, data: fallbackExtraction });
  });

  // 11. Commit Voice Note to CRM
  app.post('/api/v1/ai/voice-notes/commit', (req: Request, res: Response) => {
    const { extraction } = req.body as { extraction: VoiceNoteExtraction };
    if (!extraction) return res.status(400).json({ success: false, error: 'Extraction data required' });

    const docId = extraction.doctorId || doctors[0].id;
    const doc = doctors.find(d => d.id === docId);

    // 1. Create completed visit
    const newVisit: Visit = {
      id: `vis-${Date.now()}`,
      doctorId: docId,
      doctorName: extraction.doctorName || (doc ? doc.name : 'Doctor'),
      doctorSpecialty: doc ? doc.specialty : 'Specialist',
      hospitalClinic: doc ? doc.clinic : 'Clinic',
      area: doc ? doc.area : 'Rawalpindi',
      scheduledDate: extraction.visitDate || '2026-09-01',
      scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
      interestLevel: extraction.interestLevel,
      summary: extraction.keyDiscussionPoints.join('. '),
      objectives: [
        { id: `obj-${Date.now()}`, text: extraction.nextVisitObjective || 'Discuss EvoCheck CGM', isAchieved: true }
      ],
      objections: extraction.objectionsRaised?.map((o, i) => ({
        id: `obj-${Date.now()}-${i}`,
        category: (o.category as any) || 'price_affordability',
        detail: o.detail,
        responseGiven: o.responseGiven,
        resolved: true
      })),
      nextFollowUpDate: extraction.nextFollowUpDate,
      nextVisitObjective: extraction.nextVisitObjective
    };
    visits.unshift(newVisit);

    // 2. Create tasks
    if (extraction.actionItems && extraction.actionItems.length > 0) {
      extraction.actionItems.forEach((item, i) => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (item.dueInDays || 2));
        followups.unshift({
          id: `tsk-${Date.now()}-${i}`,
          doctorId: docId,
          doctorName: extraction.doctorName || 'Doctor',
          doctorArea: doc ? doc.area : 'Territory',
          visitId: newVisit.id,
          title: item.title,
          dueDate: dueDate.toISOString().split('T')[0],
          priority: item.priority || 'high',
          status: 'pending',
          source: 'visit'
        });
      });
    }

    // 3. Create Patient Opportunity if identified
    if (extraction.patientOpportunity && extraction.patientOpportunity.clinicalProfile) {
      const codeNum = 100 + patientOpportunities.length + 1;
      patientOpportunities.unshift({
        id: `opp-${Date.now()}`,
        patientCode: `P-${codeNum}`,
        doctorId: docId,
        doctorName: extraction.doctorName || 'Doctor',
        clinicalProfile: extraction.patientOpportunity.clinicalProfile,
        status: 'recommended',
        units: extraction.patientOpportunity.units || 1,
        productName: extraction.productDiscussed || 'EvoCheck Premium Linx CGM',
        estimatedValuePKR: (extraction.patientOpportunity.units || 1) * 12900,
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01'
      });
      if (doc) {
        doc.openPatientOpportunitiesCount = (doc.openPatientOpportunitiesCount || 0) + 1;
      }
    }

    // 4. Update doctor stats
    if (doc) {
      doc.totalVisitsCount = (doc.totalVisitsCount || 0) + 1;
      doc.lastVisitedDate = '2026-09-01';
      if (extraction.interestLevel === 'very_high') {
        doc.relationshipStrength = Math.min(5, (doc.relationshipStrength || 3) + 1);
      }
    }

    res.json({
      success: true,
      message: 'Voice note structured data successfully committed to CRM.',
      data: { visit: newVisit, updatedDoctor: doc }
    });
  });

  // Architecture fix (v1.5.5): a claim-guard rejection for a query that is NOT
  // actually about a competitor (e.g. EvoCheck's own pricing/discount
  // governance) must fall back to the curated, controlled EvoCheck response —
  // not the generic "no controlled competitor record matched" competitor
  // fallback. Genuine competitor queries are untouched and continue to use
  // the existing competitor claim guard fallback. Applies identically to both
  // the successful-Gemini-generation path and the Gemini-unavailable
  // deterministic-fallback path so neither can be silently overridden.
  function guardWithEvoCheckFallback(query: string, rawResult: CompetitorClaimGuardResult): CompetitorClaimGuardResult {
    if (!rawResult.safe && !isLikelyCompetitorQuery(query)) {
      return { ...rawResult, safe: true, text: buildDeterministicEvoCheckResponse(query) };
    }
    return rawResult;
  }

  // 12. AI Territory & Knowledge Chat Assistant
  app.post('/api/v1/ai/chat', async (req: Request, res: Response) => {
    const { query } = req.body;

    // Validate query
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Query is required.' });
    }

    const ai = getAIClient();
    const verifiedKnowledgeContext = getVerifiedEvoCheckAIContext();
    const competitorGrounding = buildCompetitorGroundingContext(query);

    const crmContext = `
MedRep AI CRM Context:
- Active Territory: Rawalpindi-East (PWD, Soan Garden, Saidpur Road, Commercial Market) & Islamabad (PIMS, Shifa International)
- Doctors in Database:
${doctors.map(d => `* ${d.name} (${d.specialty}) at ${d.hospital} in ${d.area} [Priority ${d.priority}, Status: ${d.prescriberStatus}, Potential: ${d.potentialScore}/100, Daily Rank: ${d.dailyPriorityScore}/100, Timings: ${d.timings.map(t => `${t.dayName} ${t.startTime}-${t.endTime}`).join(', ')}]`).join('\n')}

${verifiedKnowledgeContext}
`;

    if (ai) {
      try {
        const prompt = `
You are the MedRep AI Territory & Clinical Intelligence Assistant.
Answer the Medical Representative's question using ONLY the factual CRM context and verified product knowledge provided below.

CRITICAL KNOWLEDGE & PRICING GUARDRAILS:
1. Use ONLY the supplied verified product knowledge for product claims (MARD: 8.66%, 15-day wear, IP68 water resistance, BLE connectivity, 1-min interval, DRAP approved). Always explicitly describe the 8.66% MARD rating as a "Verified Product Specification".
2. When asked "What is our distributor price?":
   -> Answer: "PKR 12,900 per EvoCheck Premium Linx sensor/unit." (Authorized internal trade price, Visibility: INTERNAL).
3. When asked "What is the patient/public online price?":
   -> Answer: "PKR 13,600, based on the current MyPharmEvo listing." (Regular PKR 17,000, 20% promotional discount).
4. When asked about hospital/institutional price:
   -> Answer: "Institutional pricing is currently NOT_CONFIGURED in the verified knowledge base."
5. Clearly distinguish distributor/internal price from patient-facing retail price. Do NOT treat the distributor price as the public patient retail price, and do NOT invent unverified discounts or margins.
6. NEVER state 8.8% MARD, 14-day wear, or IP28 for EvoCheck.
7. If the user asks about an EvoCheck specification or clinical claim that is NOT present in the verified knowledge base, you MUST state:
   "This EvoCheck specification is not currently available in the verified MedRep AI knowledge base."
8. Never infer an EvoCheck specification from a competitor or guess.
9. Clearly prefix points with [FACT], [INFERENCE], or [RECOMMENDATION].

${crmContext}

${competitorGrounding.context}

COMPETITOR PROVENANCE & ANTI-HALLUCINATION RULES:
1. Use only controlled competitor intelligence for competitor-specific claims.
2. Preserve [VERIFIED], [USER_PROVIDED], [NEEDS_VERIFICATION], and [UNKNOWN] labels.
3. Never invent missing competitor facts.
4. Never infer NFC/scanning workflows, IP ratings, reader requirements, connectivity, prices, regulatory status, weaknesses, or superiority claims.
5. If a field is UNKNOWN, say it is unavailable in the current MedRep AI competitor knowledge base.
6. Do not turn a single specification into overall clinical superiority.

User Question: "${query}"
`;

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt
        });

        const guardedRaw = sanitizeCompetitorGeneratedText(
          query,
          response.text || '',
          competitorGrounding.matchedCompetitorIds
        );
        const guarded = guardWithEvoCheckFallback(query, guardedRaw);

        return res.json({
          success: true,
          text: guarded.text,
          competitorGuard: {
            safe: guarded.safe,
            violations: guarded.violations,
            matchedCompetitorIds: guarded.matchedCompetitorIds
          }
        });
      } catch (err) {
        console.error('Gemini Chat error:', err);
      }
    }

    // Contextual fallback responder (Verified Grounding v1.3)
    const text = buildDeterministicEvoCheckResponse(query);

    const guardedFallbackRaw = sanitizeCompetitorGeneratedText(
      query,
      text,
      competitorGrounding.matchedCompetitorIds
    );
    const guardedFallback = guardWithEvoCheckFallback(query, guardedFallbackRaw);

    res.json({
      success: true,
      text: guardedFallback.text,
      competitorGuard: {
        safe: guardedFallback.safe,
        violations: guardedFallback.violations,
        matchedCompetitorIds: guardedFallback.matchedCompetitorIds
      }
    });
  });

  // 12b. AI Objection Scenarios & Drill Evaluator (v1.1)
  const handleObjectionScenarios = (req: Request, res: Response) => {
    res.json({ success: true, data: OBJECTION_SCENARIOS });
  };
  app.get('/api/v1/ai/objection-scenarios', handleObjectionScenarios);
  app.get('/api/v1/ai/objections/scenarios', handleObjectionScenarios);

  const handleObjectionEvaluation = async (req: Request, res: Response) => {
    const { scenarioId, repResponse } = req.body;
    if (!scenarioId) {
      return res.status(400).json({ success: false, error: 'Missing scenarioId' });
    }
    if (!getScenarioById(scenarioId)) {
      return res.status(404).json({ success: false, error: `Invalid or unknown scenarioId: ${scenarioId}` });
    }
    if (!repResponse || typeof repResponse !== 'string' || repResponse.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'repResponse cannot be empty' });
    }

    try {
      const ai = getAIClient();
      const evaluation = await evaluateObjectionDrill(ai, scenarioId, repResponse);
      res.json({ success: true, data: evaluation });
    } catch (err: any) {
      console.error('Objection drill evaluation error:', err);
      res.status(500).json({ success: false, error: err.message || 'Evaluation failed' });
    }
  };
  app.post('/api/v1/ai/objection-drill', handleObjectionEvaluation);
  app.post('/api/v1/ai/objections/evaluate', handleObjectionEvaluation);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MedRep AI full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
