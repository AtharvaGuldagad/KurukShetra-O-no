import { useState } from 'react';
import { ArrowRight, Check, X, ShieldAlert, Package, Activity, Loader2 } from 'lucide-react';

export interface AllocationDiff {
  id: string;
  resource: string;
  from_zone: string;
  to_zone: string;
  impact: string;
}

export interface ReallocationPlan {
  reason: string;
  diffs: AllocationDiff[];
}

interface ReallocationModalProps {
  plan: ReallocationPlan;
  onClose: (accepted: boolean) => void;
}

export function ReallocationModal({ plan, onClose }: ReallocationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (accept: boolean) => {
    setIsProcessing(true);
    // Simulate network delay to backend
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`Reallocation plan ${accept ? 'ACCEPTED' : 'REJECTED'}`);
    setIsProcessing(false);
    onClose(accept);
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Proposed Re-allocation</h2>
            <p className="text-xs text-slate-400">
              Agent B has generated an optimized resource distribution.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="bg-blue-950/30 border border-blue-900/50 p-4 rounded-lg flex gap-3">
            <Activity className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-200 font-medium">Trigger Reason</p>
              <p className="text-sm text-blue-300/80">{plan.reason}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Resource Movements ({plan.diffs.length})
            </h3>
            
            <div className="space-y-3">
              {plan.diffs.map(diff => (
                <div key={diff.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold text-slate-200 text-sm">{diff.resource}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div className="flex-1 bg-slate-900 p-2 rounded border border-slate-800 text-center font-mono text-slate-400">
                      {diff.from_zone}
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500 shrink-0" />
                    <div className="flex-1 bg-slate-900 p-2 rounded border border-purple-900/50 text-center font-mono text-purple-300">
                      {diff.to_zone}
                    </div>
                  </div>

                  <div className="flex gap-2 items-start mt-2 bg-slate-900/50 p-2 rounded">
                    <ShieldAlert className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="font-medium text-slate-300">Impact:</span> {diff.impact}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3 shrink-0">
          <button
            onClick={() => handleAction(false)}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Reject Plan
          </button>
          <button
            onClick={() => handleAction(true)}
            disabled={isProcessing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isProcessing ? 'Applying...' : 'Accept & Deploy'}
          </button>
        </div>
      </div>
    </div>
  );
}
