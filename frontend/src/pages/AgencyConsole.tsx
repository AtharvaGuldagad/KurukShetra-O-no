import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { type AgencyTask } from '../api/mockData';
import { cn } from '../lib/utils';
import {
  Radio, RefreshCw, AlertCircle, CheckCircle2, Play, Circle, Briefcase, ChevronDown
} from 'lucide-react';

const AGENCIES = [
  { id: 'agency_fire_2', name: 'Fire Dept Unit 2' },
  { id: 'agency_redcross_4', name: 'Red Cross Unit 4' },
  { id: 'agency_fema', name: 'FEMA Response Team' }
];

function TaskStatusIcon({ status }: { status: AgencyTask['status'] }) {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    case 'in_progress': return <Play className="w-5 h-5 text-blue-400" />;
    case 'assigned': return <Circle className="w-5 h-5 text-slate-400" />;
    default: return null;
  }
}

function TaskCard({ task }: { task: AgencyTask }) {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: (newStatus: AgencyTask['status']) => apiClient.updateAgencyTaskStatus(task.id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-tasks'] });
    },
  });

  const isPending = updateStatus.isPending;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:bg-slate-800 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <TaskStatusIcon status={task.status} />
          <div>
            <h3 className="text-base font-semibold text-slate-200">{task.zone_name}</h3>
            <p className="text-sm text-slate-400 font-mono text-xs">{task.zone_id}</p>
          </div>
        </div>
        
        <div className="text-right">
          <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
            task.status === 'completed' && "bg-green-500/10 text-green-400 border border-green-500/20",
            task.status === 'in_progress' && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
            task.status === 'assigned' && "bg-slate-500/10 text-slate-300 border border-slate-500/20"
          )}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-slate-900/50 rounded-lg text-sm">
        <div>
          <span className="block text-slate-500 text-xs mb-1">Task Type</span>
          <span className="text-slate-300 capitalize">{task.task_type}</span>
        </div>
        <div>
          <span className="block text-slate-500 text-xs mb-1">Capacity</span>
          <span className="text-slate-300">{task.capacity} personnel</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {task.status === 'assigned' && (
          <button
            onClick={() => updateStatus.mutate('in_progress')}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Start Task
          </button>
        )}
        
        {task.status === 'in_progress' && (
          <button
            onClick={() => updateStatus.mutate('completed')}
            disabled={isPending}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Mark Complete
          </button>
        )}

        {task.status === 'completed' && (
          <div className="px-4 py-2 bg-slate-800 text-slate-400 text-sm font-medium rounded-lg flex items-center gap-2 cursor-not-allowed">
            <CheckCircle2 className="w-4 h-4" />
            Task Completed
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgencyConsole() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(AGENCIES[0].id);

  const { data: allTasks = [], isLoading, error, isFetching } = useQuery({
    queryKey: ['agency-tasks'],
    queryFn: apiClient.getAgencyTasks,
    staleTime: 10000,
  });

  const agencyTasks = allTasks.filter(t => t.agency_id === selectedAgencyId);

  if (error) {
    return (
      <div className="p-8 text-red-400 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        Failed to load agency tasks.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 mr-auto">
          <div className="p-2 bg-slate-800 rounded-lg">
            <Radio className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100 leading-tight">Agency Console</h1>
            <p className="text-xs text-slate-400">Manage field tasks and report status</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-sm text-slate-400 mr-2">
            <Briefcase className="w-4 h-4" />
            <span>View as Agency:</span>
          </div>
          <select
            value={selectedAgencyId}
            onChange={e => setSelectedAgencyId(e.target.value)}
            className="w-full sm:w-64 py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-teal-500 transition-colors appearance-none"
          >
            {AGENCIES.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <button
            onClick={() => {}}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Active tasks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-slate-200">Active Tasks</h2>
              <span className="text-sm text-slate-500">
                {agencyTasks.filter(t => t.status !== 'completed').length} active
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-40 bg-slate-800/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : agencyTasks.filter(t => t.status !== 'completed').length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
                <CheckCircle2 className="w-10 h-10 mb-2 text-slate-700" />
                <p>All tasks completed — nothing pending.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {agencyTasks.filter(t => t.status !== 'completed').map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>

          {/* Completed tasks — collapsible archive */}
          {agencyTasks.filter(t => t.status === 'completed').length > 0 && (
            <CompletedSection tasks={agencyTasks.filter(t => t.status === 'completed')} />
          )}
        </div>
      </div>
    </div>
  );
}

function CompletedSection({ tasks }: { tasks: AgencyTask[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-slate-900/60 hover:bg-slate-800/60 transition-colors text-left"
      >
        <span className="text-sm font-medium text-slate-400">
          Completed Tasks ({tasks.length})
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="grid gap-4 p-4 bg-slate-950/40">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
