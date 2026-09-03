import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Sparkles, 
  Phone, 
  TrendingUp, 
  ArrowRight, 
  AlertTriangle,
  Play, 
  Mic,
  ShieldCheck,
  Award,
  ChevronRight,
  Plus,
  FileText,
  Calendar
} from 'lucide-react';
import { Doctor, Visit, FollowupTask, AnonymousPatientOpportunity, DashboardBriefingData } from '../types';

interface MorningBriefingViewProps {
  briefingData: DashboardBriefingData;
  onOpenAICoach: (doctor: Doctor) => void;
  onOpenDoctorDetail: (doctor: Doctor) => void;
  onOpenVoiceNote: (doctor?: Doctor) => void;
  onScheduleVisit: () => void;
  onAddTask: () => void;
  onToggleTaskComplete: (taskId: string, currentStatus: boolean) => void;
  onUpdateVisitStatus: (visitId: string, status: string) => void;
  onOpenDayEndSummary?: () => void;
  onNavigateToPlanner?: () => void;
}

export const MorningBriefingView: React.FC<MorningBriefingViewProps> = ({
  briefingData,
  onOpenAICoach,
  onOpenDoctorDetail,
  onOpenVoiceNote,
  onScheduleVisit,
  onAddTask,
  onToggleTaskComplete,
  onUpdateVisitStatus,
  onOpenDayEndSummary,
  onNavigateToPlanner
}) => {
  if (!briefingData) return null;

  const {
    todayDate,
    stats,
    priorityCallOfTheMoment,
    todayVisitsQueue,
    urgentTasks,
    topTerritoryOpportunities
  } = briefingData;

  const {
    completedVisits,
    plannedVisitsToday,
    activePatientOpportunities,
    verifiedDoctorsCount
  } = stats;

  const targetDoc = priorityCallOfTheMoment?.doctor;
  const primaryPhone = targetDoc?.contacts?.find((c: any) => c.type === 'mobile' || c.type === 'whatsapp')?.value;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Territory Banner / Welcome */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 text-[#0ea5e9] border border-sky-100">
              Daily Field Intelligence • {todayDate}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              EvoCheck CGM Focus
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-[#0f172a] tracking-tight">
            Rawalpindi-East & Central Field Briefing
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Optimized route cluster: <strong>PWD ➔ Soan Garden ➔ Shifa International</strong>
          </p>
        </div>

        {/* Quick Actions CTAs */}
        <div className="flex items-center flex-wrap gap-2.5">
          {onOpenDayEndSummary && (
            <button
              id="open-day-end-summary-btn"
              onClick={onOpenDayEndSummary}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Day-End Summary (v1.1)</span>
            </button>
          )}
          <button
            onClick={() => onOpenVoiceNote(targetDoc)}
            className="px-4 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Mic className="w-4 h-4 text-red-400" />
            <span>1-Tap Voice Visit Note</span>
          </button>
        </div>
      </div>

      {/* Top 4 Geometric Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
              Today's Field Calls
            </span>
            <Clock className="w-3.5 h-3.5 text-[#0ea5e9]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#0f172a]">{completedVisits}</span>
            <span className="text-xs font-bold text-[#94a3b8]">/ {plannedVisitsToday} Planned</span>
          </div>
          <div className="mt-2 w-full bg-[#f1f5f9] h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#0ea5e9] h-full rounded-full transition-all" 
              style={{ width: `${(completedVisits / (plannedVisitsToday || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
              Active Leads (Zero-PII)
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600">{activePatientOpportunities}</span>
            <span className="text-xs font-bold text-[#64748b]">Patients</span>
          </div>
          <p className="text-[10px] text-[#64748b] mt-1">EvoCheck Trial & Sensor pipeline</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
              Priority A Route
            </span>
            <Award className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#0f172a]">{verifiedDoctorsCount}</span>
            <span className="text-xs font-bold text-[#64748b]">Target Endocrinologists</span>
          </div>
          <p className="text-[10px] text-[#64748b] mt-1">100% verified field schedules</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
              EvoCheck MARD
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#0ea5e9]">8.66%</span>
            <span className="text-xs font-bold text-[#64748b]">Verified Accuracy</span>
          </div>
          <p className="text-[10px] text-[#64748b] mt-1">Verified Product Specification</p>
        </div>
      </div>

      {/* Main Grid: Priority Call of the Moment + Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: Call of the Moment & Today's Schedule Queue */}
        <div className="lg:col-span-7 space-y-5">
          {/* Priority Call of the Moment Highlight Card or Empty State */}
          {priorityCallOfTheMoment && targetDoc ? (
            <div className="bg-white border-2 border-sky-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0ea5e9]">
                    Call of the Moment • {priorityCallOfTheMoment.scheduledTime}
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-50 text-[#0ea5e9] border border-sky-100">
                  Priority {targetDoc.priority} • Score {targetDoc.dailyPriorityScore}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#0f172a] hover:text-[#0ea5e9] cursor-pointer" onClick={() => onOpenDoctorDetail(targetDoc)}>
                    {targetDoc.name}
                  </h3>
                  <p className="text-xs text-[#64748b] font-medium mt-0.5">
                    {targetDoc.specialty} • {targetDoc.hospital}
                  </p>
                  <p className="text-xs text-[#334155] mt-2 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#0ea5e9]" />
                    <span>{targetDoc.clinic} ({targetDoc.area})</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase px-2 py-1 rounded bg-slate-100 text-[#0f172a]">
                    {targetDoc.prescriberStatus.replace('_', ' ')}
                  </span>
                  {targetDoc.paName && (
                    <p className="text-[11px] text-[#64748b] mt-1">PA: {targetDoc.paName}</p>
                  )}
                </div>
              </div>

              {/* Call Objective Callout */}
              <div className="p-3 bg-[#f0f9ff] border border-sky-100 rounded-xl text-xs space-y-1">
                <span className="text-[10px] font-bold text-[#0ea5e9] uppercase tracking-wider">
                  Today's Targeted Objective:
                </span>
                <p className="font-semibold text-[#0f172a]">
                  {priorityCallOfTheMoment.primaryObjective}
                </p>
              </div>

              {/* Instant Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => onOpenAICoach(targetDoc)}
                  className="flex-1 px-3.5 py-2 bg-[#0ea5e9] hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Pre-Visit Briefing</span>
                </button>
                {primaryPhone && (
                  <a
                    href={`tel:${primaryPhone}`}
                    className="px-3 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Call</span>
                  </a>
                )}
                <button
                  onClick={() => onOpenVoiceNote(targetDoc)}
                  className="px-3 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Voice Note</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-[#64748b]">
                <Calendar className="w-6 h-6 text-[#0ea5e9]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">No visits scheduled for today</h3>
                <p className="text-xs text-[#64748b] max-w-md mx-auto mt-1">
                  There are no consultation stops scheduled on your queue for {todayDate}. You can add a new stop or organize your day in the Field Planner.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-1">
                <button
                  onClick={onScheduleVisit}
                  className="px-4 py-2 bg-[#0ea5e9] hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Stop</span>
                </button>
                {onNavigateToPlanner && (
                  <button
                    onClick={onNavigateToPlanner}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0f172a] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Field Planner</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#64748b]" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Today's Field Visit Queue */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider">
                  Today's Field Schedule Queue
                </h3>
                <p className="text-xs text-[#64748b]">Route-ordered consultation visits</p>
              </div>
              <button
                onClick={onScheduleVisit}
                className="px-3 py-1.5 bg-[#f1f5f9] hover:bg-sky-50 hover:text-[#0ea5e9] text-[#475569] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stop</span>
              </button>
            </div>

            {todayVisitsQueue.length > 0 ? (
              <div className="space-y-2.5">
                {todayVisitsQueue.map((v: any) => (
                  <div
                    key={v.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      v.status === 'completed'
                        ? 'bg-slate-50 border-slate-200 opacity-75'
                        : v.status === 'in_progress'
                        ? 'bg-sky-50/70 border-[#0ea5e9]'
                        : 'bg-white border-[#e2e8f0] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        v.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-[#0f172a]'
                      }`}>
                        {v.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : v.scheduledTime.split(' ')[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 
                            onClick={() => v.doctor && onOpenDoctorDetail(v.doctor)}
                            className="text-xs font-bold text-[#0f172a] hover:text-[#0ea5e9] cursor-pointer"
                          >
                            {v.doctor?.name || 'Dr. Target'}
                          </h4>
                          <span className="text-[10px] font-bold text-[#64748b]">
                            {v.doctor?.area}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748b] truncate max-w-xs">
                          {v.doctor?.hospital}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {v.status === 'planned' && (
                        <button
                          onClick={() => onUpdateVisitStatus(v.id, 'in_progress')}
                          className="px-2.5 py-1 bg-sky-50 text-[#0ea5e9] hover:bg-sky-100 rounded text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Start Visit
                        </button>
                      )}
                      {v.status === 'in_progress' && (
                        <button
                          onClick={() => onUpdateVisitStatus(v.id, 'completed')}
                          className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Mark Done
                        </button>
                      )}
                      {v.doctor && (
                        <button
                          onClick={() => onOpenAICoach(v.doctor)}
                          className="p-1.5 text-[#64748b] hover:text-[#0ea5e9] rounded hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                          title="AI Pre-Visit Coach"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-[#cbd5e1] rounded-xl bg-[#f8fafc] space-y-2">
                <p className="text-xs font-medium text-[#64748b]">
                  No route-ordered visits found for {todayDate}.
                </p>
                <button
                  onClick={onScheduleVisit}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0ea5e9] hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stop to Schedule</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Tasks & Follow-ups + Top Patient Opportunities */}
        <div className="lg:col-span-5 space-y-5">
          {/* Urgent Follow-ups & Commitments */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider">
                  Field Commitments & Tasks
                </h3>
                <p className="text-xs text-[#64748b]">Urgent deliverables for doctors & PAs</p>
              </div>
              <button
                onClick={onAddTask}
                className="p-1.5 text-[#64748b] hover:text-[#0ea5e9] hover:bg-[#f1f5f9] rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {urgentTasks.map((t: any) => (
                <div
                  key={t.id}
                  className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl flex items-start justify-between gap-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => onToggleTaskComplete(t.id, t.isCompleted)}
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                        t.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {t.isCompleted && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                    <div>
                      <p className={`text-xs font-semibold leading-snug ${t.isCompleted ? 'line-through text-[#94a3b8]' : 'text-[#0f172a]'}`}>
                        {t.title}
                      </p>
                      <p className="text-[10px] text-[#64748b] mt-0.5">
                        Due: <strong>{t.dueDate}</strong> • For {t.doctorName}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                    t.priority === 'high' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Anonymous Patient Opportunities Spotlight */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider">
                  Anonymous Patient Pipeline
                </h3>
                <p className="text-xs text-[#64748b]">Zero-PII Tracked Sensor Installations</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                DRAP Safe
              </span>
            </div>

            <div className="space-y-2">
              {topTerritoryOpportunities.map((opp: any) => (
                <div key={opp.id} className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-[#0ea5e9]">
                        #{opp.anonymousPatientCode || opp.patientCode || opp.id}
                      </span>
                      <span className="text-[10px] font-bold text-[#0f172a]">
                        {opp.doctorName || 'Target Doctor'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748b] mt-0.5">
                      {opp.clinicalProfile || 'CGM Candidate'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {String(opp.stage || opp.status || 'opportunity').replace('_', ' ')}
                    </span>
                    <p className="text-[11px] font-bold text-[#0f172a] mt-1">
                      PKR {(opp.totalValue || opp.estimatedValuePKR || 0)?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
