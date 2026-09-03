import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  HelpCircle, 
  Mic, 
  Play, 
  ArrowRight, 
  Loader2,
  ChevronDown,
  Target,
  Swords,
  MessageSquare,
  Send,
  Bot
} from 'lucide-react';
import { Doctor, AICoachBriefing } from '../types';
import { fetchAICoachBriefing, sendAIChatQuery } from '../services/api';
import { ObjectionDrillPractice } from '../components/ObjectionDrillPractice';

interface AICoachFullViewProps {
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  onSelectDoctor: (doctor: Doctor) => void;
  onOpenVoiceNote: (doctor: Doctor) => void;
  onScheduleVisit: (doctor: Doctor) => void;
}

export const AICoachFullView: React.FC<AICoachFullViewProps> = ({
  doctors,
  selectedDoctor,
  onSelectDoctor,
  onOpenVoiceNote,
  onScheduleVisit
}) => {
  const [activeTab, setActiveTab] = useState<'briefing' | 'drill' | 'chat'>('briefing');
  const [activeDoc, setActiveDoc] = useState<Doctor | null>(selectedDoctor || doctors[0] || null);
  const [briefing, setBriefing] = useState<AICoachBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat mode state
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: 'Hello! I am your MedRep AI Field Assistant. Ask me anything regarding your Rawalpindi/Islamabad doctors, OPD timings, EvoCheck CGM evidence, route planning, or objection rebuttals.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleSendChat = async (queryText?: string) => {
    const textToSend = queryText || chatInput;
    if (!textToSend.trim()) return;

    const newMsgs = [...chatMessages, { role: 'user' as const, text: textToSend }];
    setChatMessages(newMsgs);
    if (!queryText) setChatInput('');

    try {
      setChatLoading(true);
      const res = await sendAIChatQuery(textToSend);
      if (res.success && res.text) {
        setChatMessages([...newMsgs, { role: 'assistant', text: res.text }]);
      } else {
        setChatMessages([...newMsgs, { role: 'assistant', text: 'Unable to retrieve answer. Please check network connection.' }]);
      }
    } catch (err: any) {
      setChatMessages([...newMsgs, { role: 'assistant', text: `Error: ${err.message || 'Could not query assistant'}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDoctor) {
      setActiveDoc(selectedDoctor);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (activeDoc && activeTab === 'briefing') {
      loadBriefing(activeDoc.id);
    }
  }, [activeDoc?.id, activeTab]);

  const loadBriefing = async (doctorId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAICoachBriefing(doctorId);
      if (res.success) {
        setBriefing(res.data);
      } else {
        setError(res.error || 'Failed to generate briefing');
      }
    } catch (err: any) {
      setError(err.message || 'Error generating AI briefing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Navigation Tabs for Coach Modes */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3.5 rounded-2xl border border-[#e2e8f0] shadow-xs">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            id="tab-briefing-mode"
            onClick={() => setActiveTab('briefing')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'briefing'
                ? 'bg-white text-[#0ea5e9] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Pre-Visit Call Briefing</span>
          </button>
          <button
            id="tab-drill-mode"
            onClick={() => setActiveTab('drill')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'drill'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Objection Drill Arena (v1.1)</span>
          </button>
          <button
            id="tab-chat-mode"
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Territory AI Chat</span>
          </button>
        </div>

        {activeTab === 'briefing' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
              Target Doctor:
            </label>
            <select
              value={activeDoc?.id || ''}
              onChange={(e) => {
                const doc = doctors.find((d) => d.id === e.target.value);
                if (doc) {
                  setActiveDoc(doc);
                  onSelectDoctor(doc);
                }
              }}
              className="text-xs font-bold text-[#0f172a] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#0ea5e9]"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty} • Priority {d.priority})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeTab === 'drill' ? (
        <ObjectionDrillPractice />
      ) : (
        <>
          {/* Header with Selector */}
          <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 text-[#0ea5e9] border border-sky-100">
                  Field Intelligence Engine
                </span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  DRAP-Compliant Clinical Grounding
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#0f172a] tracking-tight mt-1">
                AI Pre-Visit Call Coach
              </h2>
              <p className="text-xs text-[#64748b]">
                Objective Formulation • Opening Lines • Objection Handling • Strict Non-Deceptive Rules
              </p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-16 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#0ea5e9] animate-spin" />
              <p className="text-sm font-bold text-[#0f172a]">Formulating Evidence-Based Pre-Call Briefing...</p>
              <p className="text-xs text-[#64748b] max-w-md">
                Querying EvoCheck verified 8.66% MARD data, doctor relationship history, and compliance guardrails.
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-xs font-medium">
              {error}
            </div>
          ) : briefing && activeDoc ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Objectives & Openings */}
              <div className="lg:col-span-7 space-y-4">
                {/* Today's Target Objective Card */}
                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
                      Call Target Objective
                    </span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      [RECOMMENDATION]
                    </span>
                  </div>
                  <p className="text-base font-bold text-[#0f172a] leading-relaxed">
                    {briefing.todayObjective.content}
                  </p>
                  <div className="pt-2 border-t border-[#f1f5f9] text-xs text-[#64748b]">
                    <strong className="text-[#0f172a]">[FACT]:</strong> {briefing.whyImportant.content}
                  </div>
                </div>

                {/* Suggested Opening Dialogue */}
                <div className="bg-[#0ea5e9] p-5 rounded-2xl text-white shadow-md shadow-sky-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-100">
                      Suggested Call Opening
                    </span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/20 text-white">
                      [RECOMMENDATION]
                    </span>
                  </div>
                  <p className="text-sm font-medium italic leading-relaxed">
                    "{briefing.suggestedOpening.content}"
                  </p>
                </div>

                {/* Approved Clinical Talking Points (Facts) */}
                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
                      Verified EvoCheck Product Evidence
                    </span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-sky-50 text-[#0ea5e9] border border-sky-100">
                      [FACT]
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    {briefing.keyProductPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-[#334155] font-medium">
                        <CheckCircle2 className="w-4 h-4 text-[#0ea5e9] shrink-0 mt-0.5" />
                        <span>{pt.content}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Closing Ask */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Suggested Closing Call to Action</span>
                  </div>
                  <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                    {briefing.suggestedClose.content}
                  </p>
                </div>
              </div>

              {/* Right Column: Objections, Questions, Compliance */}
              <div className="lg:col-span-5 space-y-4">
                {/* Objection Rebuttal Matrix */}
                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
                      Anticipated Doctor Objections
                    </span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      [INFERENCE]
                    </span>
                  </div>

                  <div className="space-y-3">
                    {briefing.possibleObjections.map((obj, i) => (
                      <div key={i} className="p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl space-y-1 text-xs">
                        <p className="font-bold text-red-600">
                          Objection: "{obj.objection}"
                        </p>
                        <p className="text-[#334155] font-medium">
                          <strong className="text-emerald-600">Rebuttal:</strong> {obj.suggestedResponse}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Guardrails (What NOT to Say) */}
                <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-red-700 font-bold text-[10px] uppercase tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>What NOT to Say (Strict Compliance)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-red-950 font-medium">
                    {briefing.whatNotToSay.map((w, i) => (
                      <li key={i}>• {w.content}</li>
                    ))}
                  </ul>
                </div>

                {/* Quick Action Footer for Active Call */}
                <div className="p-4 bg-[#0f172a] rounded-2xl text-white space-y-3">
                  <p className="text-xs font-semibold text-slate-300">
                    Ready to execute visit with <strong>{activeDoc.name}</strong>?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenVoiceNote(activeDoc)}
                      className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5 text-red-400" />
                      <span>Voice Note</span>
                    </button>
                    <button
                      onClick={() => onScheduleVisit(activeDoc)}
                      className="flex-1 py-2 bg-[#0ea5e9] hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Plan Next Stop</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-5 flex flex-col h-[560px] animate-in fade-in duration-200">
          <div className="pb-3 border-b border-[#e2e8f0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0f172a]">Territory AI Field Assistant</h4>
                <p className="text-xs text-[#64748b]">Grounded in Rawalpindi/Islamabad CRM, OPD Schedules & EvoCheck CGM Truth</p>
              </div>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="py-2.5 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-400 font-bold shrink-0">Quick Ask:</span>
            {[
              'Who should I visit in PWD today?',
              'How do I handle Dr. Jamal’s price objection?',
              'EvoCheck vs FreeStyle Libre specs',
              'Summarize doctor potential in Satellite Town'
            ].map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendChat(p)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-[#0ea5e9] text-slate-700 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    AI
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#0ea5e9] text-white font-medium'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#0ea5e9]" />
                <span>Consulting territory database & clinical facts...</span>
              </div>
            )}
          </div>

          {/* Chat input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="pt-3 border-t border-[#e2e8f0] flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about doctors, pricing, route optimization, or clinical arguments..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-[#e2e8f0] rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0ea5e9]"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2.5 bg-[#0ea5e9] hover:bg-sky-600 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

