import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../api/client';
import { socket } from '../../api/socket';
import { 
  type InventoryItem, 
  type Depot, 
  type StockTransaction, 
  type ResourceCategory, 
  type DepotStatus 
} from '../../types/inventory';
import { CriticalAlertsBanner } from './CriticalAlertsBanner';
import { GlobalMetricsCards } from './GlobalMetricsCards';
import { CategoryFilters, type ViewMode } from './CategoryFilters';
import { DepotMapView } from './DepotMapView';
import { DepotManagementSection } from './DepotManagementSection';
import { StockIntakeModal } from './StockIntakeModal';
import { InventoryTable } from './InventoryTable';
import { 
  Plus, 
  RefreshCw, 
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';

export const InventoryDashboard: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepotId, setSelectedDepotId] = useState<string>('all');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState<'intake' | 'adjustment'>('intake');
  const [preselectedDepotId, setPreselectedDepotId] = useState<string | undefined>();
  const [preselectedItemId, setPreselectedItemId] = useState<string | undefined>();
  const [preselectedItemName, setPreselectedItemName] = useState<string | undefined>();

  // Live simulation notice
  const [simNotice, setSimNotice] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [invData, depotData, txData] = await Promise.all([
        apiClient.getInventory(),
        apiClient.getDepots(),
        apiClient.getTransactions(),
      ]);
      setInventory(invData);
      setDepots(depotData);
      setTransactions(txData);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleInventoryUpdated = (updatedItem: InventoryItem) => {
      setInventory((prev) => {
        const idx = prev.findIndex((i) => i.id === updatedItem.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedItem;
          return next;
        }
        return [updatedItem, ...prev];
      });
      apiClient.getTransactions().then(setTransactions);
    };

    const handleDepotChanged = (updatedDepot: Depot) => {
      setDepots((prev) => {
        const idx = prev.findIndex((d) => d.id === updatedDepot.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedDepot;
          return next;
        }
        return prev;
      });
    };

    const handleAllocationRecalculated = (payload: any) => {
      setSimNotice(`Optimizer re-allocated stock: ${payload.reason || 'inventory shift'}`);
      setTimeout(() => setSimNotice(null), 4000);
    };

    socket.on('InventoryUpdated', handleInventoryUpdated);
    socket.on('DepotStatusChanged', handleDepotChanged);
    socket.on('AllocationRecalculated', handleAllocationRecalculated);

    return () => {
      socket.off('InventoryUpdated', handleInventoryUpdated);
      socket.off('DepotStatusChanged', handleDepotChanged);
      socket.off('AllocationRecalculated', handleAllocationRecalculated);
    };
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleAddIntake = async (data: Parameters<typeof apiClient.addInventoryIntake>[0]) => {
    await apiClient.addInventoryIntake(data);
    await fetchData();
  };

  const handleAdjustStock = async (data: Parameters<typeof apiClient.adjustInventoryStock>[0]) => {
    await apiClient.adjustInventoryStock(data);
    await fetchData();
  };

  const handleUpdateDepotStatus = async (depotId: string, status: DepotStatus, notes?: string) => {
    await apiClient.updateDepotStatus(depotId, status, notes);
    await fetchData();
  };

  // Filter calculations
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedDepotId !== 'all' && item.depotId !== selectedDepotId) {
        return false;
      }
      if (showOnlyLowStock && item.availableQuantity > item.minimumThreshold) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesAgency = item.agency.toLowerCase().includes(q);
        const matchesDepot = item.depotName.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        if (!matchesName && !matchesAgency && !matchesDepot && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [inventory, selectedCategory, selectedDepotId, showOnlyLowStock, searchQuery]);

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = { All: inventory.length };
    inventory.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return counts;
  }, [inventory]);

  const openIntakeModal = (depotId?: string, itemName?: string) => {
    setPreselectedDepotId(depotId);
    setPreselectedItemName(itemName);
    setPreselectedItemId(undefined);
    setModalInitialMode('intake');
    setModalOpen(true);
  };

  const openAdjustModal = (itemId: string) => {
    setPreselectedItemId(itemId);
    setPreselectedItemName(undefined);
    setModalInitialMode('adjustment');
    setModalOpen(true);
  };

  // Quick simulation trigger for demos
  const triggerSimulationSurge = async () => {
    const southDepot = depots.find((d) => d.id === 'depot_south');
    if (southDepot && southDepot.status === 'operational') {
      await handleUpdateDepotStatus('depot_south', 'compromised', 'Coastal storm surge flooded access routes.');
    } else {
      await handleAddIntake({
        name: 'Inflatable Rescue Boats (40HP)',
        category: 'Vehicles',
        depotId: 'depot_central',
        agency: 'Federal Relief Fleet',
        quantity: 3,
        unit: 'Boats',
        reportedBy: 'Airlift Crew',
        notes: 'Emergency boat drop at Central Hub',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-xs">Loading resource inventory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Resource Inventory
            </h2>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Live Sync</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stock across staging areas, available vs. in-transit allocations, and automated low-stock warnings.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 text-xs font-medium flex items-center space-x-1.5 transition"
            title="Refresh stock levels"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={triggerSimulationSurge}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 text-xs font-medium flex items-center space-x-1.5 transition"
            title="Simulate flash flood or emergency shipment for demo"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Simulate Event</span>
          </button>

          <button
            onClick={() => openIntakeModal()}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Intake</span>
          </button>
        </div>
      </div>

      {/* Optimizer Notice Banner */}
      {simNotice && (
        <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg text-xs text-blue-300 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{simNotice}</span>
        </div>
      )}

      {/* Critical Alerts Banner (Only renders when issues exist) */}
      <CriticalAlertsBanner
        inventory={inventory}
        depots={depots}
        onSelectCategory={(cat) => setSelectedCategory(cat as any)}
        onFilterDepot={(depotId) => {
          setSelectedDepotId(depotId);
          setViewMode('table');
        }}
      />

      {/* 4-Card High-Level Metrics Strip */}
      <GlobalMetricsCards inventory={inventory} depots={depots} />

      {/* Category Pills, Search, Depot Filter, and View Mode Toggle */}
      <CategoryFilters
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDepotId={selectedDepotId}
        onSelectDepot={setSelectedDepotId}
        showOnlyLowStock={showOnlyLowStock}
        onToggleLowStock={setShowOnlyLowStock}
        depots={depots}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        countsByCategory={countsByCategory}
      />

      {/* Active View */}
      {viewMode === 'table' && (
        <InventoryTable
          items={filteredInventory}
          onOpenIntake={openIntakeModal}
          onOpenAdjust={openAdjustModal}
        />
      )}

      {viewMode === 'map' && (
        <div className="space-y-6">
          <DepotMapView
            depots={depots}
            inventory={inventory}
            onSelectDepot={(id) => {
              setSelectedDepotId(id);
              setViewMode('table');
            }}
            onOpenIntakeModal={openIntakeModal}
          />
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-white mb-2 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Current Stock Allocations ({filteredInventory.length})</span>
            </h4>
            <InventoryTable
              items={filteredInventory}
              onOpenIntake={openIntakeModal}
              onOpenAdjust={openAdjustModal}
            />
          </div>
        </div>
      )}

      {viewMode === 'depots' && (
        <DepotManagementSection
          depots={depots}
          inventory={inventory}
          onUpdateStatus={handleUpdateDepotStatus}
          onSelectDepotFilter={(id) => {
            setSelectedDepotId(id);
            setViewMode('table');
          }}
          onOpenIntakeModal={openIntakeModal}
        />
      )}

      {/* Bottom Activity History */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-slate-300">
            Recent Supply Intakes & Adjustments
          </h4>
          <span className="text-[11px] text-slate-500">
            {transactions.length} total logged
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {transactions.slice(0, 3).map((tx) => (
            <div
              key={tx.id}
              className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/60 text-xs"
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className={`font-semibold ${tx.type === 'intake' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.type === 'intake' ? `+${tx.quantityChanged.toLocaleString()} Arrival` : `${tx.quantityChanged} ${tx.type}`}
                </span>
                <span className="text-slate-500">{tx.timestamp}</span>
              </div>
              <div className="font-medium text-white">{tx.itemName}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {tx.depotName} • {tx.agency}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Ingest & Adjust */}
      <StockIntakeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        depots={depots}
        inventory={inventory}
        preselectedDepotId={preselectedDepotId}
        preselectedItemId={preselectedItemId}
        preselectedItemName={preselectedItemName}
        initialMode={modalInitialMode}
        onAddIntake={handleAddIntake}
        onAdjustStock={handleAdjustStock}
      />
    </div>
  );
};
