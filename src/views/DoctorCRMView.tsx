import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  Clock, 
  Phone, 
  Sparkles, 
  ShieldCheck, 
  Filter, 
  ChevronRight,
  TrendingUp,
  UserPlus,
  Mic
} from 'lucide-react';
import { Doctor } from '../types';

interface DoctorCRMViewProps {
  doctors: Doctor[];
  onOpenDoctorDetail: (doctor: Doctor) => void;
  onOpenAICoach: (doctor: Doctor) => void;
  onOpenVoiceNote: (doctor: Doctor) => void;
  onAddDoctor: () => void;
}

export const DoctorCRMView: React.FC<DoctorCRMViewProps> = ({
  doctors,
  onOpenDoctorDetail,
  onOpenAICoach,
  onOpenVoiceNote,
  onAddDoctor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const areas = ['all', 'PWD', 'Soan Garden', 'Saidpur Road', 'Commercial Market', 'PIMS', 'Shifa International'];

  const filteredDoctors = doctors.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.area.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesArea = selectedArea === 'all' || d.area === selectedArea;
    const matchesPriority = selectedPriority === 'all' || d.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || d.prescriberStatus === selectedStatus;

    return matchesSearch && matchesArea && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header with Title and Add Doctor CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">
            Doctor CRM 360° Directory
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Verified Healthcare Providers • Dual Scoring (Potential vs Daily Priority) • Rawalpindi / Islamabad
          </p>
        </div>
        <button
          onClick={onAddDoctor}
          className="px-4 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <UserPlus className="w-4 h-4 text-sky-400" />
          <span>Add Verified Doctor</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by doctor name, specialty, hospital, or territory area..."
              className="w-full text-xs text-[#0f172a] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
            />
          </div>

          {/* Priority & Status dropdowns */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs font-bold text-[#0f172a] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
            >
              <option value="all">All Priorities</option>
              <option value="A">Priority A (High Potential)</option>
              <option value="B">Priority B (Medium)</option>
              <option value="C">Priority C (Prospect)</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-bold text-[#0f172a] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
            >
              <option value="all">All Prescriber Statuses</option>
              <option value="active_prescriber">Active Prescriber</option>
              <option value="trialing">Trialing</option>
              <option value="prospect">Prospect</option>
              <option value="advocate">KOL Advocate</option>
            </select>
          </div>
        </div>

        {/* Territory Area Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mr-1">
            Zone:
          </span>
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedArea === area
                  ? 'bg-[#0f172a] text-white font-bold shadow-xs'
                  : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a]'
              }`}
            >
              {area === 'all' ? 'All Areas' : area}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDoctors.map((doc) => {
          const primaryPhone = doc.contacts?.find((c) => c.type === 'mobile' || c.type === 'whatsapp')?.value;
          const nextTiming = doc.timings[0];

          return (
            <div
              key={doc.id}
              className="bg-white border border-[#e2e8f0] hover:border-sky-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              {/* Doctor Card Top */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        doc.priority === 'A'
                          ? 'bg-sky-50 text-[#0ea5e9] border border-sky-200'
                          : doc.priority === 'B'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        Priority {doc.priority}
                      </span>
                      {doc.isVerified && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                    <h3 
                      onClick={() => onOpenDoctorDetail(doc)}
                      className="text-base font-bold text-[#0f172a] hover:text-[#0ea5e9] cursor-pointer mt-1.5"
                    >
                      {doc.name}
                    </h3>
                    <p className="text-xs text-[#64748b] font-medium">
                      {doc.specialty}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-[#0f172a] inline-block">
                      {doc.prescriberStatus.replace('_', ' ')}
                    </span>
                    <div className="mt-1 text-[10px] text-[#64748b]">
                      Rel: {'★'.repeat(doc.relationshipStrength)}
                    </div>
                  </div>
                </div>

                {/* Hospital / Clinic Info */}
                <div className="mt-3 space-y-1 text-xs text-[#334155]">
                  <p className="font-semibold text-[#0f172a]">{doc.hospital}</p>
                  <p className="text-[#64748b] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0ea5e9] shrink-0" />
                    <span>{doc.clinic} ({doc.area})</span>
                  </p>
                  {nextTiming && (
                    <p className="text-[#64748b] flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />
                      <span>{nextTiming.dayName}: {nextTiming.startTime} - {nextTiming.endTime}</span>
                    </p>
                  )}
                </div>

                {/* Potential & Daily Score Indicators */}
                <div className="mt-3.5 pt-3 border-t border-[#f1f5f9] grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#f8fafc] p-2 rounded-lg">
                    <span className="text-[9px] font-bold text-[#64748b] uppercase">Factual Potential</span>
                    <p className="text-sm font-black text-[#0f172a]">{doc.potentialScore}/100</p>
                  </div>
                  <div className="bg-sky-50/60 p-2 rounded-lg">
                    <span className="text-[9px] font-bold text-[#0ea5e9] uppercase">Daily Priority</span>
                    <p className="text-sm font-black text-[#0ea5e9]">{doc.dailyPriorityScore}/100</p>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action Bar */}
              <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between gap-1.5">
                <button
                  onClick={() => onOpenDoctorDetail(doc)}
                  className="flex-1 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  360° Profile
                </button>
                <button
                  onClick={() => onOpenAICoach(doc)}
                  className="p-2 bg-[#f0f9ff] hover:bg-sky-100 text-[#0ea5e9] border border-sky-200 rounded-lg transition-colors cursor-pointer"
                  title="AI Pre-Visit Coach"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onOpenVoiceNote(doc)}
                  className="p-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
                  title="Record Voice Note"
                >
                  <Mic className="w-3.5 h-3.5 text-red-400" />
                </button>
                {primaryPhone && (
                  <a
                    href={`tel:${primaryPhone}`}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
                    title="Call Doctor"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-12 text-center">
          <p className="text-sm font-bold text-[#0f172a]">No doctors found matching your criteria</p>
          <p className="text-xs text-[#64748b] mt-1">Try clearing your filters or search query.</p>
        </div>
      )}
    </div>
  );
};
