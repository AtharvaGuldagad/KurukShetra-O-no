import React from 'react';
import { 
  Package, 
  Truck, 
  Building2, 
  AlertCircle,
  Ship,
  Cross,
  Utensils
} from 'lucide-react';
import { type InventoryItem, type Depot } from '../../types/inventory';

interface GlobalMetricsCardsProps {
  inventory: InventoryItem[];
  depots: Depot[];
}

export const GlobalMetricsCards: React.FC<GlobalMetricsCardsProps> = ({ inventory, depots }) => {
  const rescueBoats = inventory
    .filter((i) => i.name.toLowerCase().includes('boat'))
    .reduce((acc, curr) => ({
      available: acc.available + curr.availableQuantity,
      inTransit: acc.inTransit + curr.inTransitQuantity,
    }), { available: 0, inTransit: 0 });

  const traumaKits = inventory
    .filter((i) => i.name.toLowerCase().includes('trauma') || i.name.toLowerCase().includes('surgical'))
    .reduce((acc, curr) => ({
      available: acc.available + curr.availableQuantity,
      inTransit: acc.inTransit + curr.inTransitQuantity,
    }), { available: 0, inTransit: 0 });

  const foodPacks = inventory
    .filter((i) => i.name.toLowerCase().includes('food') || i.name.toLowerCase().includes('mre'))
    .reduce((acc, curr) => ({
      available: acc.available + curr.availableQuantity,
      inTransit: acc.inTransit + curr.inTransitQuantity,
    }), { available: 0, inTransit: 0 });

  const totalAvailable = inventory.reduce((sum, item) => sum + item.availableQuantity, 0);
  const totalInTransit = inventory.reduce((sum, item) => sum + item.inTransitQuantity, 0);

  const operationalDepots = depots.filter((d) => d.status === 'operational').length;
  const compromisedDepots = depots.filter((d) => d.status === 'compromised').length;
  const lowStockCount = inventory.filter((i) => i.availableQuantity <= i.minimumThreshold).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Stock */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Available Stock</span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-white">
          {totalAvailable.toLocaleString()}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
          <span>In-transit en route:</span>
          <span className="font-mono text-blue-400 font-semibold">+{totalInTransit.toLocaleString()}</span>
        </div>
      </div>

      {/* 2. Critical Mission Supplies */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Key Assets Ready</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Ship className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rescue Boats:</span>
            </span>
            <span className="font-mono font-bold text-white">
              {rescueBoats.available} <span className="text-slate-500 font-normal">({rescueBoats.inTransit} en route)</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Cross className="w-3.5 h-3.5 text-emerald-400" />
              <span>Trauma Kits:</span>
            </span>
            <span className="font-mono font-bold text-white">
              {traumaKits.available} <span className="text-slate-500 font-normal">({traumaKits.inTransit} en route)</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
              <span>Food Packs:</span>
            </span>
            <span className="font-mono font-bold text-white">
              {(foodPacks.available / 1000).toFixed(1)}k <span className="text-slate-500 font-normal">({(foodPacks.inTransit / 1000).toFixed(1)}k en route)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Staging Depots */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Staging Facilities</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">{operationalDepots}</span>
          <span className="text-xs text-slate-400">/ {depots.length} Operational</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Status:</span>
          {compromisedDepots > 0 ? (
            <span className="text-rose-400 font-medium font-mono text-[11px] bg-rose-500/10 px-2 py-0.5 rounded">
              {compromisedDepots} facility disrupted
            </span>
          ) : (
            <span className="text-emerald-400 font-medium font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded">
              All Depots Active
            </span>
          )}
        </div>
      </div>

      {/* 4. Supply Health */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Supply Chain Health</span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            lowStockCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-white">
          {lowStockCount === 0 ? '100%' : `${lowStockCount} Alerts`}
        </div>
        <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          {lowStockCount === 0
            ? 'All items above safety margins'
            : `${lowStockCount} items below safety reserve`}
        </div>
      </div>
    </div>
  );
};
