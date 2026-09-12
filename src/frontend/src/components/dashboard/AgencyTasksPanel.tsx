import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { type AgencyTask } from '../../api/mockData';
import { cn } from '../../lib/utils';

export function AgencyTasksPanel() {
  const queryClient = useQueryClient();
  const { data: tasks = [] } = useQuery<AgencyTask[]>({
    queryKey: ['agency-tasks'],
    queryFn: apiClient.getAgencyTasks,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.updateAgencyTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-tasks'] });
    },
  });

  return (
    <div className="flex-1 overflow-y-auto p-3 bg-[#171A1D]">
      <div className="text-xs font-semibold uppercase tracking-tight text-[#9BA1A8] mb-2">
        Active Agency Assignments ({tasks.length})
      </div>

      <div className="border border-[#2A2E33] bg-[#0E0F11]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#2A2E33] bg-[#1E2226] text-[#9BA1A8] font-medium">
              <th className="p-2 font-normal uppercase tracking-tight">Agency</th>
              <th className="p-2 font-normal uppercase tracking-tight">Zone</th>
              <th className="p-2 font-normal uppercase tracking-tight">Task Type</th>
              <th className="p-2 font-normal uppercase tracking-tight">Status</th>
              <th className="p-2 font-normal uppercase tracking-tight text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2E33]">
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isInProgress = task.status === 'in_progress';

              return (
                <tr
                  key={task.id}
                  className={cn(
                    'hover:bg-[#1E2226]/50',
                    isCompleted && 'text-[#9BA1A8] opacity-75'
                  )}
                >
                  <td className="p-2 font-semibold text-[#E8EAED]">
                    {task.agency_name}
                  </td>
                  <td className="p-2">
                    <span className="text-[#E8EAED]">{task.zone_name}</span>
                    <span className="font-mono text-[#9BA1A8] ml-1.5">[{task.zone_id}]</span>
                  </td>
                  <td className="p-2 uppercase text-[#9BA1A8]">
                    {task.task_type}
                  </td>
                  <td className="p-2">
                    <span
                      className={cn(
                        'font-medium uppercase tracking-tight text-[11px]',
                        isCompleted ? 'text-[#4C7A5E]' : isInProgress ? 'text-[#3E7CB1]' : 'text-[#9BA1A8]'
                      )}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    {task.status === 'assigned' && (
                      <button
                        onClick={() => mutation.mutate({ id: task.id, status: 'in_progress' })}
                        disabled={mutation.isPending}
                        className="px-2 py-1 bg-[#1E2226] border border-[#2A2E33] hover:border-[#3E7CB1] text-[#E8EAED] text-xs transition-none"
                      >
                        Accept
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => mutation.mutate({ id: task.id, status: 'completed' })}
                        disabled={mutation.isPending}
                        className="px-2 py-1 bg-[#1E2226] border border-[#2A2E33] hover:border-[#4C7A5E] text-[#4C7A5E] text-xs transition-none"
                      >
                        Mark complete
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <span className="font-mono text-[11px] text-[#9BA1A8]">Complete</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
