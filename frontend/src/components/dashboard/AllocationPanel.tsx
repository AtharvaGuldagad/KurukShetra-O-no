import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { type Allocation } from '../../api/mockData';
import { cn } from '../../lib/utils';
import { Check, X, Clock, Brain } from 'lucide-react';

export function AllocationPanel() {
  const queryClient = useQueryClient();
  const { data: allocations = [], isLoading } = useQuery<Allocation[]>({
    queryKey: ['allocations'],
    queryFn: apiClient.getAllocations,
    staleTime: 5000, // fast refetch
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.updateAllocationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    },
  });

  if (isLoading) {
    return <div className="p-4 text-slate-500 font-mono text-xs">Loading allocations...</div>;
  }

  // Sort by pending first, then by timestamp
  const sortedAllocations = [...allocations].sort((a, b) => {
    if (a.status === 'pending_approval' && b.status !== 'pending_approval') return -1;
    if (a.status !== 'pending_approval' && b.status === 'pending_approval') return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="flex-1 overflow-y-auto p-3 bg-[#171A1D]">
      <div className="flex justify-between items-center mb-3">
        <div className="text-xs font-semibold uppercase tracking-tight text-[#9BA1A8]">
          AI-Proposed Resource Allocations
        </div>
        <button 
          onClick={() => apiClient.recalculateAllocations()}
          className="text-[10px] uppercase font-bold text-[#E8EAED] bg-[#3E7CB1] px-2 py-1 rounded hover:bg-[#2A5C8A] transition-colors flex items-center gap-1"
        >
          <Brain className="w-3 h-3" /> Force Recalculate
        </button>
      </div>

      <div className="space-y-2">
        {sortedAllocations.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-4">No active allocations.</div>
        ) : (
          sortedAllocations.map(alloc => (
            <div key={alloc.allocation_id} className="border border-[#2A2E33] bg-[#0E0F11] p-3 text-xs flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#E8EAED]">{alloc.resource_type} ({alloc.quantity})</span>
                  <span className="text-[#9BA1A8]">to Zone {alloc.zone_id}</span>
                </div>
                <div className="text-[#9BA1A8] flex items-center gap-2 flex-wrap">
                  <span>From: <span className="text-[#E8EAED]">{alloc.source_depot}</span></span>
                  <span>|</span>
                  <span>By: <span className="text-[#E8EAED]">{alloc.assigned_agency}</span></span>
                </div>
                <div className="text-[#3E7CB1] bg-[#3E7CB1]/10 px-2 py-1 rounded text-[11px] mt-2 inline-flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  {alloc.reasoning}
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {alloc.status === 'pending_approval' ? (
                  <>
                    <button
                      onClick={() => mutation.mutate({ id: alloc.allocation_id, status: 'approved' })}
                      disabled={mutation.isPending}
                      className="px-3 py-1.5 flex items-center gap-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-emerald-950 font-bold tracking-wide rounded transition-colors disabled:opacity-50 border border-emerald-500/30"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => mutation.mutate({ id: alloc.allocation_id, status: 'rejected' })}
                      disabled={mutation.isPending}
                      className="px-3 py-1.5 flex items-center gap-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white font-bold tracking-wide rounded transition-colors disabled:opacity-50 border border-rose-500/30"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                ) : (
                  <span className={cn(
                    "px-3 py-1 text-[11px] uppercase tracking-wider font-bold rounded flex items-center gap-1 border",
                    alloc.status === 'approved' 
                      ? "bg-emerald-950 border-emerald-900 text-emerald-500"
                      : "bg-rose-950 border-rose-900 text-rose-500"
                  )}>
                    {alloc.status === 'approved' ? (
                      <><Check className="w-3 h-3" /> Approved / In Transit</>
                    ) : alloc.status === 'rejected' ? (
                      <><X className="w-3 h-3" /> Rejected</>
                    ) : (
                      <><Clock className="w-3 h-3" /> {String(alloc.status).replace('_', ' ')}</>
                    )}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
