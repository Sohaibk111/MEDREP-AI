import React, { useState } from 'react';
import { X, CalendarPlus, CheckCircle2, Loader2 } from 'lucide-react';
import { Doctor } from '../types';
import { createVisit } from '../services/api';

interface AddVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  defaultDoctor: Doctor | null;
  onVisitScheduled: () => void;
}

export const AddVisitModal: React.FC<AddVisitModalProps> = ({
  isOpen,
  onClose,
  doctors,
  defaultDoctor,
  onVisitScheduled
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState(defaultDoctor ? defaultDoctor.id : (doctors[0]?.id || ''));
  const [scheduledDate, setScheduledDate] = useState('2026-09-01');
  const [scheduledTime, setScheduledTime] = useState('11:00 AM');
  const [objectiveText, setObjectiveText] = useState('Present EvoCheck 15-day wear & 8.66% MARD clinical specification');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setError('Please select a target doctor.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createVisit({
        doctorId: selectedDoctorId,
        scheduledDate,
        scheduledTime,
        objectives: [
          { id: `obj-${Date.now()}`, text: objectiveText, isAchieved: false }
        ]
      });
      onVisitScheduled();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0ea5e9] rounded-lg flex items-center justify-center text-white font-bold">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">
                Schedule Field Call
              </h3>
              <p className="text-xs text-[#64748b]">
                Add to Daily Field Route & Planner
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#f8fafc]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
              Select Target Doctor *
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty} • {d.area})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Time Slot *
              </label>
              <input
                type="text"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="11:00 AM"
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
              Call Objective
            </label>
            <textarea
              rows={2}
              value={objectiveText}
              onChange={(e) => setObjectiveText(e.target.value)}
              placeholder="What is your primary goal for this call?"
              className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl p-3 focus:outline-none focus:border-[#0ea5e9]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>Schedule Call</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
