import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AllocationPanel } from './AllocationPanel';
import { AgencyTasksPanel } from './AgencyTasksPanel';

export function BottomDock() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'allocations' | 'tasks'>('allocations');

  return (
    <div 
      className={cn(
        "absolute bottom-0 left-0 right-0 bg-[#171A1D] border-t border-[#2A2E33] flex flex-col transition-all duration-150 ease-out",
        isOpen ? "h-64" : "h-9"
      )}
      style={{ zIndex: 1000 }}
    >
      {/* Dock Header */}
      <div 
        className="h-9 flex items-center justify-between px-3 bg-[#1E2226] border-b border-[#2A2E33] cursor-pointer shrink-0 select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-tight text-[#E8EAED]">
            Operations Console
          </span>
          
          {isOpen && (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setActiveTab('allocations')}
                className={cn(
                  "px-2.5 py-1 text-xs uppercase tracking-tight font-medium border-b-2 transition-none",
                  activeTab === 'allocations' 
                    ? "border-[#3E7CB1] text-[#E8EAED] bg-[#171A1D]" 
                    : "border-transparent text-[#9BA1A8] hover:text-[#E8EAED]"
                )}
              >
                Resource Allocations
              </button>
              <button 
                onClick={() => setActiveTab('tasks')}
                className={cn(
                  "px-2.5 py-1 text-xs uppercase tracking-tight font-medium border-b-2 transition-none",
                  activeTab === 'tasks' 
                    ? "border-[#3E7CB1] text-[#E8EAED] bg-[#171A1D]" 
                    : "border-transparent text-[#9BA1A8] hover:text-[#E8EAED]"
                )}
              >
                Agency Assignments
              </button>
            </div>
          )}
        </div>

        <button 
          className="p-1 text-[#9BA1A8] hover:text-[#E8EAED] transition-none"
          aria-label={isOpen ? "Collapse panel" : "Expand panel"}
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Dock Content */}
      <div className={cn(
        "flex-1 overflow-hidden flex",
        isOpen ? "block" : "hidden"
      )}>
        {activeTab === 'allocations' ? <AllocationPanel /> : <AgencyTasksPanel />}
      </div>
    </div>
  );
}
