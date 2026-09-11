import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { type Zone } from '../../api/mockData';
import { SeverityBadge, NeedTag, ConfidenceBar, SeverityEdgeBar } from '../ui/ZoneUI';
import { cn } from '../../lib/utils';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface ZoneDetailPanelProps {
  zone: Zone;
  onClose: () => void;
}

export function ZoneDetailPanel({ zone, onClose }: ZoneDetailPanelProps) {
  const [showRaw, setShowRaw] = useState(false);

  const { data: history, isLoading: histLoading } = useQuery({
    queryKey: ['zone-history', zone.zone_id],
    queryFn: () => apiClient.getZoneHistory(zone.zone_id),
  });

  return (
    <div className="flex flex-col h-full bg-[#171A1D] border-l border-[#2A2E33] overflow-hidden text-[#E8EAED]">
      {/* Header */}
      <div className="flex items-stretch border-b border-[#2A2E33] bg-[#1E2226]">
        <SeverityEdgeBar tier={zone.priority_tier} />
        <div className="flex-1 p-3 flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#E8EAED] truncate leading-tight">
                {zone.location.name}
              </h2>
              <span className="font-mono text-xs text-[#9BA1A8]">[{zone.zone_id}]</span>
            </div>
            <p className="text-xs text-[#9BA1A8] mt-0.5 uppercase tracking-tight">
              {zone.disaster_type} · LAT {zone.location.lat.toFixed(4)}, LNG {zone.location.lng.toFixed(4)}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <SeverityBadge tier={zone.priority_tier} score={zone.severity_score} />
              {zone.deterioration_delta && zone.deterioration_delta !== 'stable' && (
                <span className="text-xs font-mono text-[#C97A2E]">
                  Δ {zone.deterioration_delta}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9BA1A8] hover:text-[#E8EAED] p-1 transition-none"
            aria-label="Close inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Core telemetry table */}
        <div className="border border-[#2A2E33] bg-[#0E0F11]">
          <div className="grid grid-cols-2 divide-x divide-[#2A2E33] border-b border-[#2A2E33]">
            <div className="p-2.5">
              <span className="text-xs text-[#9BA1A8] block">Population Affected</span>
              <span className="font-mono text-base font-semibold text-[#E8EAED]">
                {zone.population_affected_est.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5">
              <span className="text-xs text-[#9BA1A8] block">Casualties</span>
              <span className={cn('font-mono text-base font-semibold', zone.casualties > 0 ? 'text-[#C4432E]' : 'text-[#E8EAED]')}>
                {zone.casualties}
              </span>
            </div>
          </div>
          <div className="p-2.5">
            <span className="text-xs text-[#9BA1A8] block mb-1">Source Confidence & Verification</span>
            <ConfidenceBar value={zone.source_confidence} refs={zone.source_refs} />
            <div className="mt-2 space-y-1">
              {zone.source_refs.map((ref, i) => (
                <div key={i} className="font-mono text-[11px] text-[#9BA1A8] bg-[#171A1D] px-2 py-1 border border-[#2A2E33] truncate">
                  {ref}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Needs section */}
        <div>
          <h3 className="text-xs font-semibold text-[#9BA1A8] uppercase tracking-tight mb-2">
            Identified Needs ({zone.needs.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {zone.needs.map((need, i) => (
              <NeedTag key={i} type={need.type} urgency={need.urgency} />
            ))}
          </div>
        </div>

        {/* State Log History */}
        <div>
          <h3 className="text-xs font-semibold text-[#9BA1A8] uppercase tracking-tight mb-2">
            Status Progression
          </h3>
          {histLoading ? (
            <div className="text-xs font-mono text-[#9BA1A8]">Loading state log…</div>
          ) : (
            <div className="border border-[#2A2E33] divide-y divide-[#2A2E33] text-xs">
              {(history || []).map((h, i) => (
                <div key={i} className="p-2 flex items-center justify-between bg-[#0E0F11]">
                  <div>
                    <span className="font-semibold text-[#E8EAED]">{h.priority_tier}</span>
                    <span className="font-mono text-[#9BA1A8] ml-2">Score {h.severity_score}</span>
                    {h.note && <span className="text-[#9BA1A8] block mt-0.5">{h.note}</span>}
                  </div>
                  <span className="font-mono text-[11px] text-[#9BA1A8]">
                    {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technical Raw Payload */}
        <div className="pt-2 border-t border-[#2A2E33]">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1.5 text-xs text-[#9BA1A8] hover:text-[#E8EAED]"
          >
            {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>Diagnostic Payload</span>
          </button>
          {showRaw && (
            <pre className="mt-2 text-[11px] font-mono text-[#9BA1A8] bg-[#0E0F11] border border-[#2A2E33] p-2 overflow-x-auto max-h-40">
              {JSON.stringify(zone, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
