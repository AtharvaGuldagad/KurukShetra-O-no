import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ArrowRight, X, Building2, PackageX } from 'lucide-react';
import { type InventoryItem, type Depot } from '../../types/inventory';

interface CriticalAlertsBannerProps {
  inventory: InventoryItem[];
  depots: Depot[];
  onSelectCategory?: (category: string) => void;
  onFilterDepot?: (depotId: string) => void;
}

export const CriticalAlertsBanner: React.FC<CriticalAlertsBannerProps> = ({
  inventory,
  depots,
  onSelectCategory,
  onFilterDepot,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Compute depleted items
  const depletedItems = inventory.filter((item) => item.availableQuantity === 0);

  // Compute low stock items
  const lowStockItems = inventory.filter(
    (item) => item.availableQuantity > 0 && item.availableQuantity <= item.minimumThreshold
  );

  // Compromised depots
  const compromisedDepots = depots.filter((d) => d.status === 'compromised');

  const totalIssues = depletedItems.length + lowStockItems.length + compromisedDepots.length;

  if (isDismissed || totalIssues === 0) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl bg-slate-900/90 border border-amber-500/30 overflow-hidden shadow-lg transition-all duration-200">
      {/* Compact Alert Bar */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-slate-900/50 to-transparent">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Action Required
              </span>
              <span className="text-xs font-semibold text-slate-200">
                {totalIssues} {totalIssues === 1 ? 'supply issue' : 'supply issues'} detected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {depletedItems.length > 0 && `${depletedItems.length} depleted item${depletedItems.length > 1 ? 's' : ''}`}
              {depletedItems.length > 0 && lowStockItems.length > 0 && ', '}
              {lowStockItems.length > 0 && `${lowStockItems.length} below safety reserve`}
              {compromisedDepots.length > 0 && ` • ${compromisedDepots.length} depot access disrupted`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition border border-slate-700/60"
          >
            <span>{isOpen ? 'Hide Details' : 'View Details'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800/80 transition"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Details Drawer */}
      {isOpen && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Compromised Depots */}
          {compromisedDepots.length > 0 && (
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-2 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Affected Facilities</span>
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {compromisedDepots.map((depot) => (
                  <div
                    key={depot.id}
                    className="p-3 bg-slate-900 border border-rose-500/30 rounded-lg flex items-start justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs text-white flex items-center space-x-2">
                        <span>{depot.name}</span>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">
                          Roads Blocked
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{depot.statusNotes}</p>
                    </div>
                    {onFilterDepot && (
                      <button
                        onClick={() => onFilterDepot(depot.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 ml-2 font-medium shrink-0"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Depleted and Low Stock Items */}
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center space-x-1.5">
              <PackageX className="w-3.5 h-3.5" />
              <span>Depleted & Critical Stock</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {depletedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectCategory?.(item.category)}
                  className="p-3 bg-slate-900 border border-rose-500/40 rounded-lg cursor-pointer hover:border-rose-400 transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-xs text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-400">{item.depotName}</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    0 Left ({item.inTransitQuantity} in-transit)
                  </span>
                </div>
              ))}

              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectCategory?.(item.category)}
                  className="p-3 bg-slate-900 border border-amber-500/30 rounded-lg cursor-pointer hover:border-amber-400 transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-xs text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-400">{item.depotName}</div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {item.availableQuantity} / {item.minimumThreshold} min
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
