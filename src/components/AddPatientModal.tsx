import React, { useState } from 'react';
import { X, UserPlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Doctor, PatientAcquisitionSource, PatientCRMStatus } from '../types';
import { createPatient } from '../services/api';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  defaultDoctorId?: string;
  onPatientAdded: () => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  doctors,
  defaultDoctorId,
  onPatientAdded
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Rawalpindi');
  const [doctorId, setDoctorId] = useState(defaultDoctorId || '');
  const [acquisitionSource, setAcquisitionSource] = useState<PatientAcquisitionSource>('DOCTOR_REFERRAL');
  const [status, setStatus] = useState<PatientCRMStatus>('LEAD');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Patient name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!city.trim()) {
      setError('City is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || undefined,
        email: email.trim() || undefined,
        city: city.trim(),
        doctorId: doctorId || undefined,
        acquisitionSource,
        status
      };

      const res = await createPatient(payload);
      if (!res.success) {
        throw new Error(res.error || 'Failed to create patient');
      }

      onPatientAdded();
      onClose();
      // Reset form
      setName('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setCity('Rawalpindi');
      setDoctorId('');
      setAcquisitionSource('DOCTOR_REFERRAL');
      setStatus('LEAD');
    } catch (err: any) {
      setError(err.message || 'Error adding patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sky-50 text-[#0ea5e9] rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">Register New Patient</h3>
              <p className="text-[11px] text-[#64748b]">Add a patient record to the MedRep CRM foundation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#f1f5f9] flex items-center justify-center text-[#64748b] hover:text-[#0f172a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          <div>
            <label className="block text-[11px] font-bold text-[#475569] mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Tariq Mehmood"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-1">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. +92 300 1234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-1">WhatsApp</label>
              <input
                type="text"
                placeholder="Optional"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Optional"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-1">City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rawalpindi"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#475569] mb-1">Referring Doctor</label>
            <select
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
            >
              <option value="">-- Direct Patient (No Doctor) --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  Dr. {d.name} ({d.specialty} - {d.hospital})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-1">Acquisition Source</label>
              <select
                value={acquisitionSource}
                onChange={e => setAcquisitionSource(e.target.value as PatientAcquisitionSource)}
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
              >
                <option value="DOCTOR_REFERRAL">Doctor Referral</option>
                <option value="META_AD">Meta Ad</option>
                <option value="MY_GLUCO_GUIDE">MyGlucoGuide</option>
                <option value="WEBSITE">Website</option>
                <option value="ECOMMERCE">E-Commerce</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
                <option value="EXISTING_PATIENT">Existing Patient</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-1">Initial Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as PatientCRMStatus)}
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
              >
                <option value="LEAD">Lead</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="REFERRED">Referred</option>
                <option value="PURCHASED">Purchased</option>
                <option value="ACTIVE">Active (Sensor On)</option>
                <option value="RENEWAL_DUE">Renewal Due</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#f1f5f9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0f172a] rounded-lg font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Register Patient</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
