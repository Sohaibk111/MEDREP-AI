import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Activity,
  ShoppingBag,
  Clock,
  Users,
  History,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  PackageCheck,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import {
  PatientCRM,
  Doctor,
  PatientCRMStatus,
  PatientAcquisitionSource,
  DoctorPatientReferral,
  OrderCRM,
  SensorLifecycle,
  PatientTimelineEvent
} from '../types';
import {
  fetchPatientTimeline,
  fetchOrders,
  fetchSensors,
  fetchReferrals,
  updatePatient
} from '../services/api';

interface PatientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string | null;
  doctors: Doctor[];
  onOpenDoctorDetail?: (doc: Doctor) => void;
  onPatientUpdated?: () => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  isOpen,
  onClose,
  patientId,
  doctors,
  onOpenDoctorDetail,
  onPatientUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sensor' | 'orders' | 'referrals' | 'timeline' | 'edit'>('overview');
  const [patient, setPatient] = useState<PatientCRM | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<PatientTimelineEvent[]>([]);
  const [ordersList, setOrdersList] = useState<OrderCRM[]>([]);
  const [sensorsList, setSensorsList] = useState<SensorLifecycle[]>([]);
  const [referralsList, setReferralsList] = useState<DoctorPatientReferral[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<{
    name: string;
    phone: string;
    whatsapp: string;
    email: string;
    city: string;
    doctorId: string;
    acquisitionSource: PatientAcquisitionSource;
    status: PatientCRMStatus;
  }>({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    city: '',
    doctorId: '',
    acquisitionSource: 'DOCTOR_REFERRAL',
    status: 'LEAD'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !patientId) return;

    setActiveTab('overview');
    setSaveSuccess(null);
    setSaveError(null);
    setLoading(true);

    // Fetch patient data, timeline, orders, sensors, referrals in parallel
    Promise.all([
      fetch(`/api/v1/patients/${patientId}`).then(r => r.json()),
      fetchPatientTimeline(patientId).catch(() => ({ success: true, data: [] })),
      fetchOrders({ patientId }).catch(() => ({ success: true, data: [] })),
      fetchSensors({ patientId }).catch(() => ({ success: true, data: [] })),
      fetchReferrals({ patientId }).catch(() => ({ success: true, data: [] }))
    ])
      .then(([patRes, timelineRes, ordersRes, sensorsRes, referralsRes]) => {
        if (patRes.success && patRes.data) {
          const p = patRes.data;
          setPatient(p);
          setEditForm({
            name: p.name || '',
            phone: p.phone || '',
            whatsapp: p.whatsapp || '',
            email: p.email || '',
            city: p.city || 'Rawalpindi',
            doctorId: p.doctorId || '',
            acquisitionSource: p.acquisitionSource || 'DOCTOR_REFERRAL',
            status: p.status || 'LEAD'
          });
        }
        if (timelineRes.success) setTimelineEvents(timelineRes.data || []);
        if (ordersRes.success) setOrdersList(ordersRes.data || []);
        if (sensorsRes.success) setSensorsList(sensorsRes.data || []);
        if (referralsRes.success) setReferralsList(referralsRes.data || []);
      })
      .catch(err => {
        console.error('Error loading patient 360 data', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, patientId]);

  if (!isOpen || !patientId) return null;

  const referringDoctor = patient?.doctorId
    ? doctors.find(d => d.id === patient.doctorId || d.doctorId === patient.doctorId)
    : null;

  const activeSensor = sensorsList.find(s => s.status === 'ACTIVE' || s.status === 'RENEWAL_DUE');

  // Compute remaining days for active sensor (15-day controlled EvoCheck spec)
  const calculateSensorRemainingDays = (s: SensorLifecycle) => {
    if (!s.startDate) return null;
    const start = new Date(s.startDate).getTime();
    const now = Date.now();
    const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    const remaining = 15 - elapsedDays;
    return remaining;
  };

  const remainingDays = activeSensor ? calculateSensorRemainingDays(activeSensor) : null;

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await updatePatient(patientId, editForm);
      if (res.success && res.data) {
        setPatient(res.data);
        setSaveSuccess('Patient profile updated successfully.');
        if (onPatientUpdated) onPatientUpdated();
        setTimeout(() => setSaveSuccess(null), 3000);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update patient profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0ea5e9] rounded-xl flex items-center justify-center text-white font-black text-base shadow-xs">
              {patient?.name ? patient.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[#0f172a]">
                  {patient?.name || 'Loading Patient...'}
                </h3>
                <span className="text-[10px] font-mono text-[#64748b] bg-slate-100 px-2 py-0.5 rounded">
                  {patient?.patientId}
                </span>
                {patient?.status && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    patient.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    patient.status === 'RENEWAL_DUE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    patient.status === 'PURCHASED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    patient.status === 'REFERRED' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {patient.status}
                  </span>
                )}
                <span className="text-[10px] font-semibold text-[#64748b] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  Source: {patient?.acquisitionSource?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-[#64748b] font-medium mt-0.5">
                {patient?.phone} • {patient?.city} {referringDoctor ? `• Referred by Dr. ${referringDoctor.name}` : ''}
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
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'overview' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Overview & Doctor
            </button>
            <button
              onClick={() => setActiveTab('sensor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'sensor' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Sensor Lifecycle ({sensorsList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'orders' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Orders ({ordersList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'referrals' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Referrals ({referralsList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'timeline' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Patient Timeline ({timelineEvents.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'edit' ? 'bg-white text-[#0ea5e9] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Patient</span>
            </button>
          </div>

          {patient?.phone && (
            <a
              href={`tel:${patient.phone}`}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-[#e2e8f0] text-[#0f172a] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Call Patient</span>
            </a>
          )}
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
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-8 h-8 text-[#0ea5e9] animate-spin" />
              <p className="text-xs text-[#64748b]">Loading Patient 360 profile...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs">
                      <span className="text-[10px] font-black uppercase text-[#64748b]">CRM Lifecycle Status</span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xl font-black text-[#0f172a]">{patient?.status}</span>
                      </div>
                      <p className="text-[10px] text-[#64748b] mt-1">Acquisition: {patient?.acquisitionSource}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs">
                      <span className="text-[10px] font-black uppercase text-[#64748b]">Active EvoCheck Sensor</span>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-black text-[#0ea5e9]">
                          {activeSensor ? activeSensor.status : 'None'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#64748b] mt-1">
                        {activeSensor?.renewalDate ? `Renewal: ${activeSensor.renewalDate}` : 'No active sensor attached'}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs">
                      <span className="text-[10px] font-black uppercase text-[#64748b]">Total Orders</span>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-black text-[#0f172a]">{ordersList.length}</span>
                        <span className="text-xs text-[#64748b]">order{ordersList.length === 1 ? '' : 's'}</span>
                      </div>
                      <p className="text-[10px] text-[#64748b] mt-1">
                        Total spent: PKR {ordersList.reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Identity & Contact Details */}
                  <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-2xs space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                      Patient Contact & Location
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#334155]">
                      <div>
                        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Full Name</span>
                        <p className="font-bold text-[#0f172a] text-sm">{patient?.name}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Phone Number</span>
                        <p className="font-bold text-[#0f172a]">{patient?.phone || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">WhatsApp Contact</span>
                        <p className="font-bold text-[#0f172a]">{patient?.whatsapp || 'Same as phone / Not logged'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Email Address</span>
                        <p className="font-bold text-[#0f172a]">{patient?.email || 'Not logged'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">City</span>
                        <p className="font-bold text-[#0f172a]">{patient?.city}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Registered On</span>
                        <p className="font-bold text-[#0f172a]">
                          {patient?.createdAt ? new Date(patient.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Referring Doctor Section (Doctor 360 link) */}
                  <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                        Referring Doctor Association
                      </h4>
                      {referringDoctor && onOpenDoctorDetail && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenDoctorDetail(referringDoctor);
                          }}
                          className="text-xs font-bold text-[#0ea5e9] hover:underline flex items-center gap-1"
                        >
                          <span>Open Doctor 360</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {referringDoctor ? (
                      <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#0f172a]">Dr. {referringDoctor.name}</span>
                            <span className="text-[10px] font-mono text-[#64748b]">({referringDoctor.id})</span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white text-[#0ea5e9] border border-sky-200">
                              Priority {referringDoctor.priority}
                            </span>
                          </div>
                          <p className="text-xs text-[#64748b] mt-0.5">
                            {referringDoctor.specialty} • {referringDoctor.hospital} • {referringDoctor.area}, {referringDoctor.city}
                          </p>
                        </div>
                        {onOpenDoctorDetail && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenDoctorDetail(referringDoctor);
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-sky-50 border border-sky-200 text-[#0ea5e9] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-center"
                          >
                            <span>Doctor Profile</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#64748b]">
                        No referring doctor linked to this patient. Direct inquiry or retail walk-in.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: SENSOR LIFECYCLE (15-day controlled EvoCheck spec) */}
              {activeTab === 'sensor' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                        EvoCheck Continuous Glucose Monitoring Sensors
                      </h4>
                      <p className="text-[11px] text-[#64748b]">
                        Controlled 15-day continuous wear life, factory calibrated, MARD 8.66%
                      </p>
                    </div>
                  </div>

                  {/* Active Sensor Highlight */}
                  {activeSensor ? (
                    <div className="p-5 bg-white border-2 border-sky-200 rounded-xl shadow-xs space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-[#0ea5e9]" />
                          <span className="font-bold text-sm text-[#0f172a]">{activeSensor.product}</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            activeSensor.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {activeSensor.status}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#64748b]">
                          Sensor ID: {activeSensor.sensorId}
                        </span>
                      </div>

                      {/* 15-Day Countdown Bar */}
                      <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0f172a]">15-Day Sensor Wear Cycle</span>
                          <span className="font-mono font-bold text-[#0ea5e9]">
                            {remainingDays !== null ? (
                              remainingDays > 0 ? `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining` : 'Renewal Due Today'
                            ) : 'Active'}
                          </span>
                        </div>
                        <div className="w-full bg-[#e2e8f0] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              remainingDays !== null && remainingDays <= 3 ? 'bg-amber-500' : 'bg-[#0ea5e9]'
                            }`}
                            style={{
                              width: `${Math.max(0, Math.min(100, remainingDays !== null ? ((15 - remainingDays) / 15) * 100 : 50))}%`
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#64748b]">
                          <span>Started: {activeSensor.startDate || 'Unknown'}</span>
                          <span>Renewal Date: {activeSensor.renewalDate || 'Unknown'}</span>
                        </div>
                      </div>

                      {activeSensor.status === 'RENEWAL_DUE' && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>
                            <strong>Renewal Alert:</strong> 15-day sensor session ending. Coordinate next EvoCheck sensor unit replenishment.
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white rounded-xl border border-[#e2e8f0] space-y-1">
                      <Activity className="w-8 h-8 text-[#94a3b8] mx-auto mb-1" />
                      <p className="text-xs font-bold text-[#0f172a]">No Active Sensor Session</p>
                      <p className="text-[11px] text-[#64748b]">
                        When this patient receives and applies an EvoCheck CGM sensor, active wear metrics will appear here.
                      </p>
                    </div>
                  )}

                  {/* All Sensor Sessions History */}
                  {sensorsList.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                        Sensor History ({sensorsList.length})
                      </h5>
                      <div className="space-y-2">
                        {sensorsList.map(s => (
                          <div key={s.sensorId} className="p-3 bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-between text-xs shadow-2xs">
                            <div>
                              <p className="font-bold text-[#0f172a]">{s.product} - {s.sensorId}</p>
                              <p className="text-[11px] text-[#64748b]">
                                Applied: {s.startDate} • Expected End: {s.expectedEndDate} • Renewal: {s.renewalDate}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {s.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                        Patient Commercial Order History
                      </h4>
                      <p className="text-[11px] text-[#64748b]">
                        Verified orders for EvoCheck CGM sensors and starter kits
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#0ea5e9] bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                      {ordersList.length} Orders
                    </span>
                  </div>

                  {ordersList.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-[#e2e8f0] space-y-1">
                      <ShoppingBag className="w-8 h-8 text-[#94a3b8] mx-auto mb-1" />
                      <p className="text-xs font-bold text-[#0f172a]">No Orders Logged</p>
                      <p className="text-[11px] text-[#64748b]">Patient has not placed any commercial orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {ordersList.map(o => (
                        <div key={o.orderId} className="p-4 bg-white border border-[#e2e8f0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#0f172a]">{o.product}</span>
                              <span className="text-[10px] font-mono text-[#64748b]">({o.orderId})</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                o.orderStatus === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                o.orderStatus === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {o.orderStatus}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#64748b] flex items-center gap-2 flex-wrap">
                              <span>Date: {o.orderDate}</span>
                              <span>•</span>
                              <span>Quantity: {o.quantity} unit{o.quantity === 1 ? '' : 's'}</span>
                              <span>•</span>
                              <span>Payment: {o.paymentStatus}</span>
                              <span>•</span>
                              <span>Source: {o.orderSource}</span>
                            </div>
                          </div>
                          <div className="text-right self-start sm:self-center">
                            <span className="text-xs font-semibold text-[#64748b]">Total:</span>
                            <p className="text-sm font-black text-[#0ea5e9]">PKR {o.total.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: REFERRALS */}
              {activeTab === 'referrals' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                        Doctor Referrals Log
                      </h4>
                      <p className="text-[11px] text-[#64748b]">
                        Clinical recommendation referrals connecting this patient to prescribing doctors
                      </p>
                    </div>
                  </div>

                  {referralsList.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-[#e2e8f0] space-y-1">
                      <Users className="w-8 h-8 text-[#94a3b8] mx-auto mb-1" />
                      <p className="text-xs font-bold text-[#0f172a]">No Referrals Logged</p>
                      <p className="text-[11px] text-[#64748b]">This patient was not acquired through an explicit doctor referral record.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {referralsList.map(r => {
                        const doc = doctors.find(d => d.id === r.doctorId || d.doctorId === r.doctorId);
                        return (
                          <div key={r.referralId || r.id} className="p-4 bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-between shadow-2xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#0f172a]">
                                  {doc ? `Dr. ${doc.name}` : `Doctor ID: ${r.doctorId}`}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  r.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  r.status === 'CONSULTED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {r.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#64748b]">
                                Date: {r.referralDate} {r.notes ? `• ${r.notes}` : ''}
                              </p>
                            </div>
                            {doc && onOpenDoctorDetail && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenDoctorDetail(doc);
                                }}
                                className="px-2.5 py-1 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 text-[#0f172a] rounded text-xs font-semibold"
                              >
                                View Doctor
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                        Patient 360 Unified Timeline
                      </h4>
                      <p className="text-[11px] text-[#64748b]">
                        Chronological record of registrations, profile updates, referrals, orders, and sensors
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[#64748b]">
                      {timelineEvents.length} events
                    </span>
                  </div>

                  {timelineEvents.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-[#e2e8f0] space-y-1">
                      <History className="w-8 h-8 text-[#94a3b8] mx-auto mb-1" />
                      <p className="text-xs font-bold text-[#0f172a]">No timeline events recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e2e8f0]">
                      {timelineEvents.map((evt) => (
                        <div key={evt.id} className="relative pl-8">
                          <div className={`absolute left-2 top-2 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                            evt.type === 'PATIENT_CREATED' ? 'border-[#0ea5e9]' :
                            evt.type === 'REFERRAL' ? 'border-purple-500' :
                            evt.type === 'ORDER' ? 'border-blue-600' :
                            evt.type === 'SENSOR' ? 'border-teal-500' :
                            evt.type === 'FOLLOWUP' ? 'border-amber-500' :
                            'border-slate-400'
                          }`} />
                          <div className="p-3 bg-white border border-[#e2e8f0] rounded-xl shadow-2xs">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  evt.type === 'PATIENT_CREATED' ? 'bg-sky-50 text-[#0ea5e9] border border-sky-200' :
                                  evt.type === 'REFERRAL' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                  evt.type === 'ORDER' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  evt.type === 'SENSOR' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
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

              {/* TAB 6: EDIT PATIENT */}
              {activeTab === 'edit' && (
                <form onSubmit={handleSaveEdit} className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">
                        Edit Patient Profile
                      </h4>
                      <p className="text-[11px] text-[#64748b]">
                        Update contact numbers, city, CRM status, or referring doctor
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-[#64748b]">
                      ID: <span className="font-bold text-[#0f172a]">{patient?.patientId}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={editForm.phone}
                        onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
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
                      <label className="block text-[11px] font-bold text-[#475569] mb-1">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
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
                      <label className="block text-[11px] font-bold text-[#475569] mb-1">Referring Doctor</label>
                      <select
                        value={editForm.doctorId}
                        onChange={e => setEditForm(prev => ({ ...prev, doctorId: e.target.value }))}
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

                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1">Acquisition Source</label>
                      <select
                        value={editForm.acquisitionSource}
                        onChange={e => setEditForm(prev => ({ ...prev, acquisitionSource: e.target.value as PatientAcquisitionSource }))}
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
                      <label className="block text-[11px] font-bold text-[#475569] mb-1">CRM Status</label>
                      <select
                        value={editForm.status}
                        onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as PatientCRMStatus }))}
                        className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#0ea5e9]"
                      >
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
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Patient Changes</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b]">
          <div>
            Patient ID: <span className="font-mono font-bold text-[#0f172a]">{patient?.patientId}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0f172a] rounded-lg font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
