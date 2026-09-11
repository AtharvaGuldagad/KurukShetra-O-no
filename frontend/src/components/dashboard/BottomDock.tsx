import { useState } from 'react';
import { ChevronUp, ChevronDown, Package, Truck, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AllocationPanel } from './AllocationPanel';
import { AgencyTasksPanel } from './AgencyTasksPanel';

export function BottomDock() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'allocations' | 'tasks'>('allocations');

  return (
    <div 
      className={cn(
        "absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 flex flex-col transition-all duration-300 ease-in-out shadow-2xl",
        isOpen ? "h-72" : "h-10"
      )}
      style={{ zIndex: 9999 }}
    >
      {/* Dock Header / Handle */}
      <div 
        className="h-10 flex items-center justify-between px-4 bg-slate-800/80 cursor-pointer shrink-0 hover:bg-slate-700/80 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
            <Activity className="w-4 h-4 text-blue-400" />
            Resource Operations
          </div>
          
          {isOpen && (
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setActiveTab('allocations')}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-t-md transition-colors flex items-center gap-1.5",
                  activeTab === 'allocations' 
                    ? "bg-slate-900 text-blue-400 border-t border-x border-slate-700 translate-y-[1px]" 
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Package className="w-3.5 h-3.5" />
                Allocations
              </button>
              <button 
                onClick={() => setActiveTab('tasks')}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-t-md transition-colors flex items-center gap-1.5",
                  activeTab === 'tasks' 
                    ? "bg-slate-900 text-blue-400 border-t border-x border-slate-700 translate-y-[1px]" 
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Truck className="w-3.5 h-3.5" />
                Agency Tasks
              </button>
            </div>
          )}
        </div>

        <button className="p-1 text-slate-400 hover:text-slate-200 transition-colors rounded hover:bg-slate-600">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Dock Content */}
      <div className={cn(
        "flex-1 overflow-hidden transition-opacity duration-300 flex",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {activeTab === 'allocations' ? <AllocationPanel /> : <AgencyTasksPanel />}
      </div>
    </div>
  );
}
