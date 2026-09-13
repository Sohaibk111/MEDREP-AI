import React, { useState, useEffect } from 'react';
import { 
  X, 
  Phone, 
  MapPin, 
  Clock, 
  Sparkles, 
  Calendar, 
  ShieldCheck,
  Mic,
  Users,
  History,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Save,
  Power,
  RotateCcw,
  Loader2,
  ExternalLink,
  Tag,
  Building2,
  User,
  Activity,
  ShoppingBag,
  Clock3
} from 'lucide-react';
import { Doctor, DoctorTimelineEvent, ReferredPatientSummary, DataProvenanceTag } from '../types';
import { updateDoctor } from '../services/api';

interface DoctorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onOpenAICoach: (d: Doctor) => void;
  onOpenVoiceNote: (d: Doctor) => void;
  onScheduleVisit: (d: Doctor) => void;
  onOpenPatientDetail?: (patientId: string) => void;
  onDoctorUpdated?: () => void;
}

export const DoctorDetailModal: React.FC<DoctorDetailModalProps> = ({
  isOpen,
  onClose,
  doctor,
  onOpenAICoach,
  onOpenVoiceNote,
  onScheduleVisit,
  onOpenPatientDetail,
  onDoctorUpdated
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'timings' | 'patients' | 'timeline' | 'edit'>('overview');
  
  // Real Doctor Details including referred patients
  const [enrichedDoctor, setEnrichedDoctor] = useState<any>(null);
  const [referredPatients, setReferredPatients] = useState<ReferredPatientSummary[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<DoctorTimelineEvent[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    specialty: '',
    subSpecialty: '',
    qualification: '',
    hospital: '',
    clinic: '',
    area: '',
    territory: '',
    city: '',
    address: '',
    phone: '',
    whatsapp: '',
    email: '',
    paName: '',
    paContact: '',
    priority: 'B' as 'A' | 'B' | 'C',
    prescriberStatus: 'prospect' as string,
    preferredCallTime: '',
    cgmPotential: 'medium' as 'high' | 'medium' | 'low',
    affordabilityTier: 'middle' as 'high' | 'middle' | 'low',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load doctor details & referred patients
  useEffect(() => {
    if (!isOpen || !doctor) return;

    setActiveSubTab('overview');
    setSaveSuccess(null);
    setSaveError(null);

    // Initialize edit form
    setEditForm({
      name: doctor.name || '',
      specialty: doctor.specialty || '',
      subSpecialty: doctor.subSpecialty || '',
      qualification: doctor.qualification || '',
      hospital: doctor.hospital || '',
      clinic: doctor.clinic || '',
      area: doctor.area || '',
      territory: doctor.territory || doctor.area || '',
      city: doctor.city || 'Rawalpindi',
      address: doctor.address || '',
      phone: doctor.phone || '',
      whatsapp: doctor.whatsapp || '',
      email: doctor.email || '',
      paName: doctor.paName || '',
      paContact: doctor.paContact || '',
      priority: doctor.priority || 'B',
      prescriberStatus: doctor.prescriberStatus || 'prospect',
      preferredCallTime: doctor.preferredCallTime || '',
      cgmPotential: doctor.cgmPotential || 'medium',
      affordabilityTier: doctor.affordabilityTier || 'middle',
      notes: doctor.notes || ''
    });

    // Fetch full 360 details
    setIsLoadingDetails(true);
    fetch(`/api/v1/doctors/${doctor.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setEnrichedDoctor(json.data);
          if (json.data.referredPatients) {
            setReferredPatients(json.data.referredPatients);
          }
        }
      })
      .catch(err => console.error('Failed to load doctor 360 details', err))
      .finally(() => setIsLoadingDetails(false));

    // Fetch timeline
    setIsLoadingTimeline(true);
    fetch(`/api/v1/doctors/${doctor.id}/timeline`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setTimelineEvents(json.data);
        }
      })
      .catch(err => console.error('Failed to load doctor timeline', err))
      .finally(() => setIsLoadingTimeline(false));
  }, [isOpen, doctor?.id]);

  if (!isOpen || !doctor) return null;

  const currentDoctor = enrichedDoctor || doctor;
  const primaryPhone = currentDoctor.phone || currentDoctor.contacts?.find((c: any) => c.type === 'mobile' || c.type === 'whatsapp')?.value;
  const isDoctorActive = currentDoctor.isActive !== false && currentDoctor.relationshipStatus !== 'DORMANT';
  const provenanceTag: DataProvenanceTag = currentDoctor.isVerified ? 'FIELD_VERIFIED' : 'REP_ENTERED';

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch(`/api/v1/doctors/${doctor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update doctor');
      }
      setEnrichedDoctor(data.data);
      setSaveSuccess('Doctor details updated successfully.');
      if (onDoctorUpdated) onDoctorUpdated();
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActiveState = async () => {
    setIsDeactivating(true);
    const nextActive = !isDoctorActive;
    try {
      const payload: Partial<Doctor> = {
        isActive: nextActive,
        relationshipStatus: nextActive ? 'PROSPECT' : 'DORMANT'
      };
      const res = await fetch(`/api/v1/doctors/${doctor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update doctor status');
      }
      setEnrichedDoctor(data.data);
      setSaveSuccess(nextActive ? 'Doctor reactivated successfully.' : 'Doctor deactivated (preserved in history).');
      if (onDoctorUpdated) onDoctorUpdated();
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to toggle status');
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0ea5e9] rounded-xl flex items-center justify-center text-white font-black text-base shadow-xs">
              {currentDoctor.name.replace('Prof. ', '').replace('Dr. ', '').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[#0f172a]">
                  {currentDoctor.name}
                </h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  currentDoctor.priority === 'A' 
                    ? 'bg-sky-50 text-[#0ea5e9] border border-sky-200' 
                    : currentDoctor.priority === 'B'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  Priority {currentDoctor.priority}
                </span>
                
                {/* Provenance Tag */}
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" title={`Data Provenance: ${provenanceTag}`}>
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{provenanceTag}</span>
                </span>

                {/* Status Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isDoctorActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {isDoctorActive ? 'Active' : 'Inactive / Dormant'}
                </span>
              </div>
              <p className="text-xs text-[#64748b] font-medium">
                {currentDoctor.specialty} • {currentDoctor.hospital} • {currentDoctor.area}, {currentDoctor.city}
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

        {/* Action Toolbar */}
        <div className="px-6 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeSubTab === 'overview' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Overview & Scoring
            </button>
            <button
              onClick={() => setActiveSubTab('timings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeSubTab === 'timings' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              OPD Timings ({currentDoctor.timings?.length || 0})
            </button>
            <button
              onClick={() => setActiveSubTab('patients')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'patients' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Referred Patients ({referredPatients.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'timeline' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>360 Timeline ({timelineEvents.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'edit' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Doctor</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {primaryPhone && (
              <a
                href={`tel:${primaryPhone}`}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-[#e2e8f0] text-[#0f172a] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Call</span>
              </a>
            )}
            <button
              onClick={handleToggleActiveState}
              disabled={isDeactivating}
              className={`px-2.5 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs ${
                isDoctorActive
                  ? 'bg-white hover:bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
              title={isDoctorActive ? 'Deactivate doctor without deleting history' : 'Reactivate doctor'}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isDoctorActive ? 'Deactivate' : 'Reactivate'}</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAICoach(currentDoctor);
              }}
              className="px-3 py-1.5 bg-[#f0f9ff] hover:bg-sky-100 border border-sky-200 text-[#0ea5e9] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Coach Briefing</span>
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-100 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccess}</span>
          </div>
        )}
        {saveError && (
          <div className="px-6 py-2 bg-rose-50 border-b border-rose-100 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#f8fafc]">
          {/* SubTab: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className="space-y-4">
              {/* Dual Metric Scores: Factual Potential vs Daily Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-[#64748b]">Factual Potential</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-[#0f172a]">{currentDoctor.potentialScore}</span>
                    <span className="text-xs text-[#94a3b8]">/ 100</span>
                  </div>
                  <p className="text-[10px] text-[#64748b] mt-1">Based on specialty, hospital tier & patient profile</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-[#64748b]">Today's Priority Rank</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-[#0ea5e9]">{currentDoctor.dailyPriorityScore}</span>
                    <span className="text-xs text-[#94a3b8]">/ 100</span>
                  </div>
                  <p className="text-[10px] text-[#64748b] mt-1">Calculated via last visit gap & active opportunities</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-[#64748b]">Prescriber Status</span>
                  <div className="mt-1.5">
                    <span className="text-xs font-black uppercase px-2.5 py-1 rounded bg-slate-100 text-[#0f172a] border border-slate-200 inline-block">
                      {currentDoctor.prescriberStatus?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748b] mt-2">
                    Relationship: {'★'.repeat(currentDoctor.relationshipStrength || 1)}{'☆'.repeat(Math.max(0, 5 - (currentDoctor.relationshipStrength || 1)))}
                  </p>
                </div>
              </div>

              {/* Commercial Profile & CGM Potential */}
              <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Commercial & CGM Profile
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#334155]">
                  <div>
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">CGM Potential</span>
                    <p className="font-bold text-[#0f172a] capitalize">{currentDoctor.cgmPotential || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Affordability Tier</span>
                    <p className="font-bold text-[#0f172a] capitalize">{currentDoctor.affordabilityTier || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Preferred Call Time</span>
                    <p className="font-bold text-[#0f172a]">{currentDoctor.preferredCallTime || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Referred Patients Count</span>
                    <p className="font-bold text-[#0ea5e9]">{referredPatients.length} Active</p>
                  </div>
                </div>
              </div>

              {/* Identity & Facility Details */}
              <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Identity & Facility Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#334155]">
                  <div>
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Specialty / Sub-specialty</span>
                    <p className="font-bold text-[#0f172a]">{currentDoctor.specialty}</p>
                    <p className="text-[#64748b]">{currentDoctor.subSpecialty || currentDoctor.qualification || 'No sub-specialty noted'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Hospital & Consulting Room</span>
                    <p className="font-bold text-[#0f172a]">{currentDoctor.hospital}</p>
                    <p className="text-[#64748b]">{currentDoctor.clinic}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Address & Territory</span>
                    <p className="font-bold text-[#0f172a]">{currentDoctor.address || `${currentDoctor.area}, ${currentDoctor.city}`}</p>
                    <p className="text-[#64748b]">Territory: {currentDoctor.territory || currentDoctor.area}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">PA / Reception Coordinator</span>
                    <p className="font-bold text-[#0f172a]">{currentDoctor.paName || 'Direct Contact'}</p>
                    <p className="text-[#64748b]">{currentDoctor.paContact || 'No direct PA phone logged'}</p>
                  </div>
                </div>
              </div>

              {/* Clinical Notes & Known Objections */}
              <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Specialist Field Notes & Historical Objections
                </h4>
                <p className="text-xs text-[#334155] leading-relaxed">
                  {currentDoctor.notes || 'No custom notes added.'}
                </p>
                {currentDoctor.recentObjections && currentDoctor.recentObjections.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#f1f5f9]">
                    <span className="text-[10px] font-bold text-red-600 uppercase">Known Objections:</span>
                    <ul className="mt-1 space-y-1 text-xs text-red-950">
                      {currentDoctor.recentObjections.map((obj: string, i: number) => (
                        <li key={i}>• {obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SubTab: TIMINGS */}
          {activeSubTab === 'timings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Verified OPD Schedule & Consulting Slots
                </h4>
                <span className="text-[10px] text-[#64748b]">Source: Field Verification</span>
              </div>
              <div className="space-y-2">
                {currentDoctor.timings && currentDoctor.timings.length > 0 ? (
                  currentDoctor.timings.map((t: any) => (
                    <div key={t.id} className="p-3.5 bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0ea5e9] flex items-center justify-center font-bold text-xs">
                          {t.dayName?.substring(0, 3)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0f172a]">{t.dayName} • {t.startTime} - {t.endTime}</p>
                          <p className="text-[11px] text-[#64748b]">{t.locationName}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {t.timingType}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center bg-white rounded-xl border border-[#e2e8f0]">
                    <Clock3 className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#0f172a]">No OPD Timings Registered</p>
                    <p className="text-[11px] text-[#64748b] mt-0.5">Record clinic schedules during field visits</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SubTab: REFERRED PATIENTS (Doctor 360) */}
          {activeSubTab === 'patients' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                    Referred Patients & Patient Lifecycles
                  </h4>
                  <p className="text-[11px] text-[#64748b]">
                    Patients associated with Dr. {currentDoctor.name} through direct referral or care management
                  </p>
                </div>
                <span className="text-xs font-bold text-[#0ea5e9] bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                  {referredPatients.length} Patients
                </span>
              </div>

              {referredPatients.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-[#e2e8f0] space-y-2">
                  <Users className="w-8 h-8 text-[#94a3b8] mx-auto mb-1" />
                  <p className="text-xs font-bold text-[#0f172a]">No referred patients recorded</p>
                  <p className="text-[11px] text-[#64748b] max-w-sm mx-auto">
                    Direct patient referrals initiated by this doctor will appear here along with order histories and active EvoCheck sensor renewal tracking.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {referredPatients.map((p) => (
                    <div
                      key={p.patientId}
                      className="p-4 bg-white border border-[#e2e8f0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-sky-300 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0f172a]">{p.name}</span>
                          <span className="text-[10px] font-mono text-[#64748b]">({p.patientId})</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            p.status === 'RENEWAL_DUE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            p.status === 'PURCHASED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#64748b] flex-wrap">
                          <span>Phone: {p.phone}</span>
                          <span>•</span>
                          <span>Source: {p.acquisitionSource}</span>
                          <span>•</span>
                          <span>City: {p.city}</span>
                          {p.ordersCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-[#0ea5e9]">{p.ordersCount} Order{p.ordersCount === 1 ? '' : 's'}</span>
                            </>
                          )}
                        </div>
                        {p.activeSensorStatus && (
                          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 mt-1">
                            <Activity className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sensor: {p.activeSensorStatus}</span>
                            {p.sensorRenewalDate && (
                              <span>(Renewal due: {p.sensorRenewalDate})</span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (onOpenPatientDetail) {
                            onOpenPatientDetail(p.patientId);
                          }
                        }}
                        className="px-3 py-1.5 bg-[#f8fafc] hover:bg-sky-50 border border-[#e2e8f0] hover:border-sky-200 text-[#0f172a] hover:text-[#0ea5e9] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-center"
                      >
                        <span>Patient 360</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SubTab: 360 TIMELINE */}
          {activeSubTab === 'timeline' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                    Doctor 360 Unified Activity Timeline
                  </h4>
                  <p className="text-[11px] text-[#64748b]">
                    Chronological audit of field visits, outcomes, samples, patient referrals, orders, and sensors
                  </p>
                </div>
                <span className="text-xs font-mono text-[#64748b]">
                  {timelineEvents.length} events
                </span>
              </div>

              {isLoadingTimeline ? (
                <div className="p-8 text-center bg-white rounded-xl border border-[#e2e8f0] flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 text-[#0ea5e9] animate-spin" />
                  <p className="text-xs text-[#64748b]">Loading timeline history...</p>
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-[#e2e8f0] space-y-1">
                  <History className="w-8 h-8 text-[#94a3b8] mx-auto mb-1" />
                  <p className="text-xs font-bold text-[#0f172a]">No activity recorded yet</p>
                  <p className="text-[11px] text-[#64748b]">Historical visits, clinical outcomes, and patient interactions will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e2e8f0]">
                  {timelineEvents.map((evt) => (
                    <div key={evt.id} className="relative pl-8">
                      <div className={`absolute left-2 top-2 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                        evt.type === 'VISIT' ? 'border-[#0ea5e9]' :
                        evt.type === 'OUTCOME' ? 'border-emerald-500' :
                        evt.type === 'REFERRAL' ? 'border-purple-500' :
                        evt.type === 'ORDER' ? 'border-blue-600' :
                        evt.type === 'SENSOR' ? 'border-teal-500' :
                        evt.type === 'SAMPLE' ? 'border-indigo-500' :
                        'border-slate-400'
                      }`} />
                      <div className="p-3 bg-white border border-[#e2e8f0] rounded-xl shadow-2xs">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              evt.type === 'VISIT' ? 'bg-sky-50 text-[#0ea5e9] border border-sky-200' :
                              evt.type === 'OUTCOME' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              evt.type === 'REFERRAL' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              evt.type === 'ORDER' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              evt.type === 'SENSOR' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                              evt.type === 'SAMPLE' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {evt.type}
                            </span>
                            <span className="text-xs font-bold text-[#0f172a]">{evt.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#94a3b8]">
                            {evt.occurredAt ? new Date(evt.occurredAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown date'}
                          </span>
                        </div>
                        {evt.detail && (
                          <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
                            {evt.detail}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SubTab: EDIT DOCTOR */}
          {activeSubTab === 'edit' && (
            <form onSubmit={handleSaveEdit} className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">
                    Edit Doctor Information
                  </h4>
                  <p className="text-[11px] text-[#64748b]">
                    Update contact details, hospital affiliation, and commercial classifications
                  </p>
                </div>
                <div className="text-[11px] font-mono text-[#64748b]">
                  ID: <span className="font-bold text-[#0f172a]">{currentDoctor.id}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Doctor Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Specialty *</label>
                  <input
                    type="text"
                    required
                    value={editForm.specialty}
                    onChange={e => setEditForm(prev => ({ ...prev, specialty: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Sub-Specialty / Qualification</label>
                  <input
                    type="text"
                    value={editForm.subSpecialty}
                    onChange={e => setEditForm(prev => ({ ...prev, subSpecialty: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                    placeholder="e.g. Pediatric Diabetology, FCPS"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Hospital / Facility *</label>
                  <input
                    type="text"
                    required
                    value={editForm.hospital}
                    onChange={e => setEditForm(prev => ({ ...prev, hospital: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Clinic / Consulting Room</label>
                  <input
                    type="text"
                    value={editForm.clinic}
                    onChange={e => setEditForm(prev => ({ ...prev, clinic: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Area / Territory *</label>
                  <input
                    type="text"
                    required
                    value={editForm.area}
                    onChange={e => setEditForm(prev => ({ ...prev, area: e.target.value, territory: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={editForm.city}
                    onChange={e => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Full Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Primary Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                    placeholder="e.g. +92 300 1234567"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={editForm.whatsapp}
                    onChange={e => setEditForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">PA / Gatekeeper Name</label>
                  <input
                    type="text"
                    value={editForm.paName}
                    onChange={e => setEditForm(prev => ({ ...prev, paName: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                    placeholder="e.g. Tariq Mehmood"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">PA Phone Contact</label>
                  <input
                    type="text"
                    value={editForm.paContact}
                    onChange={e => setEditForm(prev => ({ ...prev, paContact: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                    placeholder="e.g. +92 333 9876543"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Priority Tier</label>
                  <select
                    value={editForm.priority}
                    onChange={e => setEditForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                  >
                    <option value="A">Priority Tier A (High Impact)</option>
                    <option value="B">Priority Tier B (Medium Impact)</option>
                    <option value="C">Priority Tier C (Developing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">CGM Potential</label>
                  <select
                    value={editForm.cgmPotential}
                    onChange={e => setEditForm(prev => ({ ...prev, cgmPotential: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                  >
                    <option value="high">High Potential</option>
                    <option value="medium">Medium Potential</option>
                    <option value="low">Low Potential</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Preferred Call Time</label>
                  <input
                    type="text"
                    value={editForm.preferredCallTime}
                    onChange={e => setEditForm(prev => ({ ...prev, preferredCallTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                    placeholder="e.g. 11:00 AM - 1:00 PM"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Prescriber Journey Status</label>
                  <select
                    value={editForm.prescriberStatus}
                    onChange={e => setEditForm(prev => ({ ...prev, prescriberStatus: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                  >
                    <option value="prospect">Prospect</option>
                    <option value="trialing">Trialing</option>
                    <option value="adopter">Adopter</option>
                    <option value="advocate">Advocate</option>
                    <option value="dormant">Dormant</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Clinical Field Notes</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                  placeholder="Record doctor preferences, special patient focus, or hospital nuances..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Doctor Changes</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-[#64748b]">
            Doctor ID: <span className="font-mono text-[#0f172a]">{currentDoctor.id}</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onOpenVoiceNote(currentDoctor);
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Note</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onScheduleVisit(currentDoctor);
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Schedule Next Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
