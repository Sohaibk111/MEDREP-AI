import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  Sparkles, 
  CheckSquare, 
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'briefing', label: 'Briefing', icon: LayoutDashboard },
    { id: 'doctors', label: 'Doctors', icon: Users },
    { id: 'planner', label: 'Planner', icon: CalendarDays },
    { id: 'ai_coach', label: 'AI Coach', icon: Sparkles },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'sales', label: 'Leads', icon: TrendingUp }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#e2e8f0] px-2 flex items-center justify-around z-30 shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              isActive ? 'text-[#0ea5e9] font-bold' : 'text-[#64748b]'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-[#0ea5e9]' : 'text-[#94a3b8]'}`} />
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
