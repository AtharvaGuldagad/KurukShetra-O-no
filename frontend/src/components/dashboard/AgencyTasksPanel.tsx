import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Truck, CheckCircle2, CircleDashed, ArrowRightCircle } from 'lucide-react';

import { type AgencyTask } from '../../api/mockData';

export function AgencyTasksPanel() {
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading, error } = useQuery<AgencyTask[]>({
    queryKey: ['agency-tasks'],
    queryFn: apiClient.getAgencyTasks,
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.updateAgencyTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-tasks'] });
    },
  });

  if (isLoading) {
    return <div className="p-4 text-slate-500 text-sm">Loading agency tasks...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-400 text-sm">Failed to load agency tasks.</div>;
  }

  if (tasks.length === 0) {
    return <div className="p-4 text-slate-500 text-sm">No agency tasks assigned.</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
      {tasks.map(task => (
        <div key={task.id} className="p-3 rounded-lg border border-slate-700 bg-slate-800/80 transition-colors flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-200">{task.agency_name}</span>
            </div>
            {task.status === 'completed' && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-950/50 text-green-400 border border-green-900/50">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
            )}
            {task.status === 'in_progress' && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950/50 text-blue-400 border border-blue-900/50">
                <ArrowRightCircle className="w-3 h-3" /> In Progress
              </span>
            )}
            {task.status === 'assigned' && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                <CircleDashed className="w-3 h-3" /> Assigned
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mt-1">
            <div>
              <span className="text-slate-500 text-xs block mb-0.5">Destination Zone</span>
              <span className="text-slate-300 font-medium text-xs">{task.zone_name}</span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block mb-0.5">Task Type</span>
              <span className="text-slate-300 capitalize text-xs">{task.task_type}</span>
            </div>
          </div>

          <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-700/50 gap-2">
            {task.status === 'assigned' && (
              <button
                onClick={() => mutation.mutate({ id: task.id, status: 'in_progress' })}
                disabled={mutation.isPending}
                className="px-3 py-1 text-xs font-medium rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 transition-colors disabled:opacity-50"
              >
                Mark In Progress
              </button>
            )}
            {task.status === 'in_progress' && (
              <button
                onClick={() => mutation.mutate({ id: task.id, status: 'completed' })}
                disabled={mutation.isPending}
                className="px-3 py-1 text-xs font-medium rounded bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30 transition-colors disabled:opacity-50"
              >
                Mark Completed
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
