import { cn } from '../../lib/utils';
import { type Zone } from '../../api/mockData';
import { SeverityBadge, NeedTag, ConfidenceBar, DisasterTypeIcon } from '../ui/ZoneUI';
import { Users, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';

interface ZoneCardProps {
  zone: Zone;
  rank: number;
  isSelected: boolean;
  isRecentlyUpdated: boolean;
  onClick: () => void;
}

export function ZoneCard({ zone, rank, isSelected, isRecentlyUpdated, onClick }: ZoneCardProps) {
  const topNeed = zone.needs[0];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all duration-300 group relative overflow-hidden',
        'hover:bg-slate-700/50',
        isSelected
          ? 'bg-slate-700/70 border-slate-500 ring-1 ring-slate-400'
          : 'bg-slate-800/60 border-slate-700/60',
        isRecentlyUpdated && 'ring-2 ring-blue-400 border-blue-500/60'
      )}
    >
      {/* Update flash */}
      {isRecentlyUpdated && (
        <div className="absolute inset-0 bg-blue-400/10 animate-pulse pointer-events-none rounded-lg" />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-slate-500 text-xs font-mono w-5 shrink-0">#{rank}</span>
          <DisasterTypeIcon type={zone.disaster_type} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">{zone.location.name}</p>
            <p className="text-xs text-slate-400 capitalize">{zone.disaster_type}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <SeverityBadge tier={zone.priority_tier} score={zone.severity_score} size="sm" />
          <ChevronRight className={cn(
            'w-3 h-3 text-slate-500 transition-transform group-hover:translate-x-0.5',
            isSelected && 'text-slate-300'
          )} />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {zone.population_affected_est.toLocaleString()}
        </span>
        {zone.casualties > 0 && (
          <span className="flex items-center gap-1 text-red-400 font-medium">
            <AlertTriangle className="w-3 h-3" />
            {zone.casualties} casualt{zone.casualties !== 1 ? 'ies' : 'y'}
          </span>
        )}
        {zone.deterioration_delta && zone.deterioration_delta !== 'stable' && (
          <span className="flex items-center gap-1 text-orange-400">
            <TrendingUp className="w-3 h-3" />
            {zone.deterioration_delta}
          </span>
        )}
      </div>

      {topNeed && (
        <div className="mt-2">
          <NeedTag type={topNeed.type} urgency={topNeed.urgency} />
        </div>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-xs text-slate-500">Confidence:</span>
        <ConfidenceBar value={zone.source_confidence} refs={zone.source_refs} />
      </div>

      {isRecentlyUpdated && (
        <div className="mt-1.5 text-xs text-blue-400 font-medium">⚡ Just updated</div>
      )}
    </button>
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
    <div className="flex flex-col gap-2 overflow-y-auto h-full pr-1">
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-slate-500">
          <p className="text-sm">No active zones</p>
        </div>
      )}
      {sorted.map((zone, i) => (
        <ZoneCard
          key={zone.zone_id}
          zone={zone}
          rank={i + 1}
          isSelected={zone.zone_id === selectedZoneId}
          isRecentlyUpdated={recentlyUpdated.has(zone.zone_id)}
          onClick={() => onSelectZone(zone.zone_id)}
        />
      ))}
    </div>
  );
}
