import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { AlertTriangle, CheckCircle, Package, Clock, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { type Allocation } from '../../api/mockData';

export function AllocationPanel() {
  const { data: allocations = [], isLoading, error } = useQuery<Allocation[]>({
    queryKey: ['allocations'],
    queryFn: apiClient.getAllocations,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <div className="p-4 text-slate-500 text-sm">Loading allocations...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-400 text-sm">Failed to load allocations.</div>;
  }

  if (allocations.length === 0) {
    return <div className="p-4 text-slate-500 text-sm">No active allocations.</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
      {allocations.map(alloc => (
        <div
          key={alloc.allocation_id}
          className={cn(
            "p-3 rounded-lg border bg-slate-800/80 transition-colors flex flex-col gap-2",
            alloc.requires_human_approval 
              ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]" 
              : "border-slate-700"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-200">
                {alloc.quantity}x {alloc.resource_type.replace('_', ' ')}
              </span>
            </div>
            {alloc.requires_human_approval ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950/50 text-red-400 border border-red-900/50">
                <ShieldAlert className="w-3 h-3" />
                Needs Approval
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-950/50 text-green-400 border border-green-900/50">
                <CheckCircle className="w-3 h-3" />
                Auto-Approved
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm mt-1">
            <div>
              <span className="text-slate-500 text-xs block mb-0.5">Destination</span>
              <span className="text-slate-300 font-mono text-xs">{alloc.zone_id}</span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block mb-0.5">Assigned Agency</span>
              <span className="text-blue-300">{alloc.assigned_agency}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 text-xs block mb-0.5">Reasoning (Agent B)</span>
              <p className="text-slate-400 text-xs leading-relaxed italic border-l-2 border-slate-700 pl-2">
                "{alloc.reasoning}"
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{new Date(alloc.timestamp).toLocaleTimeString()}</span>
            </div>
            {alloc.requires_human_approval && (
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs font-medium rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
                  Reject
                </button>
                <button className="px-3 py-1 text-xs font-medium rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 transition-colors">
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
