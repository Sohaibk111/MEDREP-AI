import {
  Doctor,
  Visit,
  FollowupTask,
  AnonymousPatientOpportunity,
  WeeklyFieldPlan,
  DataConflict,
  VoiceNoteExtraction,
  AICoachBriefing
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
