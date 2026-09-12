import React from 'react';
import { 
  Truck, 
  Cross, 
  Utensils, 
  Tent, 
  Users, 
  Search, 
  Layers, 
  MapPin, 
  Building2,
  AlertTriangle,
  X
} from 'lucide-react';
import { type ResourceCategory, type Depot } from '../../types/inventory';

export type ViewMode = 'table' | 'map' | 'depots';

interface CategoryFiltersProps {
  selectedCategory: ResourceCategory | 'All';
  onSelectCategory: (cat: ResourceCategory | 'All') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDepotId: string;
  onSelectDepot: (id: string) => void;
  showOnlyLowStock: boolean;
  onToggleLowStock: (val: boolean) => void;
  depots: Depot[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  countsByCategory: Record<string, number>;
}

export const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedDepotId,
  onSelectDepot,
  showOnlyLowStock,
  onToggleLowStock,
  depots,
  viewMode,
  onViewModeChange,
  countsByCategory,
}) => {
  const categories: Array<{ id: ResourceCategory | 'All'; label: string; icon: React.ReactNode }> = [
    { id: 'All', label: 'All Items', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'Vehicles', label: 'Vehicles', icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'Medical', label: 'Medical', icon: <Cross className="w-3.5 h-3.5" /> },
    { id: 'Food & Water', label: 'Food & Water', icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: 'Shelter & Rescue', label: 'Shelter & Gear', icon: <Tent className="w-3.5 h-3.5" /> },
    { id: 'Personnel', label: 'Personnel', icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 mb-6 shadow-sm space-y-3">
      {/* Category Pills & View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = countsByCategory[cat.id] ?? 0;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-slate-700/60 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Segmented View Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800/80 text-xs self-stretch sm:self-auto justify-center">
          <button
            onClick={() => onViewModeChange('table')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition text-xs font-medium ${
              viewMode === 'table'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
          <button
            onClick={() => onViewModeChange('map')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition text-xs font-medium ${
              viewMode === 'map'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
          <button
            onClick={() => onViewModeChange('depots')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition text-xs font-medium ${
              viewMode === 'depots'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Depots</span>
          </button>
        </div>
      </div>

      {/* Search & Secondary Filter Bar */}
      <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search items, agency, depot..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Depot Filter & Shortages Toggle */}
        <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
          <select
            value={selectedDepotId}
            onChange={(e) => onSelectDepot(e.target.value)}
            className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500 text-xs cursor-pointer"
          >
            <option value="all">All Staging Depots</option>
            {depots.map((depot) => (
              <option key={depot.id} value={depot.id}>
                {depot.name} {depot.status === 'compromised' ? ' (⚠️ Compromised)' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={() => onToggleLowStock(!showOnlyLowStock)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg border text-xs transition font-medium ${
              showOnlyLowStock
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${showOnlyLowStock ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>Low Stock Only</span>
          </button>
        </div>
      </div>
    </div>
  );
};
