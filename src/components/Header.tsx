import React from 'react';
import { 
  Sparkles, 
  MapPin, 
  ShieldAlert, 
  Mic, 
  Bot, 
  Layers
} from 'lucide-react';

interface HeaderProps {
  activeTerritory: string;
  onTerritoryChange: (t: string) => void;
  onOpenVoiceNote: () => void;
  onOpenAIChat: () => void;
  onOpenConflicts: () => void;
  unresolvedConflictsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTerritory,
  onTerritoryChange,
  onOpenVoiceNote,
  onOpenAIChat,
  onOpenConflicts,
  unresolvedConflictsCount
}) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-[#e2e8f0] sticky top-0 z-30 select-none">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#0ea5e9] rounded flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-sm">
          M
        </div>
        <div className="flex items-baseline gap-1.5">
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">
            MEDREP <span className="text-[#0ea5e9]">AI</span>
          </h1>
          <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-sky-50 text-[#0ea5e9] border border-sky-100 rounded">
            EvoCheck CGM
          </span>
        </div>
      </div>

      {/* Center Actions / Territory Filter */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] px-3 py-1.5 rounded-lg">
          <MapPin className="w-3.5 h-3.5 text-[#0ea5e9]" />
          <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Territory:</span>
          <select 
            value={activeTerritory}
            onChange={(e) => onTerritoryChange(e.target.value)}
            className="text-xs font-bold text-[#0f172a] bg-transparent border-none focus:outline-none cursor-pointer pr-2"
          >
            <option value="all">Rawalpindi & Islamabad (All Zones)</option>
            <option value="PWD">Rawalpindi-East (PWD / Soan Garden)</option>
            <option value="Saidpur Road">Rawalpindi-Central (Saidpur Rd / Comm Mkt)</option>
            <option value="Islamabad">Islamabad (PIMS / Shifa International)</option>
          </select>
        </div>
      </div>

      {/* Right Controls & User Badge */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Provenance Alert Indicator */}
        {unresolvedConflictsCount > 0 && (
          <button
            onClick={onOpenConflicts}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Conflicting Data Detected"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span className="hidden sm:inline">Data Conflict</span>
            <span className="w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] flex items-center justify-center font-black">
              {unresolvedConflictsCount}
            </span>
          </button>
        )}

        {/* AI Territory Assistant Button */}
        <button
          onClick={onOpenAIChat}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f9ff] hover:bg-sky-100 text-[#0ea5e9] border border-sky-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          <span className="hidden md:inline">AI Territory Q&A</span>
        </button>

        {/* 1-Tap Voice Visit Note Button */}
        <button
          onClick={onOpenVoiceNote}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
        >
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <Mic className="w-3.5 h-3.5 text-white" />
          <span className="font-semibold">Voice Note</span>
        </button>

        {/* Rep Profile Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-xs font-black text-[#475569] shadow-inner ml-1" title="Sohaib Ahmed • Product Specialist">
          SA
        </div>
      </div>
    </header>
  );
};
