import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  UserPlus,
  Phone,
  MapPin,
  Activity,
  ShoppingBag,
  Users,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { PatientCRM, Doctor, PatientCRMStatus, PatientAcquisitionSource } from '../types';
import { fetchPatients } from '../services/api';

interface PatientCRMViewProps {
  doctors: Doctor[];
  onOpenPatientDetail: (patientId: string) => void;
  onOpenDoctorDetail: (doctor: Doctor) => void;
  onAddPatient: () => void;
}

export const PatientCRMView: React.FC<PatientCRMViewProps> = ({
  doctors,
  onOpenPatientDetail,
  onOpenDoctorDetail,
  onAddPatient
}) => {
  const [patients, setPatients] = useState<PatientCRM[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');

  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await fetchPatients();
      if (res.success && res.data) {
        setPatients(res.data);
      }
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q)) ||
      (p.city && p.city.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      p.patientId.toLowerCase().includes(q);

    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
    const matchesSource = selectedSource === 'all' || p.acquisitionSource === selectedSource;
    const matchesDoctor = selectedDoctorId === 'all' || p.doctorId === selectedDoctorId;

    return matchesSearch && matchesStatus && matchesSource && matchesDoctor;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#0f172a] tracking-tight">
            Patient CRM Directory
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            EvoCheck CGM patient lifecycles, doctor referrals, active sensor renewals & orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPatients}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 border border-[#e2e8f0] text-[#64748b] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Refresh patient records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0ea5e9]' : ''}`} />
          </button>
          <button
            onClick={onAddPatient}
            className="px-3.5 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Patient</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patients by name, phone, city, email or patient ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0ea5e9] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#64748b]" />
            <span className="text-[11px] font-bold text-[#64748b] uppercase">Filters:</span>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-medium text-[#0f172a] focus:outline-none focus:border-[#0ea5e9]"
          >
            <option value="all">All CRM Statuses</option>
            <option value="LEAD">Lead</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="REFERRED">Referred</option>
            <option value="PURCHASED">Purchased</option>
            <option value="ACTIVE">Active (Sensor On)</option>
            <option value="RENEWAL_DUE">Renewal Due</option>
            <option value="RENEWED">Renewed</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LOST">Lost</option>
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-medium text-[#0f172a] focus:outline-none focus:border-[#0ea5e9]"
          >
            <option value="all">All Acquisition Sources</option>
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

          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-medium text-[#0f172a] focus:outline-none focus:border-[#0ea5e9]"
          >
            <option value="all">All Referring Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                Dr. {d.name} ({d.specialty})
              </option>
            ))}
          </select>

          {(searchQuery || selectedStatus !== 'all' || selectedSource !== 'all' || selectedDoctorId !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setSelectedSource('all');
                setSelectedDoctorId('all');
              }}
              className="text-xs text-[#0ea5e9] hover:underline font-bold"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-xs text-[#64748b]">
            Showing <strong className="text-[#0f172a]">{filteredPatients.length}</strong> of {patients.length} patients
          </div>
        </div>
      </div>

      {/* Patient Directory List */}
      {loading && patients.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-8 h-8 text-[#0ea5e9] animate-spin" />
          <p className="text-xs text-[#64748b]">Loading patient CRM database...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#e2e8f0] space-y-2">
          <Users className="w-10 h-10 text-[#94a3b8] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#0f172a]">No patients match your criteria</h3>
          <p className="text-xs text-[#64748b] max-w-sm mx-auto">
            Try adjusting your search terms or filters, or register a new patient.
          </p>
          <button
            onClick={onAddPatient}
            className="mt-2 px-4 py-2 bg-sky-50 text-[#0ea5e9] hover:bg-sky-100 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const doc = patient.doctorId ? doctors.find(d => d.id === patient.doctorId || d.doctorId === patient.doctorId) : null;
            return (
              <div
                key={patient.patientId}
                onClick={() => onOpenPatientDetail(patient.patientId)}
                className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#0f172a] group-hover:text-[#0ea5e9] transition-colors">
                        {patient.name}
                      </h4>
                      <p className="text-[11px] font-mono text-[#64748b]">
                        ID: {patient.patientId}
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      patient.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      patient.status === 'RENEWAL_DUE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      patient.status === 'PURCHASED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      patient.status === 'REFERRED' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {patient.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-[#64748b]">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#94a3b8]" />
                      <span>{patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#94a3b8]" />
                      <span>{patient.city}</span>
                    </div>
                  </div>

                  {doc ? (
                    <div className="pt-2 border-t border-[#f1f5f9] text-[11px]">
                      <span className="text-[#94a3b8]">Referring Doctor:</span>
                      <p className="font-bold text-[#0f172a] hover:text-[#0ea5e9]">
                        Dr. {doc.name} ({doc.hospital})
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[#f1f5f9] text-[11px] text-[#94a3b8]">
                      Direct patient (No doctor referral)
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs font-bold text-[#0ea5e9]">
                  <span>View Patient 360</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
