import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  UserCheck, 
  AlertCircle,
  TrendingUp,
  Award,
  ChevronRight,
  ShieldCheck,
  Mic
} from 'lucide-react';
import { Doctor } from '../types';

interface DoctorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onOpenAICoach: (d: Doctor) => void;
  onOpenVoiceNote: (d: Doctor) => void;
  onScheduleVisit: (d: Doctor) => void;
}

export const DoctorDetailModal: React.FC<DoctorDetailModalProps> = ({
  isOpen,
  onClose,
  doctor,
  onOpenAICoach,
  onOpenVoiceNote,
  onScheduleVisit
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'timings' | 'history'>('overview');

  if (!isOpen || !doctor) return null;

  const primaryPhone = doctor.contacts.find(c => c.type === 'mobile' || c.type === 'whatsapp')?.value;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0ea5e9] rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm">
              {doctor.name.replace('Prof. ', '').replace('Dr. ', '').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0f172a]">
                  {doctor.name}
                </h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  doctor.priority === 'A' 
                    ? 'bg-sky-50 text-[#0ea5e9] border border-sky-200' 
                    : doctor.priority === 'B'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  Priority {doctor.priority}
                </span>
                {doctor.isVerified && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" title="Field-Verified by Specialist">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748b] font-medium">
                {doctor.specialty} • {doctor.hospital} • {doctor.area}
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

        {/* Action Toolbar */}
        <div className="px-6 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeSubTab === 'overview' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Overview & Scoring
            </button>
            <button
              onClick={() => setActiveSubTab('timings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeSubTab === 'timings' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              OPD Timings ({doctor.timings.length})
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeSubTab === 'history' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Visits ({doctor.totalVisitsCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {primaryPhone && (
              <a
                href={`tel:${primaryPhone}`}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-[#e2e8f0] text-[#0f172a] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Call</span>
              </a>
            )}
            <button
              onClick={() => {
                onClose();
                onOpenAICoach(doctor);
              }}
              className="px-3 py-1.5 bg-[#f0f9ff] hover:bg-sky-100 border border-sky-200 text-[#0ea5e9] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Coach Briefing</span>
            </button>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#f8fafc]">
          {activeSubTab === 'overview' && (
            <div className="space-y-4">
              {/* Dual Metric Scores: Factual Potential vs Daily Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-[#64748b]">Factual Potential</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-[#0f172a]">{doctor.potentialScore}</span>
                    <span className="text-xs text-[#94a3b8]">/ 100</span>
                  </div>
                  <p className="text-[10px] text-[#64748b] mt-1">Based on specialty, hospital tier & patient profile</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-[#64748b]">Today's Priority Rank</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-[#0ea5e9]">{doctor.dailyPriorityScore}</span>
                    <span className="text-xs text-[#94a3b8]">/ 100</span>
                  </div>
                  <p className="text-[10px] text-[#64748b] mt-1">Calculated via last visit gap & active opportunities</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-[#64748b]">Prescriber Status</span>
                  <div className="mt-1.5">
                    <span className="text-xs font-black uppercase px-2.5 py-1 rounded bg-slate-100 text-[#0f172a] border border-slate-200 inline-block">
                      {doctor.prescriberStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748b] mt-2">
                    Relationship: {'★'.repeat(doctor.relationshipStrength)}{'☆'.repeat(5 - doctor.relationshipStrength)}
                  </p>
                </div>
              </div>

              {/* Clinic & Gatekeeper Information */}
              <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Clinic & Gatekeeper Access
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#334155]">
                  <div>
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Hospital / Facility</span>
                    <p className="font-bold text-[#0f172a]">{doctor.hospital}</p>
                    <p className="text-[#64748b]">{doctor.clinic}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">PA / Reception Coordinator</span>
                    <p className="font-bold text-[#0f172a]">{doctor.paName || 'Direct Contact'}</p>
                    <p className="text-[#64748b]">{doctor.paContact || 'No direct phone logged'}</p>
                  </div>
                </div>
              </div>

              {/* Clinical Notes & Objections */}
              <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Specialist Field Notes & Historical Objections
                </h4>
                <p className="text-xs text-[#334155] leading-relaxed">
                  {doctor.notes || 'No custom notes added.'}
                </p>
                {doctor.recentObjections && doctor.recentObjections.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#f1f5f9]">
                    <span className="text-[10px] font-bold text-red-600 uppercase">Known Objections:</span>
                    <ul className="mt-1 space-y-1 text-xs text-red-950">
                      {doctor.recentObjections.map((obj, i) => (
                        <li key={i}>• {obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'timings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Verified OPD Schedule & Consulting Slots
                </h4>
                <span className="text-[10px] text-[#64748b]">Source: Field Verification</span>
              </div>
              <div className="space-y-2">
                {doctor.timings.map((t) => (
                  <div key={t.id} className="p-3.5 bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0ea5e9] flex items-center justify-center font-bold text-xs">
                        {t.dayName.substring(0, 3)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0f172a]">{t.dayName} • {t.startTime} - {t.endTime}</p>
                        <p className="text-[11px] text-[#64748b]">{t.locationName}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {t.timingType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'history' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                Past Visits Summary
              </h4>
              <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0f172a]">Total Visits: {doctor.totalVisitsCount}</span>
                  <span className="text-[#64748b]">Last Visited: {doctor.lastVisitedDate || 'Never'}</span>
                </div>
                <p className="text-[#64748b] leading-relaxed">
                  Detailed visit notes are parsed through the AI Voice Note recorder and staged for provenance approval.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-[#64748b]">
            Doctor ID: <span className="font-mono text-[#0f172a]">{doctor.id}</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onOpenVoiceNote(doctor);
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Note</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onScheduleVisit(doctor);
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Schedule Next Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
