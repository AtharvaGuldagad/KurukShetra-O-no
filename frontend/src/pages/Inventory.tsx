import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { type InventoryItem } from '../api/mockData';
import { cn } from '../lib/utils';
import { RefreshCw, Edit, Check, X } from 'lucide-react';

export default function Inventory() {
  const queryClient = useQueryClient();
  const { data: inventory, isLoading, isError, refetch } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: apiClient.getInventory,
  });

  const updateMutation = useMutation<InventoryItem, Error, { id: string; updates: Partial<InventoryItem> }>({
    mutationFn: ({ id, updates }) => apiClient.updateInventory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      alert('Inventory updated successfully');
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to update inventory');
    },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditQty(item.quantity);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQty(0);
  };

  const submitEdit = (id: string) => {
    updateMutation.mutate({ id, updates: { quantity: editQty } });
    setEditingId(null);
  };

  if (isLoading) return <div className="p-8 text-slate-400">Loading inventory…</div>;
  if (isError) return <div className="p-8 text-red-400">Error loading inventory.</div>;

  return (
    <div className="p-8 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-200">Resource Inventory</h2>
        <button
          onClick={() => refetch()}
          className={cn(
            'flex items-center gap-1 px-3 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors'
          )}
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      <table className="min-w-full text-sm text-left text-slate-300">
        <thead className="bg-slate-800">
          <tr>
            <th className="px-4 py-2">Resource</th>
            <th className="px-4 py-2">Depot</th>
            <th className="px-4 py-2">Agency</th>
            <th className="px-4 py-2">Quantity</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory?.map((item) => (
            <tr key={item.id} className="border-b border-slate-700 hover:bg-slate-800/50">
              <td className="px-4 py-2">{item.resource_type}</td>
              <td className="px-4 py-2">{item.depot}</td>
              <td className="px-4 py-2">{item.agency}</td>
              <td className="px-4 py-2">
                {editingId === item.id ? (
                  <input
                    type="number"
                    min="0"
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className="w-20 p-1 rounded bg-slate-900 text-slate-200 border border-slate-600"
                  />
                ) : (
                  item.quantity
                )}
              </td>
              <td className="px-4 py-2 flex gap-2 items-center">
                {editingId === item.id ? (
                  <>
                    <button
                      onClick={() => submitEdit(item.id)}
                      className={cn('p-1 text-green-400 rounded hover:bg-slate-700')}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className={cn('p-1 text-red-400 rounded hover:bg-slate-700')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(item)}
                    className={cn('p-1 text-slate-400 rounded hover:bg-slate-700')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
