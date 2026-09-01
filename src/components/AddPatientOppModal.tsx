import React, { useState } from 'react';
import { X, TrendingUp, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { Doctor } from '../types';
import { createPatientOpportunity } from '../services/api';
import { EVOCHECK_MASTER_KNOWLEDGE } from '../data/productKnowledge';

interface AddPatientOppModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  onOppCreated: () => void;
}

export const AddPatientOppModal: React.FC<AddPatientOppModalProps> = ({
  isOpen,
  onClose,
  doctors,
  onOppCreated
}) => {
  const defaultDistributorPrice = EVOCHECK_MASTER_KNOWLEDGE.pricing.distributor_price?.amount || 12900;
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [anonymousPatientCode, setAnonymousPatientCode] = useState(`P-${Math.floor(100 + Math.random() * 900)}`);
  const [clinicalProfile, setClinicalProfile] = useState('Type 1 Brittle Diabetes / Nocturnal Hypoglycemia');
  const [units, setUnits] = useState(1);
  const [unitPrice, setUnitPrice] = useState(defaultDistributorPrice);
  const [stage, setStage] = useState<'recommended' | 'trial_scheduled' | 'sensor_installed' | 'reordered'>('recommended');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anonymousPatientCode.trim()) {
      setError('Please provide an anonymous code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createPatientOpportunity({
        doctorId: selectedDoctorId,
        anonymousPatientCode,
        clinicalProfile,
        stage,
        units,
        unitPrice,
        totalValue: units * unitPrice,
        notes: 'Created by Specialist via Field CRM'
      });
      onOppCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create patient opportunity');
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
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">
                New Patient Opportunity
              </h3>
              <p className="text-xs text-[#64748b] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Zero-PII Anonymous Tracking</span>
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
              Prescribing / Recommending Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.hospital})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Anonymous Code *
              </label>
              <input
                type="text"
                required
                value={anonymousPatientCode}
                onChange={(e) => setAnonymousPatientCode(e.target.value)}
                placeholder="P-105"
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Pipeline Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              >
                <option value="recommended">Recommended</option>
                <option value="trial_scheduled">Trial Scheduled</option>
                <option value="sensor_installed">Sensor Installed</option>
                <option value="reordered">Active Reorder</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
              Clinical Profile
            </label>
            <input
              type="text"
              required
              value={clinicalProfile}
              onChange={(e) => setClinicalProfile(e.target.value)}
              placeholder="e.g. Type 2 on MDI with HbA1c > 9.0"
              className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Units
              </label>
              <input
                type="number"
                min="1"
                value={units}
                onChange={(e) => setUnits(parseInt(e.target.value) || 1)}
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Price (PKR)
              </label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseInt(e.target.value) || 0)}
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              />
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Create Opportunity (PKR {(units * unitPrice).toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
