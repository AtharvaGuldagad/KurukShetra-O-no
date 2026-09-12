import React from 'react';
import { 
  type InventoryItem, 
  type ResourceCategory 
} from '../../types/inventory';
import { 
  Truck, 
  Cross, 
  Utensils, 
  Tent, 
  Users, 
  Clock, 
  Plus, 
  SlidersHorizontal,
  PackageSearch
} from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
  onOpenIntake: (depotId?: string, itemName?: string) => void;
  onOpenAdjust: (itemId: string) => void;
}

const getCategoryBadge = (category: ResourceCategory) => {
  switch (category) {
    case 'Vehicles':
      return { icon: <Truck className="w-3 h-3 text-cyan-400" />, color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' };
    case 'Medical':
      return { icon: <Cross className="w-3 h-3 text-emerald-400" />, color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' };
    case 'Food & Water':
      return { icon: <Utensils className="w-3 h-3 text-amber-400" />, color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };
    case 'Shelter & Rescue':
      return { icon: <Tent className="w-3 h-3 text-indigo-400" />, color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' };
    case 'Personnel':
      return { icon: <Users className="w-3 h-3 text-purple-400" />, color: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
  }
};

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  onOpenIntake,
  onOpenAdjust,
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <PackageSearch className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-white">No items found matching current filters</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Try resetting your search query or switching to another category.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px] font-semibold">
            <tr>
              <th className="py-3 px-4">Supply Item</th>
              <th className="py-3 px-4">Location / Depot</th>
              <th className="py-3 px-4">Agency</th>
              <th className="py-3 px-4 text-right">Available</th>
              <th className="py-3 px-4 text-right">In-Transit</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Quick Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/50 text-slate-200">
            {items.map((item) => {
              const totalStock = item.availableQuantity + item.inTransitQuantity;
              const isDepleted = item.availableQuantity === 0;
              const isLowStock = !isDepleted && item.availableQuantity <= item.minimumThreshold;
              const badge = getCategoryBadge(item.category);

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  {/* Item Name & Category */}
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-semibold text-white text-xs">{item.name}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${badge.color}`}>
                          {badge.icon}
                          <span>{item.category}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.unit}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Depot */}
                  <td className="py-3 px-4">
                    <div className="text-slate-300 font-medium">{item.depotName}</div>
                    <div className="text-[10px] text-slate-500">{item.lastUpdated}</div>
                  </td>

                  {/* Agency */}
                  <td className="py-3 px-4">
                    <span className="text-slate-300 text-xs">
                      {item.agency}
                    </span>
                  </td>

                  {/* Available Stock */}
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-mono text-sm font-bold ${
                        isDepleted
                          ? 'text-rose-400'
                          : isLowStock
                          ? 'text-amber-400'
                          : 'text-slate-100'
                      }`}
                    >
                      {item.availableQuantity.toLocaleString()}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono">
                      reserve min: {item.minimumThreshold}
                    </div>
                  </td>

                  {/* In-Transit */}
                  <td className="py-3 px-4 text-right">
                    {item.inTransitQuantity > 0 ? (
                      <div>
                        <span className="font-mono text-xs text-blue-400 font-semibold inline-flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-blue-400 inline" />
                          <span>+{item.inTransitQuantity.toLocaleString()}</span>
                        </span>
                        <div className="text-[10px] text-slate-500">routed</div>
                      </div>
                    ) : (
                      <span className="text-slate-600 font-mono">—</span>
                    )}
                  </td>

                  {/* Total */}
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-300">
                    {totalStock.toLocaleString()}
                  </td>

                  {/* Status Pill */}
                  <td className="py-3 px-4 text-center">
                    {isDepleted ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Low Reserve
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        In Stock
                      </span>
                    )}
                  </td>

                  {/* Quick Action Buttons */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onOpenIntake(item.depotId, item.name)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium flex items-center space-x-1 transition"
                        title="Intake more of this item"
                      >
                        <Plus className="w-3 h-3 text-blue-400" />
                        <span>Restock</span>
                      </button>
                      <button
                        onClick={() => onOpenAdjust(item.id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 text-[11px] font-medium flex items-center space-x-1 transition"
                        title="Report damaged, lost, or expired stock"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>Adjust</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Showing {items.length} supplies across disaster staging hubs</span>
        <span className="text-slate-500 font-mono text-[10px]">Real-Time Sync</span>
      </div>
    </div>
  );
};
