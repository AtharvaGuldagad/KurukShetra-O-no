import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { type InventoryItem } from '../api/mockData';
import { cn } from '../lib/utils';
import { RefreshCw, Check } from 'lucide-react';

export default function Inventory() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<number>(0);
  const [savedId, setSavedId] = useState<string | null>(null);

  const { data: inventory = [], isLoading, error, isFetching, refetch } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: apiClient.getInventory,
  });

  const updateMutation = useMutation<InventoryItem, Error, { id: string; quantity: number }>({
    mutationFn: ({ id, quantity }) => apiClient.updateInventory(id, { quantity }),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSavedId(item.id);
      setTimeout(() => setSavedId(null), 2000);
    },
  });

  const handleStartEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditVal(item.quantity);
  };

  const handleCommitEdit = (id: string) => {
    if (editVal >= 0) {
      updateMutation.mutate({ id, quantity: editVal });
    }
    setEditingId(null);
  };

  if (error) {
    return (
      <div className="p-8 text-xs font-mono text-[#C4432E] bg-[#0E0F11]">
        ERROR: Failed to retrieve inventory manifest.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0E0F11] overflow-hidden text-[#E8EAED]">
      {/* Header bar */}
      <div className="h-10 px-4 border-b border-[#2A2E33] bg-[#171A1D] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-tight text-[#E8EAED]">
            Resource Depot Inventory
          </span>
          <span className="text-[#2A2E33]">|</span>
          <span className="text-xs text-[#9BA1A8]">
            {inventory.length} Stock Records Monitored
          </span>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs uppercase tracking-tight bg-[#1E2226] border border-[#2A2E33] hover:border-[#3E7CB1] text-[#E8EAED] transition-none disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3 h-3", isFetching && "animate-spin")} />
          Sync
        </button>
      </div>

      {/* Inline notification banner when updated */}
      {savedId && (
        <div className="px-4 py-1.5 bg-[#4C7A5E]/15 border-b border-[#4C7A5E] text-xs text-[#E8EAED] flex items-center gap-2 shrink-0">
          <Check className="w-3.5 h-3.5 text-[#4C7A5E]" />
          <span>Stock level updated. Agent B re-allocation recalculation triggered.</span>
        </div>
      )}

      {/* Main Table View */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="text-xs font-mono text-[#9BA1A8]">READING INVENTORY BUFFER...</div>
        ) : (
          <div className="border border-[#2A2E33] bg-[#171A1D]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2A2E33] bg-[#1E2226] text-[#9BA1A8]">
                  <th className="w-1 p-0"></th>
                  <th className="p-2.5 font-semibold uppercase tracking-tight">Resource Type</th>
                  <th className="p-2.5 font-semibold uppercase tracking-tight">Depot Location</th>
                  <th className="p-2.5 font-semibold uppercase tracking-tight">Owning Agency</th>
                  <th className="p-2.5 font-semibold uppercase tracking-tight text-right">Quantity Available</th>
                  <th className="p-2.5 font-semibold uppercase tracking-tight text-right">Baseline Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2E33]">
                {inventory.map((item) => {
                  const pct = item.baseline_quantity > 0 ? (item.quantity / item.baseline_quantity) : 1;
                  const isCritical = pct < 0.25;
                  const isHigh = pct >= 0.25 && pct < 0.50;
                  const isEditing = editingId === item.id;

                  // Left-edge bar color per Part 3
                  const barColor = isCritical ? '#C4432E' : isHigh ? '#C97A2E' : 'transparent';

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'hover:bg-[#1E2226]/60 transition-none',
                        isEditing && 'bg-[#1E2226]'
                      )}
                    >
                      {/* Left-edge low-stock bar (3px) */}
                      <td className="w-[3px] p-0" style={{ backgroundColor: barColor }} />

                      <td className="p-2.5 font-semibold text-[#E8EAED]">
                        {item.resource_type}
                      </td>

                      <td className="p-2.5 text-[#9BA1A8]">
                        {item.depot}
                      </td>

                      <td className="p-2.5 text-[#E8EAED]">
                        {item.agency}
                      </td>

                      {/* Right-aligned quantity column with IBM Plex Mono and inline click-to-edit */}
                      <td className="p-2.5 text-right font-mono">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              autoFocus
                              value={editVal}
                              onChange={(e) => setEditVal(Number(e.target.value))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCommitEdit(item.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="w-20 bg-[#0E0F11] border border-[#3E7CB1] text-right font-mono text-xs px-1.5 py-0.5 text-[#E8EAED] outline-none"
                            />
                            <button
                              onClick={() => handleCommitEdit(item.id)}
                              className="px-1.5 py-0.5 bg-[#3E7CB1] text-[#E8EAED] text-[11px] font-sans uppercase font-bold"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            title="Click to update quantity"
                            className="hover:underline font-mono text-xs text-[#E8EAED] cursor-pointer"
                          >
                            {item.quantity.toLocaleString()}
                          </button>
                        )}
                      </td>

                      <td className="p-2.5 text-right font-mono text-[#9BA1A8] text-[11px]">
                        {Math.round(pct * 100)}% of baseline ({item.baseline_quantity})
                        {isCritical && (
                          <span className="ml-2 font-bold text-[#C4432E] uppercase font-sans text-[10px]">
                            CRITICAL
                          </span>
                        )}
                        {isHigh && (
                          <span className="ml-2 font-bold text-[#C97A2E] uppercase font-sans text-[10px]">
                            LOW
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
