import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Layers, 
  RefreshCw,
  Plus
} from 'lucide-react';
import { type Depot, type InventoryItem, type DepotStatus } from '../../types/inventory';

interface DepotManagementSectionProps {
  depots: Depot[];
  inventory: InventoryItem[];
  onUpdateStatus: (depotId: string, status: DepotStatus, notes?: string) => Promise<void>;
  onSelectDepotFilter: (depotId: string) => void;
  onOpenIntakeModal: (depotId: string) => void;
}

export const DepotManagementSection: React.FC<DepotManagementSectionProps> = ({
  depots,
  inventory,
  onUpdateStatus,
  onSelectDepotFilter,
  onOpenIntakeModal,
}) => {
  const [updatingDepotId, setUpdatingDepotId] = useState<string | null>(null);

  const handleToggleCompromised = async (depot: Depot) => {
    setUpdatingDepotId(depot.id);
    try {
      if (depot.status === 'compromised') {
        await onUpdateStatus(
          depot.id,
          'operational',
          'Access corridor cleared. Normal distribution resumed.'
        );
      } else {
        await onUpdateStatus(
          depot.id,
          'compromised',
          'Access routes blocked by flooding. Ground dispatch temporarily suspended.'
        );
      }
    } finally {
      setUpdatingDepotId(null);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Staging Depots & Facilities</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Geographic relief staging areas, storage capacity load, and operational readiness
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {depots.map((depot) => {
          const depotItems = inventory.filter((i) => i.depotId === depot.id);
          const totalAvailable = depotItems.reduce((acc, curr) => acc + curr.availableQuantity, 0);
          const capacityPercent = Math.min(
            100,
            Math.round((depot.currentCapacityUnits / depot.maxCapacityUnits) * 100)
          );

          const isCompromised = depot.status === 'compromised';
          const isHighCapacity = depot.status === 'high_capacity' || capacityPercent >= 85;

          return (
            <div
              key={depot.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition shadow-sm ${
                isCompromised
                  ? 'bg-slate-900/90 border-rose-500/40'
                  : isHighCapacity
                  ? 'bg-slate-900/90 border-amber-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {depot.code}
                      </span>
                      <h4 className="font-semibold text-xs text-white">{depot.name}</h4>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{depot.locationName}</span>
                    </div>
                  </div>

                  {/* Status */}
                  {isCompromised ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Disrupted
                    </span>
                  ) : isHighCapacity ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      High Load
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      Operational
                    </span>
                  )}
                </div>

                {/* Status Note if any */}
                {depot.statusNotes && (
                  <p className="text-[11px] text-slate-400 mt-2 p-2 bg-slate-950/60 rounded border border-slate-800/80">
                    {depot.statusNotes}
                  </p>
                )}

                {/* Capacity Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Capacity Used</span>
                    <span className="font-mono text-slate-300 font-medium">
                      {capacityPercent}% ({depot.currentCapacityUnits.toLocaleString()} / {depot.maxCapacityUnits.toLocaleString()})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        capacityPercent >= 90
                          ? 'bg-rose-500'
                          : capacityPercent >= 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                </div>

                {/* Micro Stats */}
                <div className="mt-3 flex items-center justify-between text-xs p-2 bg-slate-950/50 rounded border border-slate-800/60">
                  <span className="text-slate-400">Available Supplies:</span>
                  <span className="font-mono font-bold text-white">{totalAvailable.toLocaleString()} units</span>
                </div>

                {/* Manager Contact */}
                <div className="mt-2.5 text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-slate-500" />
                    <span>{depot.managerName}</span>
                  </span>
                  <span className="flex items-center space-x-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{depot.contactNumber}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectDepotFilter(depot.id)}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1 transition"
                >
                  <Layers className="w-3 h-3" />
                  <span>Items ({depotItems.length})</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onOpenIntakeModal(depot.id)}
                    className="px-2.5 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center space-x-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Restock</span>
                  </button>

                  <button
                    onClick={() => handleToggleCompromised(depot)}
                    disabled={updatingDepotId === depot.id}
                    className={`px-2.5 py-1 text-xs rounded transition font-medium flex items-center space-x-1 ${
                      isCompromised
                        ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30'
                        : 'bg-rose-600/15 text-rose-300 hover:bg-rose-600/25 border border-rose-500/25'
                    }`}
                  >
                    {updatingDepotId === depot.id && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>{isCompromised ? 'Restore' : 'Cut-off'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
