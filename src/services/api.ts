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
  ObjectionDrillRequest,
  ObjectionDrillResponse,
  ObjectionScenarioDefinition,
  RoutePlanResponse,
  PrescriberLifecycleStatus, DailyRoutePlan, DoctorPriorityAssessment, PreVisitIntelligence,
  PatientCRM, DoctorPatientReferral, OrderCRM, SensorLifecycle, PatientTimelineEvent
} from '../types';

const API_BASE = '/api/v1';

export async function fetchBriefing() {
  const res = await fetch(`${API_BASE}/briefing`);
  if (!res.ok) throw new Error('Failed to load dashboard briefing');
  return res.json();
}

export async function fetchDoctors(params?: { search?: string; area?: string; priority?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.area) query.append('area', params.area);
  if (params?.priority) query.append('priority', params.priority);
  if (params?.status) query.append('status', params.status);

  const res = await fetch(`${API_BASE}/doctors?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch doctors');
  return res.json();
}

export async function fetchDoctorById(id: string) {
  const res = await fetch(`${API_BASE}/doctors/${id}`);
  if (!res.ok) throw new Error('Failed to fetch doctor details');
  return res.json();
}

export async function createDoctor(doctorData: Partial<Doctor>) {
  const res = await fetch(`${API_BASE}/doctors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doctorData)
  });
  if (!res.ok) throw new Error('Failed to create doctor');
  return res.json();
}

export async function updateDoctor(id: string, doctorData: Partial<Doctor>) {
  const res = await fetch(`${API_BASE}/doctors/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doctorData)
  });
  if (!res.ok) throw new Error('Failed to update doctor');
  return res.json();
}

export async function fetchVisits() {
  const res = await fetch(`${API_BASE}/visits`);
  if (!res.ok) throw new Error('Failed to fetch visits');
  return res.json();
}

export async function createVisit(visitData: Partial<Visit>) {
  const res = await fetch(`${API_BASE}/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(visitData)
  });
  if (!res.ok) throw new Error('Failed to create visit');
  return res.json();
}

export async function updateVisitStatus(id: string, updateData: any) {
  const res = await fetch(`${API_BASE}/visits/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  if (!res.ok) throw new Error('Failed to update visit status');
  return res.json();
}

export async function fetchFollowups() {
  const res = await fetch(`${API_BASE}/followups`);
  if (!res.ok) throw new Error('Failed to fetch followups');
  return res.json();
}

export async function createFollowup(taskData: Partial<FollowupTask>) {
  const res = await fetch(`${API_BASE}/followups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateFollowup(id: string, taskData: Partial<FollowupTask>) {
  const res = await fetch(`${API_BASE}/followups/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function fetchSales() {
  const res = await fetch(`${API_BASE}/sales`);
  if (!res.ok) throw new Error('Failed to fetch sales data');
  return res.json();
}

export async function createPatientOpportunity(oppData: Partial<AnonymousPatientOpportunity>) {
  const res = await fetch(`${API_BASE}/sales/opportunities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(oppData)
  });
  if (!res.ok) throw new Error('Failed to create patient opportunity');
  return res.json();
}

export async function updatePatientOpportunity(id: string, oppData: Partial<AnonymousPatientOpportunity>) {
  const res = await fetch(`${API_BASE}/sales/opportunities/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(oppData)
  });
  if (!res.ok) throw new Error('Failed to update patient opportunity');
  return res.json();
}

export async function fetchFieldPlan() {
  const res = await fetch(`${API_BASE}/planner`);
  if (!res.ok) throw new Error('Failed to fetch field plan');
  return res.json();
}

export async function fetchKnowledge() {
  const res = await fetch(`${API_BASE}/knowledge`);
  if (!res.ok) throw new Error('Failed to fetch knowledge hub');
  return res.json();
}

export async function fetchConflicts() {
  const res = await fetch(`${API_BASE}/provenance/conflicts`);
  if (!res.ok) throw new Error('Failed to fetch data conflicts');
  return res.json();
}

export async function resolveConflict(id: string, resolution: 'accepted_incoming' | 'retained_current') {
  const res = await fetch(`${API_BASE}/provenance/conflicts/${id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolution })
  });
  if (!res.ok) throw new Error('Failed to resolve data conflict');
  return res.json();
}

export async function fetchAICoachBriefing(doctorId: string) {
  const res = await fetch(`${API_BASE}/ai/pre-visit-coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctorId })
  });
  if (!res.ok) throw new Error('Failed to generate AI Coach briefing');
  return res.json();
}

export async function extractVoiceNote(transcript: string, doctorId?: string) {
  const res = await fetch(`${API_BASE}/ai/voice-notes/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, doctorId })
  });
  if (!res.ok) throw new Error('Failed to extract voice note entities');
  return res.json();
}

export async function commitVoiceNote(extraction: VoiceNoteExtraction) {
  const res = await fetch(`${API_BASE}/ai/voice-notes/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ extraction })
  });
  if (!res.ok) throw new Error('Failed to commit voice note to CRM');
  return res.json();
}

export async function sendAIChatQuery(query: string) {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Failed to send AI chat query');
  return res.json();
}

// ==========================================
// MEDREP AI v1.1 API CLIENT METHODS
// ==========================================

export async function logVisitOutcome(visitId: string, payload: {
  outcomeType: VisitOutcomeType;
  notes?: string;
  samplesCount?: number;
  committedUnits?: number;
  followUpDate?: string;
  doctorId?: string;
  clientVisitId?: string;
}): Promise<{ success: boolean; data: { visit: Visit; doctor: Doctor; outcomeRecord: VisitOutcomeRecord } }> {
  const res = await fetch(`${API_BASE}/visits/${visitId}/outcome`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to log visit outcome');
  }
  return res.json();
}

export async function getDayEndSummary(date?: string): Promise<{ success: boolean; data: DayEndSummaryReport }> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await fetch(`${API_BASE}/territory/day-end-summary${query}`);
  if (!res.ok) throw new Error('Failed to generate day-end summary');
  return res.json();
}

export async function fetchObjectionScenarios(): Promise<{ success: boolean; data: ObjectionScenarioDefinition[] }> {
  const res = await fetch(`${API_BASE}/ai/objection-scenarios`);
  if (!res.ok) throw new Error('Failed to fetch objection scenarios');
  return res.json();
}

export async function runObjectionDrill(
  scenarioIdOrRequest: string | ObjectionDrillRequest,
  repResponseStr?: string
): Promise<{ success: boolean; data?: ObjectionDrillResponse; error?: string }> {
  const payload = typeof scenarioIdOrRequest === 'string'
    ? { scenarioId: scenarioIdOrRequest, repResponse: repResponseStr || '' }
    : scenarioIdOrRequest;

  const res = await fetch(`${API_BASE}/ai/objection-drill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to evaluate objection drill');
  }
  return res.json();
}

export async function getRoutePlan(date?: string): Promise<{ success: boolean; data: RoutePlanResponse }> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await fetch(`${API_BASE}/territory/route-plan${query}`);
  if (!res.ok) throw new Error('Failed to calculate route plan');
  return res.json();
}

export async function fetchFieldIntelligence(date?: string): Promise<{ success: boolean; data: { candidates: DoctorPriorityAssessment[]; deferredCandidates: DoctorPriorityAssessment[] } }> {
  const res = await fetch(`${API_BASE}/territory/field-intelligence${date ? `?date=${encodeURIComponent(date)}&includeIneligible=true` : '?includeIneligible=true'}`);
  if (!res.ok) throw new Error('Failed to calculate field intelligence');
  return res.json();
}

export async function fetchDailyRoutePlan(date?: string): Promise<{ success: boolean; data: DailyRoutePlan }> {
  const res = await fetch(`${API_BASE}/territory/daily-route-plan${date ? `?date=${encodeURIComponent(date)}` : ''}`);
  if (!res.ok) throw new Error('Failed to calculate daily route plan');
  return res.json();
}

export async function fetchPreVisitIntelligence(doctorId: string, date?: string): Promise<{ success: boolean; data: PreVisitIntelligence }> {
  const res = await fetch(`${API_BASE}/doctors/${doctorId}/pre-visit-intelligence${date ? `?date=${encodeURIComponent(date)}` : ''}`);
  if (!res.ok) throw new Error('Failed to load pre-visit intelligence');
  return res.json();
}

export async function fetchSampleInventory() {
  const res = await fetch(`${API_BASE}/samples/inventory`);
  if (!res.ok) throw new Error('Failed to fetch sample inventory');
  return res.json();
}

export async function issueSamples(payload: { doctorId: string; quantity: number; productId?: string; visitId?: string; notes?: string }) {
  const res = await fetch(`${API_BASE}/samples/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to issue samples');
  return res.json();
}

export async function fetchMonthlyTarget(month?: string) {
  const res = await fetch(`${API_BASE}/targets/monthly${month ? `?month=${encodeURIComponent(month)}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch monthly target');
  return res.json();
}

export async function updateMonthlyTarget(month: string, targetUnits: number) {
  const res = await fetch(`${API_BASE}/targets/monthly/${month}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUnits }) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to update monthly target');
  return res.json();
}

export async function fetchDoctorTimeline(doctorId: string) {
  const res = await fetch(`${API_BASE}/doctors/${doctorId}/timeline`);
  if (!res.ok) throw new Error('Failed to fetch doctor timeline');
  return res.json();
}

export async function fetchDoctorLifecycle(doctorId: string) {
  const res = await fetch(`${API_BASE}/doctors/${doctorId}/lifecycle`);
  if (!res.ok) throw new Error('Failed to fetch doctor lifecycle');
  return res.json();
}

export async function overrideDoctorLifecycle(doctorId: string, status: PrescriberLifecycleStatus, reason?: string) {
  const res = await fetch(`${API_BASE}/doctors/${doctorId}/lifecycle/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reason })
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to override doctor lifecycle');
  return res.json();
}

export async function fetchPatients(params?: { search?: string; status?: string; doctorId?: string; city?: string; acquisitionSource?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.status) query.append('status', params.status);
  if (params?.doctorId) query.append('doctorId', params.doctorId);
  if (params?.city) query.append('city', params.city);
  if (params?.acquisitionSource) query.append('acquisitionSource', params.acquisitionSource);

  const res = await fetch(`${API_BASE}/patients?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch patients');
  return res.json();
}

export async function fetchPatientById(id: string) {
  const res = await fetch(`${API_BASE}/patients/${id}`);
  if (!res.ok) throw new Error('Failed to fetch patient details');
  return res.json();
}

export async function createPatient(patientData: Partial<PatientCRM>) {
  const res = await fetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create patient');
  }
  return res.json();
}

export async function updatePatient(id: string, patientData: Partial<PatientCRM>) {
  const res = await fetch(`${API_BASE}/patients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update patient');
  }
  return res.json();
}

export async function fetchPatientTimeline(patientId: string) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/timeline`);
  if (!res.ok) throw new Error('Failed to fetch patient timeline');
  return res.json();
}

export async function fetchReferrals(params?: { doctorId?: string; patientId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.doctorId) query.append('doctorId', params.doctorId);
  if (params?.patientId) query.append('patientId', params.patientId);
  if (params?.status) query.append('status', params.status);

  const res = await fetch(`${API_BASE}/referrals?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch referrals');
  return res.json();
}

export async function createReferral(payload: Partial<DoctorPatientReferral>) {
  const res = await fetch(`${API_BASE}/referrals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create referral');
  }
  return res.json();
}

export async function fetchOrders(params?: { patientId?: string; orderStatus?: string; paymentStatus?: string }) {
  const query = new URLSearchParams();
  if (params?.patientId) query.append('patientId', params.patientId);
  if (params?.orderStatus) query.append('orderStatus', params.orderStatus);
  if (params?.paymentStatus) query.append('paymentStatus', params.paymentStatus);

  const res = await fetch(`${API_BASE}/orders?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function fetchSensors(params?: { patientId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.patientId) query.append('patientId', params.patientId);
  if (params?.status) query.append('status', params.status);

  const res = await fetch(`${API_BASE}/sensors?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch sensors');
  return res.json();
}
