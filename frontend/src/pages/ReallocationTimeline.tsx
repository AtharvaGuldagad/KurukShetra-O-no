import { useState } from 'react';
import { cn } from '../lib/utils';
import { X, Check } from 'lucide-react';

export interface AllocationDiffRow {
  resource: string;
  fromZone: string;
  toZone: string;
  previousQty: number;
  newQty: number;
  changeType: 'added' | 'reduced' | 'unchanged';
  impact: string;
}

export interface TimelineEvent {
  step: string; // e.g. "01"
  timestamp: string;
  triggerName: string;
  reason: string;
  diffs: AllocationDiffRow[];
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    step: '01',
    timestamp: '17:30:00Z',
    triggerName: 'Initial Baseline Dispatch',
    reason: 'Routine baseline resource deployment across initial reported operational sectors.',
    diffs: [
      { resource: 'Water Purification Unit', fromZone: 'Depot North', toZone: 'Zone 042 (Riverside)', previousQty: 0, newQty: 500, changeType: 'added', impact: 'Establishes initial clean water point' },
      { resource: 'Field Hospital Tent', fromZone: 'Central Depot', toZone: 'Zone 044 (Downtown)', previousQty: 0, newQty: 10, changeType: 'added', impact: 'Primary medical triage staging' },
      { resource: 'Heavy Rescue Squad', fromZone: 'Depot South', toZone: 'Zone 043 (Hillside)', previousQty: 0, newQty: 4, changeType: 'added', impact: 'Precautionary slope inspection' },
      { resource: 'Emergency Rations', fromZone: 'Depot North', toZone: 'Zone 041 (East Harbor)', previousQty: 1000, newQty: 1000, changeType: 'unchanged', impact: 'Standard baseline rations' },
    ]
  },
  {
    step: '02',
    timestamp: '18:15:22Z',
    triggerName: 'Ward 7 Levee Breach',
    reason: 'Water level surge +12 delta reported. Rapid medical and evacuation emergency.',
    diffs: [
      { resource: 'Mobile Clinic (Medical)', fromZone: 'Zone 043 (Hillside)', toZone: 'Zone 042 (Riverside)', previousQty: 1, newQty: 3, changeType: 'added', impact: 'Stabilizes rising hypothermia triage demand' },
      { resource: 'Inflatable Zodiac Boats', fromZone: 'Depot South', toZone: 'Zone 042 (Riverside)', previousQty: 0, newQty: 8, changeType: 'added', impact: 'Water rescue for stranded shoreline residents' },
      { resource: 'Emergency Rations', fromZone: 'Zone 041 (East Harbor)', toZone: 'Zone 042 (Riverside)', previousQty: 1000, newQty: 400, changeType: 'reduced', impact: 'Diverted surplus rations to active flood shelter' },
      { resource: 'Field Hospital Tent', fromZone: 'Central Depot', toZone: 'Zone 044 (Downtown)', previousQty: 10, newQty: 10, changeType: 'unchanged', impact: 'Maintained downtown medical staging' },
    ]
  },
  {
    step: '03',
    timestamp: '18:40:05Z',
    triggerName: 'Downtown Core Collapse',
    reason: 'Magnitude 6.4 seismic shock collapse. Critical structural rescue required immediately.',
    diffs: [
      { resource: 'Heavy Rescue Squad', fromZone: 'Zone 043 (Hillside)', toZone: 'Zone 044 (Downtown)', previousQty: 4, newQty: 1, changeType: 'reduced', impact: 'Reassigned heavy equipment to urban search operations' },
      { resource: 'Heavy Rescue Squad', fromZone: 'Depot South', toZone: 'Zone 044 (Downtown)', previousQty: 2, newQty: 6, changeType: 'added', impact: 'Reinforced rubble excavation teams' },
      { resource: 'Emergency Generators', fromZone: 'Depot North', toZone: 'Zone 044 (Downtown)', previousQty: 0, newQty: 12, changeType: 'added', impact: 'Powers perimeter floodlights for night rescue' },
      { resource: 'Water Purification Unit', fromZone: 'Depot North', toZone: 'Zone 042 (Riverside)', previousQty: 500, newQty: 500, changeType: 'unchanged', impact: 'Flood water purification remains steady' },
    ]
  },
  {
    step: '04',
    timestamp: '19:05:40Z',
    triggerName: 'Agent B Optimization Sweep',
    reason: 'Automated multi-objective algorithm re-balanced resources to avoid duplicate bottlenecks.',
    diffs: [
      { resource: 'Mobile Clinic (Medical)', fromZone: 'Zone 01', toZone: 'Zone 042 (Riverside)', previousQty: 2, newQty: 4, changeType: 'added', impact: 'Zone 01 stabilized; Zone 042 critical care expanded' },
      { resource: 'FEMA Response Team', fromZone: 'Zone 042 (Riverside)', toZone: 'Zone 044 (Downtown)', previousQty: 40, newQty: 15, changeType: 'reduced', impact: 'Resolved duplicate medical effort with Red Cross Unit 4' },
      { resource: 'Trauma Surgical Kits', fromZone: 'Central Depot', toZone: 'Zone 044 (Downtown)', previousQty: 20, newQty: 50, changeType: 'added', impact: 'Provides trauma care supplies for 30+ additional casualties' },
      { resource: 'Inflatable Zodiac Boats', fromZone: 'Depot South', toZone: 'Zone 042 (Riverside)', previousQty: 8, newQty: 8, changeType: 'unchanged', impact: 'No change to watercraft deployment' },
    ]
  }
];

export default function ReallocationTimeline() {
  const [selectedStep, setSelectedStep] = useState<string>('04');

  const activeEvent = TIMELINE_EVENTS.find(e => e.step === selectedStep) || TIMELINE_EVENTS[0];

  return (
    <div className="h-full flex flex-col bg-[#0E0F11] overflow-hidden text-[#E8EAED]">
      {/* Header */}
      <div className="h-10 px-4 border-b border-[#2A2E33] bg-[#171A1D] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-tight text-[#E8EAED]">
            Re-allocation Trigger Timeline
          </span>
          <span className="text-[#2A2E33]">|</span>
          <span className="text-xs text-[#9BA1A8]">
            Agent B Optimization Sequence & Delta Manifest
          </span>
        </div>
        <div className="font-mono text-xs text-[#9BA1A8]">
          HIGH CONTRAST / AUDIT VIEW
        </div>
      </div>

      {/* Part 7: Horizontal timeline of trigger events (numbered 01 / 02 / 03...) */}
      <div className="border-b border-[#2A2E33] bg-[#171A1D] p-3 overflow-x-auto shrink-0">
        <div className="flex items-center gap-2 min-w-max">
          {TIMELINE_EVENTS.map((event) => {
            const isSelected = selectedStep === event.step;
            return (
              <button
                key={event.step}
                onClick={() => setSelectedStep(event.step)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 border transition-none text-left cursor-pointer',
                  isSelected
                    ? 'border-[#3E7CB1] bg-[#1E2226] text-[#E8EAED]'
                    : 'border-[#2A2E33] bg-[#0E0F11] text-[#9BA1A8] hover:border-[#9BA1A8]'
                )}
              >
                {/* Numbered step justified here per Part 7 */}
                <span className="font-mono text-base font-bold text-[#3E7CB1]">
                  {event.step}
                </span>

                <div>
                  <div className="font-semibold text-xs text-[#E8EAED]">
                    {event.triggerName}
                  </div>
                  <div className="font-mono text-[11px] text-[#9BA1A8]">
                    {event.timestamp}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trigger Event Details */}
      <div className="p-4 border-b border-[#2A2E33] bg-[#171A1D] shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#3E7CB1] font-bold">
                STEP {activeEvent.step}
              </span>
              <span className="text-sm font-bold text-[#E8EAED]">
                {activeEvent.triggerName}
              </span>
            </div>
            <p className="text-xs text-[#9BA1A8] mt-1 max-w-3xl">
              {activeEvent.reason}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1">
              <strong className="text-[#4C7A5E] font-bold">+</strong> Added
            </span>
            <span className="flex items-center gap-1">
              <strong className="text-[#C97A2E] font-bold">−</strong> Reduced
            </span>
            <span className="flex items-center gap-1">
              <strong className="text-[#9BA1A8] font-bold">=</strong> Unchanged
            </span>
          </div>
        </div>
      </div>

      {/* Part 7: Before/after diff table directly below */}
      <div className="flex-1 overflow-auto p-4">
        <div className="border border-[#2A2E33] bg-[#171A1D]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2A2E33] bg-[#1E2226] text-[#9BA1A8]">
                <th className="p-2.5 w-8 text-center font-mono">Δ</th>
                <th className="p-2.5 font-semibold uppercase tracking-tight">Resource Allocation</th>
                <th className="p-2.5 font-semibold uppercase tracking-tight">Source / Previous Zone</th>
                <th className="p-2.5 font-semibold uppercase tracking-tight">Target Zone</th>
                <th className="p-2.5 font-semibold uppercase tracking-tight text-right">Previous Qty</th>
                <th className="p-2.5 font-semibold uppercase tracking-tight text-right">New Qty</th>
                <th className="p-2.5 font-semibold uppercase tracking-tight">Operational Rationale & Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E33]">
              {activeEvent.diffs.map((diff, idx) => {
                const isAdded = diff.changeType === 'added';
                const isReduced = diff.changeType === 'reduced';

                return (
                  <tr
                    key={idx}
                    className={cn(
                      'transition-none',
                      // Subtle background tint only per Part 7
                      isAdded && 'bg-[#4C7A5E]/15 text-[#E8EAED]',
                      isReduced && 'bg-[#C97A2E]/15 text-[#E8EAED]',
                      !isAdded && !isReduced && 'bg-[#171A1D] text-[#9BA1A8]'
                    )}
                  >
                    {/* + / − / = symbol marker */}
                    <td className="p-2.5 text-center font-mono text-sm font-bold">
                      {isAdded && <span className="text-[#4C7A5E]">+</span>}
                      {isReduced && <span className="text-[#C97A2E]">−</span>}
                      {!isAdded && !isReduced && <span className="text-[#9BA1A8]">=</span>}
                    </td>

                    <td className="p-2.5 font-semibold text-[#E8EAED]">
                      {diff.resource}
                    </td>

                    <td className="p-2.5 font-mono text-[#9BA1A8]">
                      {diff.fromZone}
                    </td>

                    <td className="p-2.5 font-mono text-[#E8EAED]">
                      {diff.toZone}
                    </td>

                    <td className="p-2.5 text-right font-mono text-[#9BA1A8]">
                      {diff.previousQty}
                    </td>

                    <td className="p-2.5 text-right font-mono font-bold text-[#E8EAED]">
                      {diff.newQty}
                    </td>

                    <td className="p-2.5 text-xs text-[#E8EAED]">
                      {diff.impact}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export interface ReallocationPlan {
  reason: string;
  diffs: {
    id: string;
    resource: string;
    from_zone: string;
    to_zone: string;
    impact: string;
  }[];
}

export function ReallocationTimelineModal({
  plan,
  onClose,
}: {
  plan: ReallocationPlan;
  onClose: (accepted: boolean) => void;
}) {
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/75 p-4">
      <div className="bg-[#171A1D] border border-[#2A2E33] w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden text-[#E8EAED]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#2A2E33] bg-[#1E2226] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-tight text-[#E8EAED]">
              Proposed Re-allocation Plan (Agent B)
            </h2>
            <p className="text-xs text-[#9BA1A8]">
              Automated resource optimization plan awaiting coordinator review
            </p>
          </div>
          <button onClick={() => onClose(false)} className="text-[#9BA1A8] hover:text-[#E8EAED]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reason summary */}
        <div className="p-3 border-b border-[#2A2E33] bg-[#0E0F11] text-xs">
          <span className="font-semibold text-[#3E7CB1] uppercase tracking-tight mr-2">
            Trigger Rationale:
          </span>
          <span className="text-[#E8EAED]">{plan.reason}</span>
        </div>

        {/* Diff Table */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="border border-[#2A2E33] bg-[#0E0F11]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2A2E33] bg-[#1E2226] text-[#9BA1A8]">
                  <th className="p-2 w-8 text-center font-mono">Δ</th>
                  <th className="p-2 font-semibold uppercase tracking-tight">Resource</th>
                  <th className="p-2 font-semibold uppercase tracking-tight">Source</th>
                  <th className="p-2 font-semibold uppercase tracking-tight">Target</th>
                  <th className="p-2 font-semibold uppercase tracking-tight">Operational Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2E33]">
                {plan.diffs.map((diff, i) => (
                  <tr key={diff.id || i} className="bg-[#4C7A5E]/15 hover:bg-[#4C7A5E]/20 text-[#E8EAED]">
                    <td className="p-2 text-center font-mono text-sm font-bold text-[#4C7A5E]">+</td>
                    <td className="p-2 font-semibold text-[#E8EAED]">{diff.resource}</td>
                    <td className="p-2 font-mono text-[#9BA1A8]">{diff.from_zone}</td>
                    <td className="p-2 font-mono text-[#E8EAED]">{diff.to_zone}</td>
                    <td className="p-2 text-xs text-[#E8EAED]">{diff.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-[#1E2226] border-t border-[#2A2E33] flex justify-end gap-2 shrink-0">
          <button
            onClick={() => onClose(false)}
            className="px-3 py-1.5 bg-[#171A1D] border border-[#2A2E33] hover:border-[#9BA1A8] text-[#9BA1A8] hover:text-[#E8EAED] text-xs uppercase tracking-tight transition-none"
          >
            Reject Plan
          </button>
          <button
            onClick={() => onClose(true)}
            className="px-4 py-1.5 bg-[#3E7CB1] hover:bg-[#346a99] text-[#E8EAED] text-xs font-bold uppercase tracking-tight transition-none flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Accept & Deploy Plan
          </button>
        </div>
      </div>
    </div>
  );
}
