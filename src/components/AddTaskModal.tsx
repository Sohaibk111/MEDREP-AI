import React, { useState } from 'react';
import { X, CheckSquare, CheckCircle2, Loader2 } from 'lucide-react';
import { Doctor } from '../types';
import { createFollowup } from '../services/api';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  onTaskCreated: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  doctors,
  onTaskCreated
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('2026-09-02');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please describe the follow-up task.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createFollowup({
        doctorId: selectedDoctorId,
        title,
        dueDate,
        priority
      });
      onTaskCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
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
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">
                New Follow-up Task
              </h3>
              <p className="text-xs text-[#64748b]">
                Action Item & Doctor Commitment
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
              Associated Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty} • {d.hospital})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
              Task Description *
            </label>
            <textarea
              required
              rows={2}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deliver dummy applicator kit & patient onboarding brochure to PA Tariq"
              className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl p-3 focus:outline-none focus:border-[#0ea5e9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
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
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Save Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
