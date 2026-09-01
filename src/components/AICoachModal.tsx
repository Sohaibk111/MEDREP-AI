import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  HelpCircle, 
  ShieldAlert, 
  Volume2, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Doctor, AICoachBriefing } from '../types';
import { fetchAICoachBriefing } from '../services/api';

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onStartVisit: (doctor: Doctor) => void;
  onOpenVoiceNote: (doctor: Doctor) => void;
}

export const AICoachModal: React.FC<AICoachModalProps> = ({
  isOpen,
  onClose,
  doctor,
  onStartVisit,
  onOpenVoiceNote
}) => {
  const [briefing, setBriefing] = useState<AICoachBriefing | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && doctor) {
      loadBriefing(doctor.id);
    } else {
      setBriefing(null);
    }
  }, [isOpen, doctor?.id]);

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

  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0ea5e9] rounded-lg flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0f172a]">
                  Pre-Visit AI Briefing
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-50 text-[#0ea5e9] border border-sky-100">
                  Priority {doctor.priority}
                </span>
              </div>
              <p className="text-xs text-[#64748b] font-medium">
                {doctor.name} • {doctor.specialty} • {doctor.hospital}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#f1f5f9] flex items-center justify-center text-[#64748b] hover:text-[#0f172a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#f8fafc]">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#0ea5e9] animate-spin" />
              <p className="text-sm font-bold text-[#0f172a]">Analyzing Doctor Profile & Clinical Data...</p>
              <p className="text-xs text-[#64748b] max-w-sm">
                Evaluating previous visit responses, MARD claims, and formulating non-deceptive, compliant sales objectives.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {error}
            </div>
          ) : briefing ? (
            <>
              {/* Doctor Importance & Target Objective */}
              <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
                    Doctor Target Objective
                  </span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    [RECOMMENDATION]
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#0f172a] leading-relaxed">
                  {briefing.todayObjective.content}
                </p>
                <div className="mt-2.5 pt-2 border-t border-[#f1f5f9] text-xs text-[#64748b]">
                  <span className="font-bold text-[#0f172a]">[FACT]:</span> {briefing.whyImportant.content}
                </div>
              </div>

              {/* Suggested Opening Dialogue */}
              <div className="bg-[#0ea5e9] p-4 rounded-xl text-white shadow-md shadow-sky-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-100">
                    Suggested Call Opening
                  </span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/20 text-white">
                    [RECOMMENDATION]
                  </span>
                </div>
                <p className="text-sm font-medium italic leading-relaxed">
                  {briefing.suggestedOpening.content}
                </p>
              </div>

              {/* Key Product Points (EvoCheck Evidence) */}
              <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
                    Approved Clinical Talking Points
                  </span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-sky-50 text-[#0ea5e9] border border-sky-100">
                    [FACT]
                  </span>
                </div>
                <ul className="space-y-2">
                  {briefing.keyProductPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#334155] font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#0ea5e9] shrink-0 mt-0.5" />
                      <span>{pt.content}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Objections & Evidence-based Rebuttal */}
              <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
                    Anticipated Objections & Compliant Rebuttals
                  </span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    [INFERENCE]
                  </span>
                </div>
                <div className="space-y-3">
                  {briefing.possibleObjections.map((obj, idx) => (
                    <div key={idx} className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                      <p className="text-xs font-bold text-red-600 mb-1">
                        Objection: "{obj.objection}"
                      </p>
                      <p className="text-xs font-medium text-[#334155]">
                        <strong className="text-emerald-600">Response:</strong> {obj.suggestedResponse}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avoid & Focus Compliance Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-red-700 font-bold text-[10px] uppercase tracking-wider mb-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>What NOT to Say (Compliance)</span>
                  </div>
                  <ul className="space-y-1 text-xs text-red-900 font-medium">
                    {briefing.whatNotToSay.map((w, i) => (
                      <li key={i}>• {w.content}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[10px] uppercase tracking-wider mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Suggested Closing Ask</span>
                  </div>
                  <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                    {briefing.suggestedClose.content}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-[#64748b]">
            Grounding Source: <strong>EvoCheck MARD Technical Dossier</strong>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onOpenVoiceNote(doctor);
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Record Voice Note
            </button>
            <button
              onClick={() => {
                onClose();
                onStartVisit(doctor);
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Execute Visit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
