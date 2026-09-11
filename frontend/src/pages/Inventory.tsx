import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { type InventoryItem } from '../api/mockData';
import { cn } from '../lib/utils';
import { RefreshCw, Edit, Check, X, Package, AlertCircle, TrendingDown } from 'lucide-react';

function QuantityBar({ quantity, baseline }: { quantity: number; baseline: number }) {
  const pct = Math.min(100, Math.round((quantity / baseline) * 100));
  const color = pct < 40 ? 'bg-red-500' : pct < 70 ? 'bg-yellow-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function Inventory() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [savedId, setSavedId] = useState<string | null>(null);

  const { data: inventory, isLoading, isError, isFetching, refetch } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: apiClient.getInventory,
  });

  const updateMutation = useMutation<InventoryItem, Error, { id: string; updates: Partial<InventoryItem> }>({
    mutationFn: ({ id, updates }) => apiClient.updateInventory(id, updates),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSavedId(item.id);
      setTimeout(() => setSavedId(null), 2500);
    },
  });

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditQty(item.quantity);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const submitEdit = (id: string) => {
    updateMutation.mutate({ id, updates: { quantity: editQty } });
    setEditingId(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-red-400 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        Failed to load inventory. Check your connection.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 mr-auto">
          <div className="p-2 bg-slate-800 rounded-lg">
            <Package className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100 leading-tight">Resource Inventory</h1>
            <p className="text-xs text-slate-400">Track and update field resource quantities</p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-sm"
        >
          <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {savedId && (
            <div className="mb-4 px-4 py-3 bg-emerald-900/40 border border-emerald-700/50 rounded-lg text-emerald-300 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <Check className="w-4 h-4" />
              Inventory updated. Agent B is recalculating allocations…
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">Depot</th>
                  <th className="px-5 py-3">Agency</th>
                  <th className="px-5 py-3">Quantity / Stock Level</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {inventory?.map((item) => {
                  const isLow = item.quantity < item.baseline_quantity * 0.4;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {isLow && <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />}
                          <span className={cn("font-medium", isLow ? "text-red-300" : "text-slate-200")}>
                            {item.resource_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono text-xs">{item.depot}</td>
                      <td className="px-5 py-4 text-slate-400">{item.agency}</td>
                      <td className="px-5 py-4 min-w-48">
                        {editingId === item.id ? (
                          <input
                            type="number"
                            min="0"
                            value={editQty}
                            onChange={(e) => setEditQty(Number(e.target.value))}
                            className="w-24 px-2 py-1 rounded-lg bg-slate-900 text-slate-200 border border-blue-500 focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <div className="space-y-1.5">
                            <span className={cn("font-semibold tabular-nums", isLow ? "text-red-400" : "text-slate-200")}>
                              {item.quantity.toLocaleString()}
                              <span className="text-slate-600 font-normal text-xs ml-1">/ {item.baseline_quantity.toLocaleString()}</span>
                            </span>
                            <QuantityBar quantity={item.quantity} baseline={item.baseline_quantity} />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2 items-center justify-end">
                          {editingId === item.id ? (
                            <>
                              <button
                                onClick={() => submitEdit(item.id)}
                                className="p-1.5 text-green-400 rounded-lg hover:bg-slate-700 transition-colors"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 text-red-400 rounded-lg hover:bg-slate-700 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-slate-200 transition-colors"
                              title="Edit quantity"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
