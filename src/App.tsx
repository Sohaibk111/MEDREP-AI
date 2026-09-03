import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { MorningBriefingView } from './views/MorningBriefingView';
import { DoctorCRMView } from './views/DoctorCRMView';
import { FieldPlannerView } from './views/FieldPlannerView';
import { AICoachFullView } from './views/AICoachFullView';
import { FollowupsView } from './views/FollowupsView';
import { SalesFunnelView } from './views/SalesFunnelView';
import { KnowledgeHubView } from './views/KnowledgeHubView';

// Modals
import { AICoachModal } from './components/AICoachModal';
import { VoiceNoteModal } from './components/VoiceNoteModal';
import { AITerritoryChatModal } from './components/AITerritoryChatModal';
import { DataConflictsModal } from './components/DataConflictsModal';
import { DoctorDetailModal } from './components/DoctorDetailModal';
import { AddDoctorModal } from './components/AddDoctorModal';
import { AddVisitModal } from './components/AddVisitModal';
import { AddTaskModal } from './components/AddTaskModal';
import { AddPatientOppModal } from './components/AddPatientOppModal';
import { DayEndSummaryModal } from './components/DayEndSummaryModal';
import { LogVisitOutcomeModal } from './components/LogVisitOutcomeModal';

// Types & Services
import { 
  Doctor, 
  Visit, 
  FollowupTask, 
  AnonymousPatientOpportunity, 
  WeeklyFieldPlan, 
  DataConflict, 
  EvoCheckProductKnowledge 
} from './types';
import { 
  fetchBriefing, 
  fetchDoctors, 
  fetchFollowups, 
  fetchSales, 
  fetchFieldPlan, 
  fetchKnowledge, 
  fetchConflicts,
  updateFollowup,
  updateVisitStatus,
  updatePatientOpportunity
} from './services/api';
import { Loader2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('briefing');
  const [activeTerritory, setActiveTerritory] = useState<string>('all');

  // Core Data State
  const [briefingData, setBriefingData] = useState<any>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [tasks, setTasks] = useState<FollowupTask[]>([]);
  const [opportunities, setOpportunities] = useState<AnonymousPatientOpportunity[]>([]);
  const [plannerData, setPlannerData] = useState<WeeklyFieldPlan | null>(null);
  const [knowledge, setKnowledge] = useState<EvoCheckProductKnowledge | null>(null);
  const [conflicts, setConflicts] = useState<DataConflict[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Modals & Selections
  const [selectedDoctorForCoach, setSelectedDoctorForCoach] = useState<Doctor | null>(null);
  const [selectedDoctorForDetail, setSelectedDoctorForDetail] = useState<Doctor | null>(null);
  const [selectedDoctorForVoiceNote, setSelectedDoctorForVoiceNote] = useState<Doctor | null>(null);

  const [isAICoachModalOpen, setIsAICoachModalOpen] = useState(false);
  const [isVoiceNoteModalOpen, setIsVoiceNoteModalOpen] = useState(false);
  const [isAIChatModalOpen, setIsAIChatModalOpen] = useState(false);
  const [isConflictsModalOpen, setIsConflictsModalOpen] = useState(false);
  const [isDoctorDetailModalOpen, setIsDoctorDetailModalOpen] = useState(false);
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [isAddVisitModalOpen, setIsAddVisitModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddPatientOppModalOpen, setIsAddPatientOppModalOpen] = useState(false);
  const [isDayEndSummaryModalOpen, setIsDayEndSummaryModalOpen] = useState(false);
  const [isLogOutcomeModalOpen, setIsLogOutcomeModalOpen] = useState(false);
  const [outcomeTargetDoctor, setOutcomeTargetDoctor] = useState<Doctor | null>(null);
  const [outcomeTargetVisit, setOutcomeTargetVisit] = useState<Visit | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        briefingRes, 
        doctorsRes, 
        tasksRes, 
        salesRes, 
        plannerRes, 
        knowledgeRes, 
        conflictsRes
      ] = await Promise.all([
        fetchBriefing().catch(() => ({ success: false })),
        fetchDoctors().catch(() => ({ success: false, data: [] })),
        fetchFollowups().catch(() => ({ success: false, data: [] })),
        fetchSales().catch(() => ({ success: false, data: [] })),
        fetchFieldPlan().catch(() => ({ success: false, data: null })),
        fetchKnowledge().catch(() => ({ success: false, data: null })),
        fetchConflicts().catch(() => ({ success: false, data: [] }))
      ]);

      if (briefingRes.success) setBriefingData(briefingRes.data);
      if (doctorsRes.success) setDoctors(doctorsRes.data);
      if (tasksRes.success) setTasks(tasksRes.data);
      if (salesRes.success) setOpportunities(salesRes.data);
      if (plannerRes.success) setPlannerData(plannerRes.data);
      if (knowledgeRes.success) setKnowledge(knowledgeRes.data);
      if (conflictsRes.success) setConflicts(conflictsRes.data);
    } catch (err) {
      console.error('Error loading MedRep data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleOpenAICoach = (doc: Doctor) => {
    setSelectedDoctorForCoach(doc);
    setIsAICoachModalOpen(true);
  };

  const handleOpenDoctorDetail = (doc: Doctor) => {
    setSelectedDoctorForDetail(doc);
    setIsDoctorDetailModalOpen(true);
  };

  const handleOpenVoiceNote = (doc?: Doctor) => {
    setSelectedDoctorForVoiceNote(doc || doctors[0] || null);
    setIsVoiceNoteModalOpen(true);
  };

  const handleToggleTaskComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      await updateFollowup(taskId, { isCompleted: !currentStatus });
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: !currentStatus } : t));
      if (briefingData) {
        setBriefingData((prev: any) => ({
          ...prev,
          urgentTasks: prev.urgentTasks.map((t: any) => t.id === taskId ? { ...t, isCompleted: !currentStatus } : t)
        }));
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleUpdateVisitStatus = async (visitId: string, status: string) => {
    try {
      await updateVisitStatus(visitId, { status });
      loadAllData();
    } catch (err) {
      console.error('Failed to update visit status:', err);
    }
  };

  const handleOpenLogOutcome = (doctor: Doctor, visitId?: string) => {
    if (!doctor) return;
    setOutcomeTargetDoctor(doctor);
    const v = (briefingData?.todayVisitsQueue || []).find((vis: any) => vis.id === visitId || vis.doctorId === doctor.id);
    setOutcomeTargetVisit(v || ({
      id: visitId || `vis-auto-${doctor.id}`,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      hospitalClinic: doctor.clinic || doctor.hospital,
      area: doctor.area,
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '12:00 PM',
      status: 'completed',
      type: 'routine',
      doctor: doctor
    } as unknown as Visit));
    setIsLogOutcomeModalOpen(true);
  };

  const handleUpdateOppStage = async (oppId: string, newStage: any) => {
    try {
      await updatePatientOpportunity(oppId, { stage: newStage });
      setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, stage: newStage } : o));
    } catch (err) {
      console.error('Failed to update patient opportunity stage:', err);
    }
  };

  const unresolvedConflictsCount = conflicts.filter(c => c.status === 'unresolved').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col font-sans antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* Top Header Navigation */}
      <Header
        activeTerritory={activeTerritory}
        onTerritoryChange={setActiveTerritory}
        onOpenVoiceNote={() => handleOpenVoiceNote()}
        onOpenAIChat={() => setIsAIChatModalOpen(true)}
        onOpenConflicts={() => setIsConflictsModalOpen(true)}
        unresolvedConflictsCount={unresolvedConflictsCount}
      />

      {/* Main Content Layout Grid (Geometric Balance) */}
      <div className="flex-1 w-full max-w-7xl mx-auto grid grid-cols-12 md:gap-0">
        {/* Desktop Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          unresolvedConflictsCount={unresolvedConflictsCount}
        />

        {/* Main Work Area */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10 p-4 md:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#0ea5e9] animate-spin" />
              <p className="text-sm font-bold text-[#0f172a]">Loading MedRep Field Workspace...</p>
              <p className="text-xs text-[#64748b]">Syncing Rawalpindi CRM data & EvoCheck clinical grounding</p>
            </div>
          ) : (
            <>
              {activeTab === 'briefing' && (
                <MorningBriefingView
                  briefingData={briefingData}
                  onOpenAICoach={handleOpenAICoach}
                  onOpenDoctorDetail={handleOpenDoctorDetail}
                  onOpenVoiceNote={handleOpenVoiceNote}
                  onScheduleVisit={() => setIsAddVisitModalOpen(true)}
                  onAddTask={() => setIsAddTaskModalOpen(true)}
                  onToggleTaskComplete={handleToggleTaskComplete}
                  onUpdateVisitStatus={handleUpdateVisitStatus}
                  onOpenDayEndSummary={() => setIsDayEndSummaryModalOpen(true)}
                />
              )}

              {activeTab === 'doctors' && (
                <DoctorCRMView
                  doctors={doctors}
                  onOpenDoctorDetail={handleOpenDoctorDetail}
                  onOpenAICoach={handleOpenAICoach}
                  onOpenVoiceNote={handleOpenVoiceNote}
                  onAddDoctor={() => setIsAddDoctorModalOpen(true)}
                  onLogOutcome={handleOpenLogOutcome}
                />
              )}

              {activeTab === 'planner' && (
                <FieldPlannerView
                  plannerData={plannerData}
                  visits={briefingData?.todayVisitsQueue || []}
                  doctors={doctors}
                  onOpenAICoach={handleOpenAICoach}
                  onOpenDoctorDetail={handleOpenDoctorDetail}
                  onAddStop={() => setIsAddVisitModalOpen(true)}
                  onLogOutcome={handleOpenLogOutcome}
                  onUpdateVisitStatus={handleUpdateVisitStatus}
                />
              )}

              {activeTab === 'ai_coach' && (
                <AICoachFullView
                  doctors={doctors}
                  selectedDoctor={selectedDoctorForCoach}
                  onSelectDoctor={setSelectedDoctorForCoach}
                  onOpenVoiceNote={handleOpenVoiceNote}
                  onScheduleVisit={(doc) => {
                    setSelectedDoctorForDetail(doc);
                    setIsAddVisitModalOpen(true);
                  }}
                />
              )}

              {activeTab === 'tasks' && (
                <FollowupsView
                  tasks={tasks}
                  doctors={doctors}
                  onAddTask={() => setIsAddTaskModalOpen(true)}
                  onToggleTaskComplete={handleToggleTaskComplete}
                  onOpenDoctorDetail={handleOpenDoctorDetail}
                />
              )}

              {activeTab === 'sales' && (
                <SalesFunnelView
                  opportunities={opportunities}
                  doctors={doctors}
                  onAddOpportunity={() => setIsAddPatientOppModalOpen(true)}
                  onUpdateStage={handleUpdateOppStage}
                  onOpenDoctorDetail={handleOpenDoctorDetail}
                />
              )}

              {activeTab === 'knowledge' && (
                <KnowledgeHubView knowledge={knowledge} />
              )}

              {activeTab === 'conflicts' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                    <h2 className="text-lg font-bold text-[#0f172a]">
                      Data Provenance & Source Conflict Center
                    </h2>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Protect field-verified doctor schedules and phone numbers from being overwritten by external sources.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsConflictsModalOpen(true)}
                    className="px-4 py-2 bg-[#0ea5e9] text-white rounded-xl text-xs font-bold hover:bg-sky-600 cursor-pointer"
                  >
                    Open Resolution Queue ({unresolvedConflictsCount} Active)
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Floating Modals */}
      <AICoachModal
        isOpen={isAICoachModalOpen}
        onClose={() => setIsAICoachModalOpen(false)}
        doctor={selectedDoctorForCoach}
        onStartVisit={(doc) => {
          setIsAICoachModalOpen(false);
          setIsAddVisitModalOpen(true);
        }}
        onOpenVoiceNote={(doc) => {
          setIsAICoachModalOpen(false);
          handleOpenVoiceNote(doc);
        }}
      />

      <VoiceNoteModal
        isOpen={isVoiceNoteModalOpen}
        onClose={() => setIsVoiceNoteModalOpen(false)}
        defaultDoctor={selectedDoctorForVoiceNote}
        doctorsList={doctors}
        onCommitted={() => {
          loadAllData();
        }}
      />

      <AITerritoryChatModal
        isOpen={isAIChatModalOpen}
        onClose={() => setIsAIChatModalOpen(false)}
      />

      <DataConflictsModal
        isOpen={isConflictsModalOpen}
        onClose={() => setIsConflictsModalOpen(false)}
        conflicts={conflicts}
        onResolved={() => {
          loadAllData();
        }}
      />

      <DoctorDetailModal
        isOpen={isDoctorDetailModalOpen}
        onClose={() => setIsDoctorDetailModalOpen(false)}
        doctor={selectedDoctorForDetail}
        onOpenAICoach={(doc) => {
          setIsDoctorDetailModalOpen(false);
          handleOpenAICoach(doc);
        }}
        onOpenVoiceNote={(doc) => {
          setIsDoctorDetailModalOpen(false);
          handleOpenVoiceNote(doc);
        }}
        onScheduleVisit={(doc) => {
          setIsDoctorDetailModalOpen(false);
          setIsAddVisitModalOpen(true);
        }}
      />

      <AddDoctorModal
        isOpen={isAddDoctorModalOpen}
        onClose={() => setIsAddDoctorModalOpen(false)}
        onDoctorAdded={loadAllData}
      />

      <AddVisitModal
        isOpen={isAddVisitModalOpen}
        onClose={() => setIsAddVisitModalOpen(false)}
        doctors={doctors}
        defaultDoctor={selectedDoctorForDetail}
        onVisitScheduled={loadAllData}
      />

      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        doctors={doctors}
        onTaskCreated={loadAllData}
      />

      <AddPatientOppModal
        isOpen={isAddPatientOppModalOpen}
        onClose={() => setIsAddPatientOppModalOpen(false)}
        doctors={doctors}
        onOppCreated={loadAllData}
      />

      <DayEndSummaryModal
        isOpen={isDayEndSummaryModalOpen}
        onClose={() => setIsDayEndSummaryModalOpen(false)}
      />

      <LogVisitOutcomeModal
        isOpen={isLogOutcomeModalOpen}
        onClose={() => setIsLogOutcomeModalOpen(false)}
        visit={outcomeTargetVisit}
        doctor={outcomeTargetDoctor}
        onOutcomeLogged={loadAllData}
      />
    </div>
  );
}
export default App;
