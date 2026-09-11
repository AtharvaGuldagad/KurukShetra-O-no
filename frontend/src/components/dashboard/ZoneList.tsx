import { cn } from '../../lib/utils';
import { type Zone } from '../../api/mockData';
import { SeverityEdgeBar } from '../ui/ZoneUI';

interface ZoneRowProps {
  zone: Zone;
  isSelected: boolean;
  isRecentlyUpdated: boolean;
  onClick: () => void;
}

export function ZoneRow({ zone, isSelected, isRecentlyUpdated, onClick }: ZoneRowProps) {
  const topNeed = zone.needs[0];
  // Stable mockup or derived timestamp from zone
  const timestamp = "18:42:15Z";

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className={cn(
        'w-full text-left flex items-stretch border-b border-[#2A2E33] cursor-pointer select-none transition-none',
        isSelected ? 'bg-[#1E2226]' : 'bg-[#171A1D] hover:bg-[#1E2226]/50',
        isRecentlyUpdated && 'pulse-highlight'
      )}
    >
      {/* 3px left-edge bar carrying severity tier */}
      <SeverityEdgeBar tier={zone.priority_tier} />

      {/* Row content */}
      <div className="flex-1 px-3 py-2.5 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm text-[#E8EAED] truncate">
              {zone.location.name}
            </span>
            <span className="font-mono text-xs text-[#9BA1A8] shrink-0">
              [{zone.zone_id}]
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs text-[#E8EAED]">
              SCORE {zone.severity_score}
            </span>
            <span className="font-mono text-[11px] text-[#9BA1A8]">
              {timestamp}
            </span>
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-xs text-[#9BA1A8]">
          <div className="flex items-center gap-3">
            <span>
              Pop: <strong className="font-mono text-[#E8EAED]">{zone.population_affected_est.toLocaleString()}</strong>
            </span>
            {zone.casualties > 0 && (
              <span className="text-[#C4432E]">
                Casualties: <strong className="font-mono text-[#C4432E]">{zone.casualties}</strong>
              </span>
            )}
            {topNeed && (
              <span className="truncate">
                Top need: <span className="text-[#E8EAED]">{topNeed.type} ({topNeed.urgency})</span>
              </span>
            )}
          </div>

          <span className="text-xs uppercase text-[#9BA1A8]">
            {zone.disaster_type}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ZoneListProps {
  zones: Zone[];
  selectedZoneId: string | null;
  recentlyUpdated: Set<string>;
  onSelectZone: (id: string) => void;
}

export function ZoneList({ zones, selectedZoneId, recentlyUpdated, onSelectZone }: ZoneListProps) {
  const sorted = [...zones].sort((a, b) => b.severity_score - a.severity_score);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#171A1D]">
      {sorted.length === 0 ? (
        <div className="p-6 text-center text-[#9BA1A8] text-xs">
          No active zones reporting
        </div>
      ) : (
        sorted.map((zone) => (
          <ZoneRow
            key={zone.zone_id}
            zone={zone}
            isSelected={zone.zone_id === selectedZoneId}
            isRecentlyUpdated={recentlyUpdated.has(zone.zone_id)}
            onClick={() => onSelectZone(zone.zone_id)}
          />
        ))
      )}
    </div>
  );
}
