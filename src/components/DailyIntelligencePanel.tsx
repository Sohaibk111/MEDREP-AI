import React, { useEffect, useState } from 'react';
import { fetchDailyRoutePlan, fetchPreVisitIntelligence } from '../services/api';
import { DailyRoutePlan, PreVisitIntelligence } from '../types';

export const DailyIntelligencePanel: React.FC = () => {
  const [plan, setPlan] = useState<DailyRoutePlan | null>(null);
  const [detail, setDetail] = useState<PreVisitIntelligence | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { fetchDailyRoutePlan().then(r => setPlan(r.data)).catch(e => setError(e.message)); }, []);
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs">{error}</div>;
  if (!plan) return <div className="p-6 bg-white rounded-xl text-xs text-slate-500">Loading daily field intelligence…</div>;
  const open = async (doctorId: string) => setDetail((await fetchPreVisitIntelligence(doctorId, plan.date)).data);
  return <div className="space-y-4">
    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900"><strong>Area-based sequencing only.</strong> {plan.limitations[0]}</div>
    <div className="bg-white p-4 rounded-xl border border-slate-200"><h3 className="font-bold">Daily Intelligence — {plan.date}</h3><p className="text-xs text-slate-500 mt-1">Scheduled visits stay fixed; recommendations are read-only.</p></div>
    {plan.immutableScheduledStops.map(stop => <div key={stop.visitId} className="p-4 bg-white rounded-xl border border-slate-200 text-sm"><strong>Scheduled: {stop.doctorName}</strong><span className="ml-2 text-xs">{stop.plannedTime} · {stop.priorityReason}</span></div>)}
    {plan.recommendedStops.map(stop => <button key={stop.doctorId} onClick={() => open(stop.doctorId)} className="w-full text-left p-4 bg-white rounded-xl border border-sky-200 hover:bg-sky-50"><div className="flex justify-between"><strong>#{stop.routeSequence} {stop.doctorId}</strong><span className="text-sky-700 font-bold">Score {stop.score}</span></div><p className="text-xs mt-1">{stop.nextBestAction.type.replaceAll('_', ' ')} — {stop.nextBestAction.objective}</p><p className="text-[11px] text-slate-500 mt-1">{stop.reasons.filter(r => r.points > 0).slice(0, 3).map(r => r.label).join(' • ')}</p></button>)}
    {plan.deferredCandidates.length > 0 && <p className="text-xs text-slate-500">Deferred: {plan.deferredCandidates.length} doctor(s) have no recorded calling window today.</p>}
    {detail && <div className="p-4 bg-slate-900 text-white rounded-xl"><button className="float-right text-xs" onClick={() => setDetail(null)}>Close</button><h3 className="font-bold">Pre-Visit Intelligence: {detail.doctor.name}</h3><p className="text-sm mt-2">{detail.recommendedObjective.objective}</p><p className="text-xs mt-2">Lifecycle: {detail.lifecycle} · Journey: {detail.journey}</p><p className="text-xs mt-2">Last interaction: {detail.lastInteraction?.title || 'No recorded interaction'}</p><p className="text-xs mt-2">Data gaps: {detail.dataGaps.join(', ') || 'None'}</p></div>}
  </div>;
};
