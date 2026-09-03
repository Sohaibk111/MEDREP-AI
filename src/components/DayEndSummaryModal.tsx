import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
  Award,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Package,
  Users,
  Clock,
  ArrowRight
} from 'lucide-react';
import { getDayEndSummary } from '../services/api';
import { DayEndSummaryReport } from '../types';

interface DayEndSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate?: string;
}

export const DayEndSummaryModal: React.FC<DayEndSummaryModalProps> = ({
  isOpen,
  onClose,
  targetDate
}) => {
  const [report, setReport] = useState<DayEndSummaryReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'text'>('visual');

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await getDayEndSummary(targetDate);
      if (res.success && res.data) {
        setReport(res.data);
      }
    } catch (err) {
      console.error('Failed to load day-end summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSummary();
    }
  }, [isOpen, targetDate]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!report) return;
    const text = report.exportableTextFormat || report.executiveSummaryText;
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch (e) {
      console.warn('Clipboard write prevented:', e);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      id="day-end-summary-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        id="day-end-summary-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Territory Day-End Summary</h2>
                <span className="text-xs bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-2 py-0.5 rounded-full font-medium">
                  v1.1 Operational
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Target Date: <span className="font-semibold text-white">{report?.date || targetDate || 'Today'}</span> • Territory: Rawalpindi-East & Islamabad
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="refresh-day-end-summary-btn"
              onClick={loadSummary}
              disabled={loading}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh Summary"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-day-end-summary-btn"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Sub-Header Tabs & Actions */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-lg">
            <button
              id="tab-visual-summary"
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'visual'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Interactive Dashboard
            </button>
            <button
              id="tab-text-summary"
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'text'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manager Export Text
            </button>
          </div>

          <button
            id="copy-day-end-summary-btn"
            onClick={handleCopy}
            disabled={loading || !report}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
              copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 shadow-sm'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied to Clipboard!' : 'Copy Formatted Report'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm font-medium">Aggregating CRM calls, opportunities, and doctor outcomes...</p>
            </div>
          ) : !report ? (
            <div className="py-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-medium">No activity data found for {targetDate}</p>
            </div>
          ) : activeTab === 'text' ? (
            /* Plain Text Copy Mode */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Direct structured plain text (ideal for WhatsApp / Email daily reporting to Territory Managers):</span>
                <span>{report.exportableTextFormat.length} characters</span>
              </div>
              <textarea
                readOnly
                value={report.exportableTextFormat}
                className="w-full h-[400px] p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl border border-slate-700 shadow-inner focus:outline-none select-all"
              />
            </div>
          ) : (
            /* Visual Interactive Dashboard Mode */
            <div className="space-y-6">
              {/* KPI Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <div className="flex items-center justify-between text-indigo-600 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Completed Calls</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-indigo-950">
                    {report?.metrics?.completedVisits ?? 0} <span className="text-xs text-indigo-600 font-medium">/ {report?.metrics?.totalPlannedVisits ?? 0}</span>
                  </div>
                  <p className="text-[11px] text-indigo-600/80 mt-0.5">
                    {(report?.metrics?.totalPlannedVisits ?? 0) > 0
                      ? `${Math.round(((report?.metrics?.completedVisits ?? 0) / (report?.metrics?.totalPlannedVisits ?? 1)) * 100)}% route completion`
                      : '0 planned'}
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="flex items-center justify-between text-emerald-600 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Patient Trials</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-emerald-950">{report?.metrics?.trialsStarted ?? 0}</div>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">{report?.metrics?.samplesProvided ?? 0} demo samples given</p>
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                  <div className="flex items-center justify-between text-amber-600 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Pipeline Committed</span>
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-amber-950">{report?.metrics?.totalCommittedUnits ?? 0} <span className="text-xs font-semibold">units</span></div>
                  <p className="text-[11px] text-amber-700/80 mt-0.5">PKR {(report?.metrics?.totalPipelineValuePKR ?? 0).toLocaleString()}</p>
                </div>

                <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl">
                  <div className="flex items-center justify-between text-sky-600 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Follow-ups Due</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-sky-950">{(report?.outstandingFollowups || []).length}</div>
                  <p className="text-[11px] text-sky-700/80 mt-0.5">{report?.metrics?.cmeInvitations ?? 0} CME invites logged</p>
                </div>
              </div>

              {/* Completed Calls List */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Doctor Call Logs & Outcomes
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {report.completedVisitDetails.length} calls logged
                  </span>
                </div>

                {report.completedVisitDetails.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No visits marked completed for this date yet.</p>
                ) : (
                  <div className="space-y-2">
                    {report.completedVisitDetails.map((call, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">Dr. {call.doctorName}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                              {call.hospitalClinic} • {call.area}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{call.notes}</p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 whitespace-nowrap">
                            {call.outcomeType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notable Objections & Action Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Objections */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Field Objections & Counterpoints
                  </h3>
                  {report.notableObjections.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">Zero critical objections reported today.</p>
                  ) : (
                    <div className="space-y-2">
                      {report.notableObjections.map((obj, i) => (
                        <div key={i} className="p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs space-y-1">
                          <div className="font-semibold text-amber-950 flex items-center justify-between">
                            <span>Dr. {obj.doctorName}</span>
                            <span className="text-[10px] text-amber-800 font-medium">{obj.category}</span>
                          </div>
                          <p className="text-amber-900">"{obj.detail}"</p>
                          {obj.responseGiven && (
                            <p className="text-[11px] text-amber-800 font-mono bg-amber-100/70 p-1.5 rounded mt-1">
                              Response: {obj.responseGiven}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Priority Follow-ups */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Priority Next-Day Follow-ups
                  </h3>
                  {report.outstandingFollowups.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">All follow-ups are up to date.</p>
                  ) : (
                    <div className="space-y-2">
                      {report.outstandingFollowups.map((task, i) => (
                        <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 block">Dr. {task.doctorName}</span>
                            <span className="text-slate-600 text-[11px]">{task.title}</span>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold block mb-0.5">
                              Due: {task.dueDate}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase">{task.priority} Priority</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Report ID: <span className="font-mono text-slate-700">{report?.summaryId || 'N/A'}</span>
          </div>
          <button
            id="modal-close-action-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
