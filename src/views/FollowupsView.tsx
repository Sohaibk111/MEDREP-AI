import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  User, 
  Filter
} from 'lucide-react';
import { FollowupTask, Doctor } from '../types';

interface FollowupsViewProps {
  tasks: FollowupTask[];
  doctors: Doctor[];
  onAddTask: () => void;
  onToggleTaskComplete: (taskId: string, currentStatus: boolean) => void;
  onOpenDoctorDetail: (doctor: Doctor) => void;
}

export const FollowupsView: React.FC<FollowupsViewProps> = ({
  tasks,
  doctors,
  onAddTask,
  onToggleTaskComplete,
  onOpenDoctorDetail
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'high'>('all');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.isCompleted;
    if (filter === 'completed') return t.isCompleted;
    if (filter === 'high') return t.priority === 'high';
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">
            Follow-up Commitments & Field Tasks
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Deliver sample kits, follow up on trials, submit brochures to doctor gatekeepers
          </p>
        </div>
        <button
          onClick={onAddTask}
          className="px-4 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-sky-400" />
          <span>New Follow-up Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#e2e8f0] w-fit shadow-2xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            filter === 'all' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            filter === 'pending' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Pending ({tasks.filter(t => !t.isCompleted).length})
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            filter === 'high' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          High Priority ({tasks.filter(t => t.priority === 'high').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            filter === 'completed' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Completed ({tasks.filter(t => t.isCompleted).length})
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const doc = doctors.find(d => d.id === task.doctorId);
          return (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs ${
                task.isCompleted
                  ? 'bg-slate-50/70 border-slate-200 opacity-70'
                  : 'bg-white border-[#e2e8f0] hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <button
                  onClick={() => onToggleTaskComplete(task.id, task.isCompleted)}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                    task.isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 hover:border-slate-400 bg-[#f8fafc]'
                  }`}
                >
                  {task.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>

                <div>
                  <h4 className={`text-sm font-semibold leading-snug ${task.isCompleted ? 'line-through text-[#94a3b8]' : 'text-[#0f172a]'}`}>
                    {task.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#64748b]">
                    {doc && (
                      <span
                        onClick={() => onOpenDoctorDetail(doc)}
                        className="font-bold text-[#0ea5e9] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <User className="w-3 h-3" />
                        <span>{doc.name} ({doc.hospital})</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#94a3b8]" />
                      <span>Due: <strong>{task.dueDate}</strong></span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  task.priority === 'high'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : task.priority === 'medium'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {task.priority}
                </span>
                <span className="text-[10px] text-[#94a3b8]">
                  {task.isCompleted ? 'Done' : 'Pending'}
                </span>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-[#0f172a] mt-2">No tasks found in this view</p>
          </div>
        )}
      </div>
    </div>
  );
};
