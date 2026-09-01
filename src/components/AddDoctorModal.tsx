import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { Doctor } from '../types';
import { createDoctor } from '../services/api';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDoctorAdded: () => void;
}

export const AddDoctorModal: React.FC<AddDoctorModalProps> = ({
  isOpen,
  onClose,
  onDoctorAdded
}) => {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('Endocrinology');
  const [hospital, setHospital] = useState('');
  const [clinic, setClinic] = useState('');
  const [area, setArea] = useState('PWD');
  const [priority, setPriority] = useState<'A' | 'B' | 'C'>('B');
  const [phone, setPhone] = useState('');
  const [paName, setPaName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hospital.trim()) {
      setError('Please provide doctor name and hospital/facility.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createDoctor({
        name,
        specialty,
        hospital,
        clinic: clinic || `${hospital} OPD`,
        area,
        city: 'Rawalpindi',
        priority,
        prescriberStatus: 'prospect',
        cgmPotential: priority === 'A' ? 'high' : 'medium',
        affordabilityTier: 'upper_middle',
        relationshipStrength: 1,
        potentialScore: priority === 'A' ? 88 : 70,
        dailyPriorityScore: priority === 'A' ? 85 : 65,
        paName,
        contacts: phone ? [{ id: `c-${Date.now()}`, type: 'mobile', value: phone, isPrimary: true, isVerified: true }] : [],
        timings: [
          {
            id: `t-${Date.now()}`,
            locationName: hospital,
            dayOfWeek: 1,
            dayName: 'Monday',
            startTime: '10:00 AM',
            endTime: '02:00 PM',
            timingType: 'opd',
            source: 'field_verified'
          }
        ],
        notes,
        isVerified: true
      });
      onDoctorAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0ea5e9] rounded-lg flex items-center justify-center text-white font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">
                Add Doctor to Field CRM
              </h3>
              <p className="text-xs text-[#64748b]">
                Record with Field-Verified Provenance
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8fafc]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
              Doctor Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Asadullah Khan"
              className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Specialty *
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              >
                <option value="Endocrinology">Endocrinology</option>
                <option value="Diabetology">Diabetology</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Nephrology">Nephrology</option>
                <option value="Internal Medicine">Internal Medicine</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Priority Tier
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              >
                <option value="A">Priority A (High Potential CGM)</option>
                <option value="B">Priority B (Medium Potential)</option>
                <option value="C">Priority C (Prospect)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Hospital / Facility *
              </label>
              <input
                type="text"
                required
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                placeholder="e.g. Shifa International / PWD MediCenter"
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Territory Area
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              >
                <option value="PWD">PWD</option>
                <option value="Soan Garden">Soan Garden</option>
                <option value="Saidpur Road">Saidpur Road</option>
                <option value="Commercial Market">Commercial Market</option>
                <option value="6th Road">6th Road</option>
                <option value="PIMS">PIMS</option>
                <option value="Shifa International">Shifa International</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Doctor Phone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                PA / Gatekeeper Name
              </label>
              <input
                type="text"
                value={paName}
                onChange={(e) => setPaName(e.target.value)}
                placeholder="e.g. Asif (OPD Coordinator)"
                className="w-full text-xs text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
              Field Notes / Initial Impression
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial consultation setup, patient profile, receptivity..."
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
                  <span>Saving to CRM...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Save Verified Doctor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
