import React from 'react';
import { 
  TrendingUp, 
  Plus, 
  ShieldCheck, 
  Package, 
  ArrowRight, 
  CheckCircle2,
  DollarSign,
  Layers
} from 'lucide-react';
import { AnonymousPatientOpportunity, Doctor } from '../types';
import { EVOCHECK_MASTER_KNOWLEDGE } from '../data/productKnowledge';

interface SalesFunnelViewProps {
  opportunities: AnonymousPatientOpportunity[];
  doctors: Doctor[];
  onAddOpportunity: () => void;
  onUpdateStage: (oppId: string, newStage: any) => void;
  onOpenDoctorDetail: (doctor: Doctor) => void;
}

export const SalesFunnelView: React.FC<SalesFunnelViewProps> = ({
  opportunities,
  doctors,
  onAddOpportunity,
  onUpdateStage,
  onOpenDoctorDetail
}) => {
  const stages: { id: AnonymousPatientOpportunity['status']; label: string; color: string }[] = [
    { id: 'recommended', label: 'Doctor Recommended', color: 'bg-sky-50 text-[#0ea5e9] border-sky-200' },
    { id: 'trial_scheduled', label: 'Trial Scheduled', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'sensor_installed', label: 'Sensor Installed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'reordered', label: 'Active Reorder', color: 'bg-purple-50 text-purple-700 border-purple-200' }
  ];

  const totalRevenuePKR = opportunities
    .filter(o => (o.stage === 'sensor_installed' || o.status === 'sensor_installed' || o.stage === 'reordered' || o.status === 'reordered'))
    .reduce((sum, o) => sum + (o.totalValue || o.estimatedValuePKR || 0), 0);

  const totalPotentialPKR = opportunities
    .reduce((sum, o) => sum + (o.totalValue || o.estimatedValuePKR || 0), 0);

  const totalUnits = opportunities.reduce((sum, o) => sum + (o.units || 1), 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Zero-PII Safe Architecture
            </span>
            <span className="text-xs text-[#64748b] font-medium">Anonymous Patient Leads (#P-xxx)</span>
          </div>
          <h2 className="text-xl font-bold text-[#0f172a] tracking-tight mt-1">
            Patient Pipeline & Sales Conversion Funnel
          </h2>
          <p className="text-xs text-[#64748b]">
            Track EvoCheck CGM unit flow from Doctor Recommendation to Trial Applicator and Repeat Sensors
          </p>
        </div>

        <button
          onClick={onAddOpportunity}
          className="px-4 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>New Patient Opportunity</span>
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4.5 rounded-2xl border border-[#e2e8f0] shadow-2xs">
          <span className="text-[10px] font-black uppercase text-[#64748b]">Realized Closed Revenue</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            PKR {totalRevenuePKR.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#64748b] mt-1">Installed & recurring sensor units</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-[#e2e8f0] shadow-2xs">
          <span className="text-[10px] font-black uppercase text-[#64748b]">Pipeline Opportunity Value</span>
          <p className="text-2xl font-black text-[#0f172a] mt-1">
            PKR {totalPotentialPKR.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#64748b] mt-1">All active leads across stages</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-[#e2e8f0] shadow-2xs">
          <span className="text-[10px] font-black uppercase text-[#64748b]">Active Sensor Units</span>
          <p className="text-2xl font-black text-[#0ea5e9] mt-1">
            {totalUnits} Units
          </p>
          <p className="text-[10px] text-[#64748b] mt-1">EvoCheck 15-day telemetric sensors</p>
        </div>
      </div>

      {/* Funnel Columns Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage) => {
          const stageOpps = opportunities.filter(o => o.status === stage.id || o.stage === stage.id);
          return (
            <div key={stage.id} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex flex-col min-h-[360px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e2e8f0]">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${stage.color}`}>
                    {stage.label}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#64748b]">
                  {stageOpps.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageOpps.map((opp) => {
                  const doc = doctors.find(d => d.id === opp.doctorId);
                  const code = opp.anonymousPatientCode || opp.patientCode;
                  const defaultUnitPrice = EVOCHECK_MASTER_KNOWLEDGE.pricing.distributor_price?.amount || 12900;
                  const value = opp.totalValue || opp.estimatedValuePKR || ((opp.units || 1) * defaultUnitPrice);

                  return (
                    <div
                      key={opp.id}
                      className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs space-y-2 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-[#0ea5e9]">
                          #{code}
                        </span>
                        <span className="text-[11px] font-bold text-[#0f172a]">
                          PKR {value.toLocaleString()}
                        </span>
                      </div>

                      {doc && (
                        <p 
                          onClick={() => onOpenDoctorDetail(doc)}
                          className="text-xs font-semibold text-[#334155] hover:text-[#0ea5e9] cursor-pointer"
                        >
                          {doc.name}
                        </p>
                      )}

                      <p className="text-[11px] text-[#64748b] leading-tight">
                        {opp.clinicalProfile}
                      </p>

                      <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between">
                        <span className="text-[10px] text-[#94a3b8]">
                          {opp.units} Unit • 14 Days
                        </span>

                        {/* Stage transition buttons */}
                        {stage.id === 'recommended' && (
                          <button
                            onClick={() => onUpdateStage(opp.id, 'trial_scheduled')}
                            className="text-[10px] font-bold text-[#0ea5e9] hover:underline cursor-pointer"
                          >
                            Schedule Trial ➔
                          </button>
                        )}
                        {stage.id === 'trial_scheduled' && (
                          <button
                            onClick={() => onUpdateStage(opp.id, 'sensor_installed')}
                            className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                          >
                            Install ➔
                          </button>
                        )}
                        {stage.id === 'sensor_installed' && (
                          <button
                            onClick={() => onUpdateStage(opp.id, 'reordered')}
                            className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer"
                          >
                            Reorder ➔
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {stageOpps.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#94a3b8]">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
