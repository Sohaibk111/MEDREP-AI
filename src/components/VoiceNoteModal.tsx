import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  Square, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Edit3, 
  Plus, 
  Trash2, 
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Doctor, VoiceNoteExtraction } from '../types';
import { extractVoiceNote, commitVoiceNote } from '../services/api';

interface VoiceNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDoctor: Doctor | null;
  doctorsList: Doctor[];
  onCommitted: () => void;
}

export const VoiceNoteModal: React.FC<VoiceNoteModalProps> = ({
  isOpen,
  onClose,
  defaultDoctor,
  doctorsList,
  onCommitted
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(defaultDoctor ? defaultDoctor.id : '');
  const [loading, setLoading] = useState<boolean>(false);
  const [extraction, setExtraction] = useState<VoiceNoteExtraction | null>(null);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultDoctor) {
        setSelectedDoctorId(defaultDoctor.id);
      } else if (doctorsList.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(doctorsList[0].id);
      }
      setExtraction(null);
      setSuccessMessage(null);
      setError(null);
      setTranscript('');
      setIsRecording(false);
      setRecordDuration(0);
    }
  }, [isOpen, defaultDoctor]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordDuration(0);
    setError(null);
    setSuccessMessage(null);
    setTranscript('');
    setExtraction(null);

    // Simulate real speech capture stream if Web Speech is not active
    setTimeout(() => {
      const docName = doctorsList.find(d => d.id === selectedDoctorId)?.name || 'Dr. Jamal Ahmed';
      setTranscript(
        `Visited ${docName} at OPD today. Presented EvoCheck 15-day continuous telemetry and highlighted the verified 8.66% MARD study. The doctor was very interested in continuous glucose alerts for brittle diabetic patients. He agreed to trial a 15-day sensor for an adolescent Type 1 patient. Requested to deliver a demo kit to his clinic coordinator by Wednesday.`
      );
    }, 2500);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleRunAIExtraction = async () => {
    if (!transcript.trim()) {
      setError('Please record or enter a visit voice note first.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await extractVoiceNote(transcript, selectedDoctorId);
      if (res.success) {
        setExtraction(res.data);
      } else {
        setError(res.error || 'Failed to extract structured data');
      }
    } catch (err: any) {
      setError(err.message || 'Error processing AI extraction');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitToCRM = async () => {
    if (!extraction) return;
    try {
      setIsCommitting(true);
      setError(null);
      const res = await commitVoiceNote(extraction);
      if (res.success) {
        setSuccessMessage('Voice note successfully verified and committed to CRM!');
        setTimeout(() => {
          onCommitted();
          onClose();
        }, 1200);
      } else {
        setError(res.error || 'Failed to commit to CRM');
      }
    } catch (err: any) {
      setError(err.message || 'Error saving to CRM');
    } finally {
      setIsCommitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0f172a] rounded-lg flex items-center justify-center text-white font-bold">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">
                Voice Visit Note Assistant
              </h3>
              <p className="text-xs text-[#64748b]">
                1-Tap Record • AI Structured Extraction • Staging & Review
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
          {/* Target Doctor Selector */}
          <div className="bg-white p-3.5 rounded-xl border border-[#e2e8f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
            <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
              Associated Doctor:
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="text-xs font-bold text-[#0f172a] bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#0ea5e9] w-full sm:w-auto"
            >
              {doctorsList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty} • {d.hospital})
                </option>
              ))}
            </select>
          </div>

          {/* Recording / Voice Input Console */}
          <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-sm text-center">
            {isRecording ? (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-center gap-1.5 h-10">
                  <div className="w-1.5 h-8 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-12 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <div className="w-1.5 h-10 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                  <div className="w-1.5 h-7 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                </div>
                <div>
                  <p className="text-lg font-black text-red-600 tracking-wider">
                    {formatTime(recordDuration)}
                  </p>
                  <p className="text-xs text-[#64748b] font-medium">
                    Listening to post-visit notes in English / Urdu...
                  </p>
                </div>
                <button
                  onClick={handleStopRecording}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer transition-transform active:scale-95"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>STOP RECORDING</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleStartRecording}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2.5 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <Mic className="w-4 h-4 text-white" />
                  <span>TAP TO RECORD VOICE NOTE</span>
                </button>
                <p className="text-[11px] text-[#94a3b8] font-semibold">
                  Or edit/paste the transcribed text below:
                </p>
              </div>
            )}

            {/* Transcript Text Area */}
            <div className="mt-4 text-left">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Say or type e.g.: 'Dr. Jamal was impressed with EvoCheck 15-day wear and verified 8.66% MARD. Agreed to trial Type 1 adolescent. Deliver demonstration kit to clinic coordinator by Wednesday.'"
                rows={3}
                className="w-full text-xs text-[#0f172a] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 focus:outline-none focus:border-[#0ea5e9] placeholder:text-[#94a3b8]"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-[#64748b]">
                  {transcript.length} characters
                </span>
                <button
                  onClick={handleRunAIExtraction}
                  disabled={loading || !transcript.trim()}
                  className="px-4 py-1.5 bg-[#0ea5e9] hover:bg-sky-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analyze & Structure Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* AI Structured Extraction Staging Card */}
          {extraction && (
            <div className="bg-white p-5 rounded-2xl border-2 border-sky-300 shadow-md space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">
                    Extracted CRM Entities (Review Staging)
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Confidence: {Math.round(extraction.confidence * 100)}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
                  <span className="text-[10px] font-bold text-[#64748b] uppercase">Doctor & Interest</span>
                  <p className="font-bold text-[#0f172a] mt-0.5">
                    {extraction.doctorName}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-100 text-[#0ea5e9]">
                    Interest: {extraction.interestLevel.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
                  <span className="text-[10px] font-bold text-[#64748b] uppercase">Product Discussed</span>
                  <p className="font-bold text-[#0f172a] mt-0.5">
                    {extraction.productDiscussed}
                  </p>
                  <span className="text-[10px] text-[#64748b]">15-Day Wear • 8.66% MARD</span>
                </div>
              </div>

              {/* Discussion Points */}
              <div>
                <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                  Key Discussion Points
                </span>
                <ul className="mt-1 space-y-1 text-xs text-[#334155]">
                  {extraction.keyDiscussionPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#0ea5e9] font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Objections */}
              {extraction.objectionsRaised && extraction.objectionsRaised.length > 0 && (
                <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl">
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
                    Objections Captured
                  </span>
                  {extraction.objectionsRaised.map((obj, i) => (
                    <div key={i} className="mt-1 text-xs text-red-950 font-medium">
                      <p><strong>{obj.category}:</strong> {obj.detail}</p>
                      {obj.responseGiven && (
                        <p className="text-emerald-800 text-[11px] mt-0.5">↳ <em>Response: {obj.responseGiven}</em></p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Anonymous Patient Opportunity Generated */}
              {extraction.patientOpportunity && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      New Anonymous Patient Opportunity (#P-xxx)
                    </span>
                    <p className="text-xs font-bold text-emerald-950 mt-0.5">
                      {extraction.patientOpportunity.clinicalProfile} ({extraction.patientOpportunity.units} Unit)
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-600 text-white rounded">
                    Zero-PII Safe
                  </span>
                </div>
              )}

              {/* Action Items / Follow-ups */}
              {extraction.actionItems && extraction.actionItems.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                    Auto-Generated Follow-up Tasks
                  </span>
                  <div className="mt-1 space-y-1.5">
                    {extraction.actionItems.map((task, i) => (
                      <div key={i} className="p-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg flex items-center justify-between text-xs font-medium text-[#0f172a]">
                        <span>{task.title}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky-50 text-[#0ea5e9] rounded">
                          Due in {task.dueInDays} days
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Visit Objective */}
              {extraction.nextVisitObjective && (
                <div className="p-2.5 bg-[#f1f5f9] rounded-lg text-xs">
                  <span className="text-[10px] font-bold text-[#64748b] uppercase">Next Call Objective:</span>
                  <p className="font-semibold text-[#0f172a] mt-0.5">
                    {extraction.nextVisitObjective}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-[#e2e8f0] flex items-center justify-between gap-3">
          <p className="text-[11px] text-[#64748b]">
            Review before committing to preserve verified CRM records.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCommitToCRM}
              disabled={!extraction || isCommitting}
              className="px-5 py-2 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {isCommitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Committing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Approve & Commit to CRM</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
