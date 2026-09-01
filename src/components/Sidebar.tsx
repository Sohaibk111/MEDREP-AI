import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  Sparkles, 
  CheckSquare, 
  TrendingUp, 
  BookOpen, 
  ShieldCheck
} from 'lucide-react';

export type NavTab = 
  | 'briefing' 
  | 'doctors' 
  | 'planner' 
  | 'ai_coach' 
  | 'tasks' 
  | 'sales' 
  | 'knowledge' 
  | 'conflicts';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unresolvedConflictsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unresolvedConflictsCount
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'briefing', label: 'Field Dashboard', icon: LayoutDashboard },
    { id: 'doctors', label: 'Doctor CRM 360', icon: Users },
    { id: 'planner', label: 'Weekly Planner', icon: CalendarDays },
    { id: 'ai_coach', label: 'AI Visit Coach', icon: Sparkles },
    { id: 'tasks', label: 'Follow-ups & Tasks', icon: CheckSquare },
    { id: 'sales', label: 'Patient Opportunities', icon: TrendingUp },
    { id: 'knowledge', label: 'EvoCheck Hub', icon: BookOpen },
    { id: 'conflicts', label: 'Data Provenance', icon: ShieldCheck, badge: unresolvedConflictsCount }
  ];

  return (
    <nav className="hidden md:flex col-span-3 lg:col-span-2 border-r border-[#e2e8f0] bg-white p-4 flex-col justify-between select-none min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-1.5">
        <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-widest text-[#94a3b8]">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full px-3.5 py-2.5 rounded-lg flex items-center justify-between text-xs font-semibold transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-[#f0f9ff] text-[#0ea5e9] font-bold shadow-xs'
                  : 'text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0ea5e9]' : 'text-[#94a3b8]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-white">
                  {item.badge}
                </span>
              ) : isActive ? (
                <div className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* AI Context Card Footer */}
      <div className="mt-auto pt-4">
        <div className="p-3.5 bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] uppercase font-black text-[#64748b] tracking-wider">
              AI Grounding Active
            </p>
          </div>
          <p className="text-xs leading-relaxed text-[#334155] font-medium">
            <strong>EvoCheck CGM</strong> Knowledge Hub & Rawalpindi Doctor Dataset loaded.
          </p>
          <div className="mt-2 pt-2 border-t border-[#e2e8f0] flex items-center justify-between text-[10px] text-[#64748b]">
            <span>MARD: <strong>8.66%</strong></span>
            <span>Wear: <strong>15 Days</strong></span>
          </div>
        </div>
      </div>
    </nav>
  );
};
