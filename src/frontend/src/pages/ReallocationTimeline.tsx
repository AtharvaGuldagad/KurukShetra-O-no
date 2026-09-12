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
    triggerName: 'National Relief Baseline Deployment',
    reason: 'Inter-state baseline logistics established from Nagpur Central Depot to regional response battalions.',
    diffs: [
      { resource: 'High-Capacity Water Purifiers', fromZone: 'Pune Western Depot', toZone: 'Zone 042 (Wayanad, Kerala)', previousQty: 0, newQty: 40, changeType: 'added', impact: 'Establishes safe drinking water in Meppadi relief camps' },
      { resource: 'Trauma Surgical Kits', fromZone: 'Nagpur Central Depot', toZone: 'Zone 044 (Guwahati, Assam)', previousQty: 0, newQty: 120, changeType: 'added', impact: 'Pre-positions emergency surgical inventory at Guwahati Medical Center' },
      { resource: 'Inflatable Rescue Boats (Gemini)', fromZone: 'Arakkonam NDRF Base', toZone: 'Zone 043 (Puri, Odisha)', previousQty: 0, newQty: 18, changeType: 'added', impact: 'Precautionary coastal cyclone evacuation teams' },
      { resource: 'Emergency Food Packets', fromZone: 'Kolkata Eastern Depot', toZone: 'Zone 041 (Joshimath, Uttarakhand)', previousQty: 4000, newQty: 4000, changeType: 'unchanged', impact: 'Highland hill slope baseline rations maintained' },
    ]
  },
  {
    step: '02',
    timestamp: '18:15:22Z',
    triggerName: 'Wayanad Meppadi Hillside Surge',
    reason: 'Cloudburst triggered devastating landslide in Meppadi hills. Urgent extrication and crush injury triage required.',
    diffs: [
      { resource: 'Heavy Debris Cutters & Extrication Kits', fromZone: 'Arakkonam NDRF Base', toZone: 'Zone 042 (Wayanad, Kerala)', previousQty: 4, newQty: 16, changeType: 'added', impact: 'Enables rapid search through rubble and mudflow layers' },
      { resource: 'Trauma Surgical Kits', fromZone: 'Nagpur Central Depot', toZone: 'Zone 042 (Wayanad, Kerala)', previousQty: 50, newQty: 250, changeType: 'added', impact: 'Surge surgical capacity deployed to Mananthavady field clinic' },
      { resource: 'Emergency Food Packets', fromZone: 'Pune Western Depot', toZone: 'Zone 042 (Wayanad, Kerala)', previousQty: 3000, newQty: 8000, changeType: 'added', impact: 'Food supplies for 4,800 displaced plantation residents' },
      { resource: 'Inflatable Rescue Boats (Gemini)', fromZone: 'Arakkonam NDRF Base', toZone: 'Zone 043 (Puri, Odisha)', previousQty: 18, newQty: 10, changeType: 'reduced', impact: 'Surplus boats re-routed as coastal cyclone alert downgraded' },
    ]
  },
  {
    step: '03',
    timestamp: '18:40:05Z',
    triggerName: 'Guwahati Brahmaputra Embankment Breach',
    reason: 'Water gauge +15cm breach along Guwahati riverbanks. Island settlement rescue underway by SDRF.',
    diffs: [
      { resource: 'Inflatable Rescue Boats (Gemini)', fromZone: 'Kolkata Eastern Depot', toZone: 'Zone 044 (Guwahati, Assam)', previousQty: 6, newQty: 28, changeType: 'added', impact: 'Primary water evacuation for marooned riverbank wards' },
      { resource: 'High-Capacity Water Purifiers', fromZone: 'Nagpur Central Depot', toZone: 'Zone 044 (Guwahati, Assam)', previousQty: 10, newQty: 60, changeType: 'added', impact: 'Prevents waterborne epidemic across flooded urban sectors' },
      { resource: 'Heavy Debris Cutters', fromZone: 'Arakkonam NDRF Base', toZone: 'Zone 042 (Wayanad, Kerala)', previousQty: 16, newQty: 16, changeType: 'unchanged', impact: 'Maintains critical landslide rescue operations' },
      { resource: 'Emergency Food Packets', fromZone: 'Kolkata Eastern Depot', toZone: 'Zone 044 (Guwahati, Assam)', previousQty: 2000, newQty: 12000, changeType: 'added', impact: 'Airdrop and boat distribution rations' },
    ]
  },
  {
    step: '04',
    timestamp: '19:05:40Z',
    triggerName: 'Agent B National Optimization Sweep',
    reason: 'Automated multi-objective algorithm rebalanced NDRF and SDRF deployments to eliminate regional overlapping.',
    diffs: [
      { resource: 'NDRF Search Teams', fromZone: 'Zone 043 (Puri, Odisha)', toZone: 'Zone 042 (Wayanad, Kerala)', previousQty: 20, newQty: 65, changeType: 'added', impact: 'Expands night-vision canine search teams in Meppadi landslide' },
      { resource: 'SDRF Disaster Strike Force', fromZone: 'Zone 042 (Wayanad, Kerala)', toZone: 'Zone 046 (Kochi Backwaters)', previousQty: 45, newQty: 15, changeType: 'reduced', impact: 'Resolved duplicate medical triage with Indian Red Cross in Wayanad' },
      { resource: 'Trauma Surgical Kits', fromZone: 'Nagpur Central Depot', toZone: 'Zone 042 (Wayanad, Kerala)', previousQty: 250, newQty: 350, changeType: 'added', impact: 'Maintains 48-hour reserve for intensive care trauma beds' },
      { resource: 'Inflatable Rescue Boats (Gemini)', fromZone: 'Kolkata Eastern Depot', toZone: 'Zone 044 (Guwahati, Assam)', previousQty: 28, newQty: 28, changeType: 'unchanged', impact: 'River patrol operations sustained without interruption' },
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
