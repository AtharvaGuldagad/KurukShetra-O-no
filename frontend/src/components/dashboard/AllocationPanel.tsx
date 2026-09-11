import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { type Allocation, type InventoryItem } from '../../api/mockData';

export function AllocationPanel() {
  const { data: allocations = [] } = useQuery<Allocation[]>({
    queryKey: ['allocations'],
    queryFn: apiClient.getAllocations,
  });

  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: apiClient.getInventory,
  });

  // Calculate allocated vs remaining per resource type
  const resourceSummary = inventory.map(item => {
    const itemAllocated = allocations
      .filter(a => a.resource_type.toLowerCase() === item.resource_type.toLowerCase())
      .reduce((sum, a) => sum + a.quantity, 0);
    const total = item.baseline_quantity || (item.quantity + itemAllocated);
    const remaining = Math.max(0, total - itemAllocated);
    const allocPct = total > 0 ? Math.min(100, Math.round((itemAllocated / total) * 100)) : 0;

    return {
      name: item.resource_type,
      allocated: itemAllocated,
      remaining,
      total,
      pct: allocPct,
    };
  });

  return (
    <div className="flex-1 overflow-y-auto p-3 bg-[#171A1D]">
      <div className="text-xs font-semibold uppercase tracking-tight text-[#9BA1A8] mb-2">
        Resource Allocation Summary (Allocated vs. Remaining)
      </div>

      <div className="space-y-2.5">
        {resourceSummary.map((res) => (
          <div key={res.name} className="border border-[#2A2E33] bg-[#0E0F11] p-2.5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#E8EAED] uppercase tracking-tight">
                {res.name}
              </span>
              <div className="font-mono text-xs text-[#9BA1A8] flex items-center gap-2">
                <span>
                  Allocated: <strong className="text-[#3E7CB1]">{res.allocated}</strong>
                </span>
                <span>/</span>
                <span>
                  Remaining: <strong className="text-[#E8EAED]">{res.remaining}</strong>
                </span>
                <span className="text-[#9BA1A8]">({res.pct}%)</span>
              </div>
            </div>

            {/* Simple horizontal bar: allocated (#3E7CB1) vs remaining (#2A2E33) */}
            <div className="w-full h-2 bg-[#2A2E33] overflow-hidden flex">
              <div
                className="h-full bg-[#3E7CB1] transition-none"
                style={{ width: `${res.pct}%` }}
                title={`Allocated: ${res.pct}%`}
              />
              <div
                className="h-full bg-[#4C7A5E] opacity-70 transition-none"
                style={{ width: `${100 - res.pct}%` }}
                title={`Remaining: ${100 - res.pct}%`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
