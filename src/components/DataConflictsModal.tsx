import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, Layers, Loader2 } from 'lucide-react';
import { DataConflict } from '../types';
import { resolveConflict } from '../services/api';

interface DataConflictsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: DataConflict[];
  onResolved: () => void;
}

export const DataConflictsModal: React.FC<DataConflictsModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onResolved
}) => {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResolve = async (conflictId: string, resolution: 'accepted_incoming' | 'retained_current') => {
    try {
      setResolvingId(conflictId);
      setError(null);
      const res = await resolveConflict(conflictId, resolution);
      if (res.success) {
        onResolved();
      } else {
        setError(res.error || 'Failed to update conflict');
      }
    } catch (err: any) {
      setError(err.message || 'Error resolving conflict');
    } finally {
      setResolvingId(null);
    }
  };

  const activeConflicts = conflicts.filter(c => c.status === 'unresolved');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">
                Data Provenance & Conflict Resolution
              </h3>
              <p className="text-xs text-[#64748b]">
                Non-Destructive Ingestion: Prevent AI or Web Sources from overwriting verified field data
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8fafc]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {error}
            </div>
          )}

          {activeConflicts.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-[#0f172a]">All Field Records Fully Synchronized</h4>
              <p className="text-xs text-[#64748b] max-w-sm mx-auto">
                No active discrepancies between field-verified data and web research.
              </p>
            </div>
          ) : (
            activeConflicts.map((conf) => (
              <div key={conf.id} className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Discrepancy Detected • {conf.fieldName}
                    </span>
                    <h4 className="text-sm font-bold text-[#0f172a] mt-1">
                      {conf.doctorName}
                    </h4>
                  </div>
                  <span className="text-[10px] text-[#64748b]">
                    Entity: {conf.entityType}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Current Verified Value */}
                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        Current Verified Value
                      </span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                        Trusted
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-emerald-950 mt-1">
                      {conf.currentVerifiedValue}
                    </p>
                  </div>

                  {/* Incoming Conflicting Value */}
                  <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                        Incoming Value
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                        {conf.incomingSource.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-amber-950 mt-1">
                      {conf.incomingValue}
                    </p>
                  </div>
                </div>

                {/* Resolution Actions */}
                <div className="pt-2 border-t border-[#f1f5f9] flex flex-col sm:flex-row items-center justify-end gap-2">
                  <button
                    onClick={() => handleResolve(conf.id, 'retained_current')}
                    disabled={resolvingId === conf.id}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-[#f1f5f9] hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-[#e2e8f0] text-[#475569] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Retain Verified Current
                  </button>
                  <button
                    onClick={() => handleResolve(conf.id, 'accepted_incoming')}
                    disabled={resolvingId === conf.id}
                    className="w-full sm:w-auto px-4 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {resolvingId === conf.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span>Accept & Update Record</span>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-[#e2e8f0] flex items-center justify-between text-[11px] text-[#64748b]">
          <span>Audit Log: Every resolution is timestamped and recorded.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] rounded-lg font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
