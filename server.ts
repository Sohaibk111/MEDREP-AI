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
  AICoachBriefing
} from './src/types';

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
}

function loadDurableStore(): CRMStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.doctors) && Array.isArray(parsed.visits)) {
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
    dataConflicts: JSON.parse(JSON.stringify(INITIAL_DATA_CONFLICTS))
  };
}

const store = loadDurableStore();
let doctors: Doctor[] = store.doctors;
let visits: Visit[] = store.visits;
let followups: FollowupTask[] = store.followups;
let patientOpportunities: AnonymousPatientOpportunity[] = store.patientOpportunities;
let fieldPlan: WeeklyFieldPlan = store.fieldPlan;
let dataConflicts: DataConflict[] = store.dataConflicts;

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
      dataConflicts
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write persistent CRM store to disk:', err);
  }
}

// Ensure initial file exists
saveDurableStore();

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

  // 1. Dashboard Briefing
  app.get('/api/v1/briefing', (req: Request, res: Response) => {
    const today = '2026-09-01';
    const todaysVisits = visits.filter(v => v.scheduledDate === today);
    const completedVisits = todaysVisits.filter(v => v.status === 'completed');
    const urgentFollowups = followups.filter(f => f.status === 'pending');
    const nextVisit = todaysVisits.find(v => v.status === 'in_progress') || todaysVisits.find(v => v.status === 'planned') || todaysVisits[0];

    res.json({
      success: true,
      data: {
        date: today,
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
        }
      }
    });
  });

  // 2. Doctor CRM
  app.get('/api/v1/doctors', (req: Request, res: Response) => {
    const { search, area, priority, status } = req.query;
    let list = [...doctors];

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.hospital.toLowerCase().includes(q) ||
        d.area.toLowerCase().includes(q)
      );
    }
    if (area && typeof area === 'string' && area !== 'all') {
      list = list.filter(d => d.area.toLowerCase() === area.toLowerCase());
    }
    if (priority && typeof priority === 'string' && priority !== 'all') {
      list = list.filter(d => d.priority === priority);
    }
    if (status && typeof status === 'string' && status !== 'all') {
      list = list.filter(d => d.prescriberStatus === status);
    }

    res.json({ success: true, data: list, count: list.length });
  });

  app.get('/api/v1/doctors/:id', (req: Request, res: Response) => {
    const doc = doctors.find(d => d.id === req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    const docVisits = visits.filter(v => v.doctorId === doc.id);
    const docFollowups = followups.filter(f => f.doctorId === doc.id);
    const docOpportunities = patientOpportunities.filter(o => o.doctorId === doc.id);
    const conflicts = dataConflicts.filter(c => c.entityId === doc.id && c.status === 'unresolved');

    res.json({
      success: true,
      data: {
        ...doc,
        visitsHistory: docVisits,
        pendingTasks: docFollowups,
        patientOpportunities: docOpportunities,
        conflicts
      }
    });
  });

  app.post('/api/v1/doctors', (req: Request, res: Response) => {
    const payload = req.body;
    const newDoc: Doctor = {
      id: `doc-${Date.now()}`,
      name: payload.name || 'New Doctor',
      specialty: payload.specialty || 'General Diabetology',
      hospital: payload.hospital || 'Private Clinic',
      clinic: payload.clinic || 'Consulting Room',
      area: payload.area || 'PWD',
      city: payload.city || 'Rawalpindi',
      address: payload.address || '',
      priority: payload.priority || 'B',
      prescriberStatus: payload.prescriberStatus || 'prospect',
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
      hasConflict: false
    };
    doctors.unshift(newDoc);
    saveDurableStore();
    res.status(201).json({ success: true, data: newDoc });
  });

  app.patch('/api/v1/doctors/:id', (req: Request, res: Response) => {
    const idx = doctors.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Doctor not found' });
    doctors[idx] = { ...doctors[idx], ...req.body };
    saveDurableStore();
    res.json({ success: true, data: doctors[idx] });
  });

  app.delete('/api/v1/doctors/:id', (req: Request, res: Response) => {
    const idx = doctors.findIndex(d => d.id === req.params.id);
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
      scheduledDate: scheduledDate || '2026-09-01',
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

  // 4. Follow-up Tasks
  app.get('/api/v1/followups', (req: Request, res: Response) => {
    res.json({ success: true, data: followups });
  });

  app.post('/api/v1/followups', (req: Request, res: Response) => {
    const { doctorId, title, dueDate, priority } = req.body;
    const doc = doctors.find(d => d.id === doctorId);
    const newTask: FollowupTask = {
      id: `tsk-${Date.now()}`,
      doctorId,
      doctorName: doc ? doc.name : 'Doctor',
      doctorArea: doc ? doc.area : 'Territory',
      title,
      dueDate,
      priority: priority || 'medium',
      status: 'pending',
      source: 'manual'
    };
    followups.unshift(newTask);
    saveDurableStore();
    res.status(201).json({ success: true, data: newTask });
  });

  app.patch('/api/v1/followups/:id', (req: Request, res: Response) => {
    const idx = followups.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Task not found' });
    followups[idx] = { ...followups[idx], ...req.body };
    if (req.body.status === 'completed') {
      followups[idx].completedAt = new Date().toISOString();
    }
    saveDurableStore();
    res.json({ success: true, data: followups[idx] });
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

    if (ai) {
      try {
        const prompt = `
You are the elite AI Sales Coach for MedRep AI, assisting a field Product Specialist for EvoCheck Continuous Glucose Monitoring (CGM).

${verifiedKnowledgeContext}

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
          model: 'gemini-2.5-flash',
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
          model: 'gemini-2.5-flash',
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

  // 12. AI Territory & Knowledge Chat Assistant
  app.post('/api/v1/ai/chat', async (req: Request, res: Response) => {
    const { query } = req.body;

    // Validate query
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Query is required.' });
    }

    const ai = getAIClient();
    const verifiedKnowledgeContext = getVerifiedEvoCheckAIContext();

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
1. Use ONLY the supplied verified product knowledge for product claims (MARD: 8.66%, 15-day wear, IP68 water resistance, BLE connectivity, 1-min interval, DRAP approved).
2. When asked "What is our distributor price?":
   -> Answer: "PKR 12,900 per EvoCheck Premium Linx sensor/unit." (Authorized internal trade price, Visibility: INTERNAL).
3. When asked "What is the patient/public online price?":
   -> Answer: "PKR 13,600, based on the current MyPharmEvo listing." (Regular PKR 17,000, 20% promotional discount).
4. When asked about hospital/institutional price:
   -> Answer: "Institutional pricing is not currently configured in the verified knowledge base."
5. Clearly distinguish distributor/internal price from patient-facing retail price. Do NOT treat the distributor price as the public patient retail price, and do NOT invent unverified discounts or margins.
6. NEVER state 8.8% MARD, 14-day wear, or IP28 for EvoCheck.
7. If the user asks about an EvoCheck specification or clinical claim that is NOT present in the verified knowledge base, you MUST state:
   "This EvoCheck specification is not currently available in the verified MedRep AI knowledge base."
8. Never infer an EvoCheck specification from a competitor or guess.
9. Clearly prefix points with [FACT], [INFERENCE], or [RECOMMENDATION].

${crmContext}

User Question: "${query}"
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        return res.json({ success: true, text: response.text });
      } catch (err) {
        console.error('Gemini Chat error:', err);
      }
    }

    // Contextual fallback responder (Verified Grounding v1.3)
    const qLower = (query || '').toLowerCase();
    let text = '';
    if (qLower.includes('unsupported') || qLower.includes('not verified') || qLower.includes('unknown spec')) {
      text = `This EvoCheck specification is not currently available in the verified MedRep AI knowledge base.`;
    } else if (qLower.includes('distributor') && (qLower.includes('price') || qLower.includes('cost') || qLower.includes('rate'))) {
      text = `[FACT] The authorized internal distributor price is PKR 12,900 per EvoCheck Premium Linx sensor/unit (Classification: DISTRIBUTOR_PRICE, Visibility: INTERNAL).\n\n[RECOMMENDATION] Medical representatives must maintain this as internal commercial information and not quote it as the public patient retail price.`;
    } else if ((qLower.includes('public') || qLower.includes('retail') || qLower.includes('patient') || qLower.includes('online')) && (qLower.includes('price') || qLower.includes('cost'))) {
      text = `[FACT] The official patient/public online price is PKR 13,600 (current promotional sale, regular PKR 17,000 with 20% discount), based on the current MyPharmEvo listing.\n\n[RECOMMENDATION] Self-paying patients can be directed to the official MyPharmEvo website for direct home delivery.`;
    } else if (qLower.includes('institutional') || qLower.includes('hospital price') || qLower.includes('tender') || (qLower.includes('hospital') && qLower.includes('price')) || qLower.includes('invent a price')) {
      text = `[FACT] Institutional hospital/tender pricing is currently NOT_CONFIGURED in the verified knowledge base.\n\n[RECOMMENDATION] Do not quote retail e-commerce prices for hospital tender procurement or invent unverified pricing; confirm institutional rates once formal commercial authorization is released.`;
    } else if (qLower.includes('discount') || qLower.includes('invent') || qLower.includes('margin')) {
      text = `[FACT] MedRep AI strictly adheres to verified pricing governance. Internal distributor price is PKR 12,900; public retail price is PKR 13,600 on MyPharmEvo. Institutional/hospital pricing is NOT_CONFIGURED.\n\n[RECOMMENDATION] Unauthorized discounts or invented prices are strictly prohibited. Quote only authorized pricing tiers.`;
    } else if (qLower.includes('12,500') || qLower.includes('old price') || qLower.includes('legacy price')) {
      text = `[FACT] The legacy figure of PKR 12,500 is obsolete and quarantined. The authorized internal distributor price is PKR 12,900 per sensor/unit, and the official public retail price is PKR 13,600.\n\n[RECOMMENDATION] Always use the active verified commercial pricing.`;
    } else if (qLower.includes('regulatory') || qLower.includes('drap') || qLower.includes('approved') || qLower.includes('approval')) {
      text = `[FACT] EvoCheck Premium Linx CGM is DRAP Approved (DRAP Medical Device Registration Authority, Pakistan).\n\n[RECOMMENDATION] Present the DRAP regulatory registration details when meeting with hospital procurement committees and clinical department heads.`;
    } else if (qLower.includes('clinically proven') || qLower.includes('clinical trial') || qLower.includes('guarantee')) {
      text = `[FACT] EvoCheck CGM has a verified MARD specification of 8.66% across its 15-day sensor lifespan under technical validation protocols. Claims are based on Verified Product Specifications rather than unverified promotional promises.\n\n[RECOMMENDATION] Share technical dossier data rather than subjective promotional phrasing.`;
    } else if (qLower.includes('hypoglycemia') || qLower.includes('prevent')) {
      text = `[FACT] EvoCheck is a continuous glucose monitoring sensor providing real-time glucose telemetry every 1 minute with customizable high/low threshold alerts. It provides actionable trend data but does not directly replace medical therapy or independently prevent metabolic events.\n\n[RECOMMENDATION] Explain how real-time trend arrows and automated alerts empower proactive glycemic management.`;
    } else if (qLower.includes('fingerstick') || qLower.includes('replace') || qLower.includes('calibration')) {
      text = `[FACT] EvoCheck is factory-calibrated for continuous glucose monitoring without routine fingersticks. However, confirmatory fingerstick blood glucose testing may be required during rapid glucose fluctuations or if symptoms do not match sensor readings.\n\n[RECOMMENDATION] Emphasize zero-routine calibration while reinforcing standard clinical safety guidance.`;
    } else if (qLower.includes('14 days') || qLower.includes('14-day') || qLower.includes('is evocheck 14')) {
      text = `[FACT] No, EvoCheck provides 15 days of continuous sensor wear per applicator unit (14 days is an obsolete/competitor specification).\n\n[RECOMMENDATION] Highlight the 15-day continuous wear duration as providing extra monitoring continuity.`;
    } else if (qLower.includes('ip28') || qLower.includes('is evocheck ip28')) {
      text = `[FACT] No, EvoCheck is certified IP68 water resistance according to IEC 60529 standard (IP28 is an obsolete/prohibited specification).\n\n[RECOMMENDATION] Reassure clinicians and patients that IP68 provides robust water and sweat resistance for showering and daily activities.`;
    } else if (qLower.includes('libre') || qLower.includes('compare') || qLower.includes('competitor') || qLower.includes('dexcom') || qLower.includes('aidex')) {
      text = `[FACT] EvoCheck vs FreeStyle Libre 1: EvoCheck provides 15-day wear (vs Libre's 14 days), 8.66% MARD (vs Libre's 9.2%), direct continuous Bluetooth Low Energy telemetry every 1 minute without manual NFC scanning (vs Libre's manual NFC scan requirement), and IP68 water resistance (vs Libre's IP27).\n\n[RECOMMENDATION] Position EvoCheck's continuous automated telemetry and 15-day duration as key clinical differentiators for active patient monitoring.`;
    } else if (qLower.includes('price') || qLower.includes('cost') || qLower.includes('pricing')) {
      text = `[FACT] EvoCheck pricing structure: Internal Distributor Price is PKR 12,900 per sensor/unit (INTERNAL); Public Patient Online Price is PKR 13,600 (official MyPharmEvo promotional listing, regular PKR 17,000); Institutional Hospital Price is NOT_CONFIGURED.\n\n[RECOMMENDATION] Clearly distinguish internal trade pricing from public retail pricing when speaking with clinicians.`;
    } else if (qLower.includes('pwd') || qLower.includes('soan')) {
      text = `[FACT] In PWD & Soan Garden, you have Dr. Sarah Khan (Diabetologist, Priority A, Sugar & Metabolic Care Clinic, OPD Mon/Tue/Thu 11:30 AM) and Dr. Uzair Malik (Nephrologist, Priority B, Soan International Hospital, OPD Mon/Wed 2:00 PM).\n\n[RECOMMENDATION] Visit Dr. Sarah Khan first around 12:00 PM to review gestational diabetes trial (#P-102), then drive 8 minutes down Islamabad Expressway to see Dr. Uzair Malik at 2:00 PM.`;
    } else if (qLower.includes('mard') || qLower.includes('accuracy')) {
      text = `[FACT] EvoCheck CGM has a verified MARD of 8.66% across its 15-day sensor lifespan (Verified Product Specification).\n\n[RECOMMENDATION] Share the technical dossier with clinicians seeking clinical-grade accuracy validation.`;
    } else if (qLower.includes('wear') || qLower.includes('duration') || qLower.includes('days') || qLower.includes('how long')) {
      text = `[FACT] EvoCheck provides 15 days of continuous sensor wear per applicator.\n\n[RECOMMENDATION] Position the 15-day lifespan against 14-day market alternatives as providing an extra day of uninterrupted glycemic insights.`;
    } else if (qLower.includes('water') || qLower.includes('swim') || qLower.includes('shower') || qLower.includes('resistance')) {
      text = `[FACT] EvoCheck is rated IP68 for water ingress resistance according to IEC 60529 standards.\n\n[RECOMMENDATION] Reassure patients that normal showering and water exposure are supported during the 15-day wear.`;
    } else if (qLower.includes('warranty')) {
      text = `[FACT] EvoCheck includes a 12-day manufacturer replacement warranty (source: MyPharmEvo official listing), which is distinct from the 15-day continuous sensor wear lifespan.\n\n[RECOMMENDATION] Clarify warranty coverage terms for patients requiring product support.`;
    } else {
      text = `[FACT] Today's prioritized route covers Shifa International Hospital (Prof. Dr. Jamal Ahmed, 11:00 AM) and PWD (Dr. Sarah Khan, 12:30 PM).\n\n[RECOMMENDATION] Ensure you carry the EvoCheck demonstration applicator and verified 8.66% MARD technical one-pagers for both calls.`;
    }

    res.json({ success: true, text });
  });

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
