import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  ArrowRight,
  Navigation,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { WeeklyFieldPlan, Doctor } from '../types';

interface FieldPlannerViewProps {
  plannerData: WeeklyFieldPlan | null;
  onOpenAICoach: (doctor: Doctor) => void;
  onOpenDoctorDetail: (doctor: Doctor) => void;
  onAddStop: () => void;
}

export const FieldPlannerView: React.FC<FieldPlannerViewProps> = ({
  plannerData,
  onOpenAICoach,
  onOpenDoctorDetail,
  onAddStop
}) => {
  const [selectedDay, setSelectedDay] = useState<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'>('monday');

  if (!plannerData) return null;

  const dayPlan = plannerData.days[selectedDay];
  const daysList: { id: typeof selectedDay; label: string; date: string }[] = [
    { id: 'monday', label: 'Mon', date: 'Sep 01' },
    { id: 'tuesday', label: 'Tue', date: 'Sep 02' },
    { id: 'wednesday', label: 'Wed', date: 'Sep 03' },
    { id: 'thursday', label: 'Thu', date: 'Sep 04' },
    { id: 'friday', label: 'Fri', date: 'Sep 05' },
    { id: 'saturday', label: 'Sat', date: 'Sep 06' }
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 text-[#0ea5e9] border border-sky-100">
              {plannerData.weekIdentifier}
            </span>
            <span className="text-xs text-[#64748b] font-semibold">
              Route Optimization Active
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#0f172a] tracking-tight mt-1">
            Weekly Field Route & Territory Planner
          </h2>
          <p className="text-xs text-[#64748b]">
            Clustered by Geographic Zone to minimize transit time across Rawalpindi & Islamabad
          </p>
        </div>

        <button
          onClick={onAddStop}
          className="px-4 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-sky-400" />
          <span>Add Stop to Route</span>
        </button>
      </div>

      {/* Day Selector Buttons */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {daysList.map((d) => {
          const isSelected = selectedDay === d.id;
          const plan = plannerData.days[d.id];
          return (
            <button
              key={d.id}
              onClick={() => setSelectedDay(d.id)}
              className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-sm'
                  : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-slate-300'
              }`}
            >
              <p className="text-xs font-black uppercase">{d.label}</p>
              <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-sky-300' : 'text-[#94a3b8]'}`}>
                {d.date}
              </p>
              <span className={`mt-2 inline-block text-[9px] font-bold px-1.5 py-0.2 rounded ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {plan?.stops?.length || 0} Stops
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Overview */}
      {dayPlan && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 4 Cols: Cluster info & summary */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0ea5e9]">
                  Zone Cluster
                </span>
                <h3 className="text-base font-bold text-[#0f172a] mt-0.5">
                  {dayPlan.routeClusterName}
                </h3>
                <p className="text-xs text-[#64748b] mt-1">
                  Target Coverage: <strong>{dayPlan.targetArea}</strong>
                </p>
              </div>

              <div className="p-3 bg-[#f0f9ff] border border-sky-100 rounded-xl space-y-1.5 text-xs text-[#0f172a]">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748b]">Total Planned Stops:</span>
                  <span className="font-bold">{dayPlan.stops.length} Doctors</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748b]">Est. Transit Savings:</span>
                  <span className="font-bold text-emerald-600">~45 mins (Clustered)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#f1f5f9]">
                <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
                  Specialist Guidance
                </span>
                <p className="text-xs text-[#334155] mt-1 leading-relaxed">
                  Start in PWD at 10:00 AM before moving to Soan Garden to avoid afternoon bottleneck traffic on Islamabad Expressway.
                </p>
              </div>
            </div>
          </div>

          {/* Right 8 Cols: Route Sequence of Stops */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                Sequence of Consultations & Stops ({dayPlan.stops.length})
              </h3>
              <span className="text-[11px] text-[#0ea5e9] font-bold">
                Optimized by OPD Start Hours
              </span>
            </div>

            <div className="space-y-3">
              {dayPlan.stops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="bg-white border border-[#e2e8f0] hover:border-sky-300 rounded-xl p-4.5 shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-[#0f172a] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 
                          onClick={() => stop.doctor && onOpenDoctorDetail(stop.doctor)}
                          className="text-sm font-bold text-[#0f172a] hover:text-[#0ea5e9] cursor-pointer"
                        >
                          {stop.doctor?.name || 'Dr. Field Call'}
                        </h4>
                        <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded bg-sky-50 text-[#0ea5e9] border border-sky-100">
                          Priority {stop.doctor?.priority}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        {stop.doctor?.specialty} • {stop.hospitalName}
                      </p>
                      <p className="text-xs text-[#334155] mt-1 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#0ea5e9]" />
                        <span>Slot: {stop.preferredTimeSlot}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f1f5f9]">
                    {stop.doctor && (
                      <button
                        onClick={() => onOpenAICoach(stop.doctor)}
                        className="px-3 py-1.5 bg-[#f0f9ff] hover:bg-sky-100 text-[#0ea5e9] border border-sky-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Pre-Call Coach</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
