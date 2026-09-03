import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  Calendar, 
  Package, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { Doctor, Visit, VisitOutcomeType } from '../types';
import { logVisitOutcome } from '../services/api';

interface LogVisitOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: Visit | null;
  doctor: Doctor | null;
  onOutcomeLogged: () => void;
}

const OUTCOME_OPTIONS: { type: VisitOutcomeType; label: string; badge: string; description: string }[] = [
  { 
    type: 'TRIAL_STARTED', 
    label: 'Trial Started (Sensor Applied)', 
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Doctor initiated trial with a patient or staff member.'
  },
  { 
    type: 'SAMPLE_PROVIDED', 
    label: 'Sample Kit Provided', 
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'Handed over demo or evaluation sensor unit.'
  },
  { 
    type: 'CONVERTED', 
    label: 'Prescription Commitment (Converted)', 
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Doctor agreed to start actively prescribing EvoCheck.'
  },
  { 
    type: 'FOLLOW_UP_SCHEDULED', 
    label: 'Follow-up Scheduled', 
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Agreed on next appointment or AGP trial data review.'
  },
  { 
    type: 'CME_INVITED', 
    label: 'CME / Symposium Invited', 
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Doctor invited to clinical continuous education event.'
  },
  { 
    type: 'PRICE_OBJECTION', 
    label: 'Price Objection Raised', 
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Doctor or patient expressed affordability concerns.'
  },
  { 
    type: 'CLINICAL_OBJECTION', 
    label: 'Clinical / Accuracy Objection', 
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'Inquired about MARD, sensor accuracy, or clinical data.'
  },
  { 
    type: 'COMPETITOR_PREFERENCE', 
    label: 'Competitor Preference (Libre / SIBIONICS)', 
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Currently prefers another CGM platform.'
  },
  { 
    type: 'NO_INTEREST', 
    label: 'No Current Interest', 
    badge: 'bg-red-50 text-red-700 border-red-200',
    description: 'Doctor declined CGM adoption at this time.'
  },
  { 
    type: 'LOGGED', 
    label: 'General Detail Call Completed', 
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
    description: 'Standard product presentation delivered.'
  }
];

export const LogVisitOutcomeModal: React.FC<LogVisitOutcomeModalProps> = ({
  isOpen,
  onClose,
  visit,
  doctor,
  onOutcomeLogged
}) => {
  const [selectedType, setSelectedType] = useState<VisitOutcomeType>('TRIAL_STARTED');
  const [notes, setNotes] = useState('');
  const [samplesCount, setSamplesCount] = useState<number>(1);
  const [committedUnits, setCommittedUnits] = useState<number>(0);
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !visit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await logVisitOutcome(visit.id, {
        outcomeType: selectedType,
        notes: notes.trim() || undefined,
        samplesCount: selectedType === 'SAMPLE_PROVIDED' || selectedType === 'TRIAL_STARTED' ? samplesCount : undefined,
        committedUnits: selectedType === 'CONVERTED' ? committedUnits : undefined,
        followUpDate: followUpDate || undefined
      });

      if (res.success) {
        onOutcomeLogged();
        onClose();
      } else {
        setError('Failed to record outcome');
      }
    } catch (err: any) {
      setError(err.message || 'Error logging visit outcome');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 text-[#0ea5e9] border border-sky-100">
                v1.1 Field Outcome Logging
              </span>
              <span className="text-xs text-[#64748b]">Visit: {visit.id}</span>
            </div>
            <h3 className="text-base font-bold text-[#0f172a] mt-0.5">
              Log Visit Outcome — {doctor?.name || visit.doctor?.name || 'Doctor'}
            </h3>
            <p className="text-xs text-[#64748b]">
              {doctor?.specialty || visit.doctor?.specialty} • {doctor?.hospital || visit.doctor?.hospital}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#94a3b8] hover:text-[#0f172a] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Outcome Type Selector */}
          <div>
            <label className="block text-xs font-bold text-[#0f172a] uppercase tracking-wider mb-2">
              Primary Call Outcome *
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {OUTCOME_OPTIONS.map((opt) => (
                <label
                  key={opt.type}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    selectedType === opt.type
                      ? 'border-[#0ea5e9] bg-[#f0f9ff] ring-1 ring-[#0ea5e9]'
                      : 'border-[#e2e8f0] hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="outcomeType"
                      value={opt.type}
                      checked={selectedType === opt.type}
                      onChange={() => setSelectedType(opt.type)}
                      className="mt-0.5 text-[#0ea5e9] focus:ring-[#0ea5e9]"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#0f172a]">{opt.label}</p>
                      <p className="text-[11px] text-[#64748b] mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${opt.badge}`}>
                    {opt.type.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional Fields based on outcome */}
          {(selectedType === 'SAMPLE_PROVIDED' || selectedType === 'TRIAL_STARTED') && (
            <div>
              <label className="block text-xs font-bold text-[#0f172a] mb-1">
                Samples / Demo Units Provided
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={samplesCount}
                onChange={(e) => setSamplesCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-xl focus:border-[#0ea5e9] focus:outline-none"
              />
            </div>
          )}

          {selectedType === 'CONVERTED' && (
            <div>
              <label className="block text-xs font-bold text-[#0f172a] mb-1">
                Committed Prescribed Units (Sensors)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={committedUnits}
                onChange={(e) => setCommittedUnits(parseInt(e.target.value) || 0)}
                placeholder="e.g. 5 sensors for OPD clinic"
                className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-xl focus:border-[#0ea5e9] focus:outline-none"
              />
            </div>
          )}

          {/* Follow-up Date */}
          <div>
            <label className="block text-xs font-bold text-[#0f172a] mb-1">
              Scheduled Follow-up Date (Optional)
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-xl focus:border-[#0ea5e9] focus:outline-none"
            />
          </div>

          {/* Clinical Discussion Notes */}
          <div>
            <label className="block text-xs font-bold text-[#0f172a] mb-1">
              Field Observations & Prescriber Feedback
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Doctor showed interest in 15-day continuous wear for gestational diabetes patient. Scheduled follow-up next Tuesday."
              className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-xl focus:border-[#0ea5e9] focus:outline-none resize-none"
            />
          </div>

          {/* Grounding reminder */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-[#64748b]">
            <p className="font-semibold text-[#0f172a]">Commercial & Regulatory Note:</p>
            <p>Quotes must remain grounded in authorized distributor (PKR 12,900) or public retail (PKR 13,600). Do not record unverified discount commitments.</p>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#64748b] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#0ea5e9] hover:bg-sky-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging Outcome...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Outcome & Advance Journey</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
