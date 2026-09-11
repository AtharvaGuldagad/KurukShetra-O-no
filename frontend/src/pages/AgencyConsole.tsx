import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { type AgencyTask } from '../api/mockData';
import { cn } from '../lib/utils';
import { Check } from 'lucide-react';

const AGENCIES = [
  { id: 'agency_fire_2', name: 'Fire Dept Unit 2' },
  { id: 'agency_redcross_4', name: 'Red Cross Unit 4' },
  { id: 'agency_fema', name: 'FEMA Response Team' }
];

export default function AgencyConsole() {
  const queryClient = useQueryClient();
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(AGENCIES[0].id);

  // Shift capacity set once per shift
  const [shiftPersonnel, setShiftPersonnel] = useState<number>(24);
  const [shiftVehicles, setShiftVehicles] = useState<number>(6);
  const [shiftSaved, setShiftSaved] = useState(false);

  const { data: allTasks = [], isLoading, error } = useQuery<AgencyTask[]>({
    queryKey: ['agency-tasks'],
    queryFn: apiClient.getAgencyTasks,
    staleTime: 10000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.updateAgencyTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-tasks'] });
    },
  });

  const handleUpdateShift = (e: React.FormEvent) => {
    e.preventDefault();
    setShiftSaved(true);
    setTimeout(() => setShiftSaved(false), 2000);
  };

  // Filter tasks for current agency
  const agencyTasks = allTasks.filter(t => t.agency_id === selectedAgencyId);

  // Sort tasks: Active/Assigned/InProgress first, Completed visually recede and move to bottom
  const sortedTasks = [...agencyTasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return 0;
  });

  if (error) {
    return (
      <div className="p-8 text-xs font-mono text-[#C4432E] bg-[#0E0F11]">
        ERROR: Failed to retrieve agency task queue.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0E0F11] overflow-hidden text-[#E8EAED]">
      {/* Header Strip */}
      <div className="h-10 px-4 border-b border-[#2A2E33] bg-[#171A1D] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-tight text-[#E8EAED]">
            Agency Task Console
          </span>
          <span className="text-[#2A2E33]">|</span>
          <div className="flex items-center gap-1">
            {AGENCIES.map(agency => (
              <button
                key={agency.id}
                onClick={() => setSelectedAgencyId(agency.id)}
                className={cn(
                  'px-2.5 py-1 text-xs uppercase tracking-tight border transition-none',
                  selectedAgencyId === agency.id
                    ? 'border-[#3E7CB1] bg-[#1E2226] text-[#E8EAED]'
                    : 'border-transparent text-[#9BA1A8] hover:text-[#E8EAED]'
                )}
              >
                {agency.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Part 4: Capacity input sits in a small fixed panel at the top of the console (set once per shift) */}
      <div className="p-4 border-b border-[#2A2E33] bg-[#171A1D] shrink-0">
        <form onSubmit={handleUpdateShift} className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-tight text-[#9BA1A8] block mb-1">
              Active Agency Unit
            </span>
            <span className="font-semibold text-sm text-[#E8EAED]">
              {AGENCIES.find(a => a.id === selectedAgencyId)?.name}
            </span>
          </div>

          <div className="w-[1px] h-8 bg-[#2A2E33] mx-2 hidden sm:block" />

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-tight text-[#9BA1A8] block mb-1">
              Shift Personnel Capacity
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                value={shiftPersonnel}
                onChange={(e) => setShiftPersonnel(Number(e.target.value))}
                className="w-20 bg-[#0E0F11] border border-[#2A2E33] focus:border-[#3E7CB1] px-2 py-1 font-mono text-xs text-[#E8EAED] outline-none"
              />
              <span className="text-xs text-[#9BA1A8]">staff</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-tight text-[#9BA1A8] block mb-1">
              Deployed Vehicles / Units
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={shiftVehicles}
                onChange={(e) => setShiftVehicles(Number(e.target.value))}
                className="w-20 bg-[#0E0F11] border border-[#2A2E33] focus:border-[#3E7CB1] px-2 py-1 font-mono text-xs text-[#E8EAED] outline-none"
              />
              <span className="text-xs text-[#9BA1A8]">units</span>
            </div>
          </div>

          <div className="self-end ml-auto flex items-center gap-2">
            {shiftSaved && (
              <span className="text-xs text-[#4C7A5E] flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Shift baseline logged
              </span>
            )}
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#1E2226] border border-[#2A2E33] hover:border-[#3E7CB1] text-[#E8EAED] text-xs uppercase tracking-tight font-semibold transition-none"
            >
              Update Shift Baseline
            </button>
          </div>
        </form>
      </div>

      {/* Part 4: Task Queue as a vertical list (one row per task) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-[#9BA1A8] uppercase tracking-tight mb-2">
          <span>Assigned Task Queue ({sortedTasks.length})</span>
          <span className="font-mono text-[11px]">ORDERED BY OPERATIONAL STATE</span>
        </div>

        {isLoading ? (
          <div className="text-xs font-mono text-[#9BA1A8]">FETCHING DISPATCH QUEUE...</div>
        ) : sortedTasks.length === 0 ? (
          <div className="p-8 border border-[#2A2E33] bg-[#171A1D] text-center text-xs text-[#9BA1A8]">
            No active dispatch tasks assigned to {AGENCIES.find(a => a.id === selectedAgencyId)?.name}.
          </div>
        ) : (
          <div className="border border-[#2A2E33] bg-[#171A1D] divide-y divide-[#2A2E33]">
            {sortedTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isInProgress = task.status === 'in_progress';
              const isAssigned = task.status === 'assigned';

              return (
                <div
                  key={task.id}
                  className={cn(
                    'p-3 flex items-center justify-between gap-4 transition-none',
                    isCompleted ? 'bg-[#0E0F11]/60 text-[#9BA1A8]' : 'bg-[#171A1D] text-[#E8EAED]'
                  )}
                >
                  {/* Task Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-bold text-sm truncate',
                        isCompleted ? 'text-[#9BA1A8]' : 'text-[#E8EAED]'
                      )}>
                        {task.zone_name}
                      </span>
                      <span className="font-mono text-xs text-[#9BA1A8]">
                        [{task.zone_id}]
                      </span>
                      <span className="w-1 h-1 bg-[#2A2E33]" />
                      <span className="text-xs uppercase text-[#9BA1A8]">
                        {task.task_type}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-4 text-xs text-[#9BA1A8]">
                      <span>
                        Personnel assigned: <strong className="font-mono text-[#E8EAED]">{task.capacity}</strong>
                      </span>
                      <span>
                        Status:{' '}
                        <span className={cn(
                          'font-semibold uppercase tracking-tight text-[11px] transition-opacity duration-300',
                          isCompleted ? 'text-[#9BA1A8]' : isInProgress ? 'text-[#3E7CB1]' : 'text-[#B8A13A]'
                        )}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Part 4 Status Controls: Three plain buttons in sequence labeled by the action they perform */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Action 1: Accept */}
                    <button
                      onClick={() => mutation.mutate({ id: task.id, status: 'in_progress' })}
                      disabled={!isAssigned || mutation.isPending}
                      className={cn(
                        'px-3 py-1 text-xs uppercase tracking-tight border transition-none',
                        isAssigned
                          ? 'border-[#3E7CB1] bg-[#3E7CB1]/20 text-[#E8EAED] hover:bg-[#3E7CB1] hover:text-white cursor-pointer'
                          : 'border-transparent text-[#9BA1A8]/40 cursor-not-allowed'
                      )}
                    >
                      Accept
                    </button>

                    {/* Action 2: Mark in progress */}
                    <button
                      onClick={() => mutation.mutate({ id: task.id, status: 'in_progress' })}
                      disabled={isInProgress || isCompleted || mutation.isPending}
                      className={cn(
                        'px-3 py-1 text-xs uppercase tracking-tight border transition-none',
                        isInProgress
                          ? 'border-[#3E7CB1] bg-[#1E2226] text-[#3E7CB1]'
                          : 'border-transparent text-[#9BA1A8]/40 cursor-not-allowed'
                      )}
                    >
                      In progress
                    </button>

                    {/* Action 3: Mark complete */}
                    <button
                      onClick={() => mutation.mutate({ id: task.id, status: 'completed' })}
                      disabled={isCompleted || mutation.isPending}
                      className={cn(
                        'px-3 py-1 text-xs uppercase tracking-tight border transition-none',
                        isInProgress
                          ? 'border-[#4C7A5E] bg-[#4C7A5E]/20 text-[#4C7A5E] hover:bg-[#4C7A5E] hover:text-white cursor-pointer'
                          : isCompleted
                          ? 'border-[#2A2E33] bg-[#0E0F11] text-[#9BA1A8] cursor-not-allowed'
                          : 'border-transparent text-[#9BA1A8]/40 cursor-not-allowed'
                      )}
                    >
                      {isCompleted ? 'Completed' : 'Mark complete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
