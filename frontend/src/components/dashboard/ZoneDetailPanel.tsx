import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { type Zone } from '../../api/mockData';
import { SeverityBadge, NeedTag, ConfidenceBar, DisasterTypeIcon } from '../ui/ZoneUI';
import { getTierConfig } from '../ui/ZoneUI';
import { cn } from '../../lib/utils';
import { X, Users, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, Activity } from 'lucide-react';

interface ZoneDetailPanelProps {
  zone: Zone;
  onClose: () => void;
}

export function ZoneDetailPanel({ zone, onClose }: ZoneDetailPanelProps) {
  const [showRaw, setShowRaw] = useState(false);
  const config = getTierConfig(zone.priority_tier);

  const { data: history, isLoading: histLoading } = useQuery({
    queryKey: ['zone-history', zone.zone_id],
    queryFn: () => apiClient.getZoneHistory(zone.zone_id),
  });

  return (
    <div className={cn(
      'flex flex-col h-full bg-slate-900 border-l border-slate-700 overflow-hidden',
    )}>
      {/* Header */}
      <div className={cn('p-4 border-b border-slate-700 bg-slate-800/50', config.bg)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <DisasterTypeIcon type={zone.disaster_type} />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-100 truncate">{zone.location.name}</h2>
              <p className="text-xs text-slate-400 capitalize">{zone.disaster_type} · {zone.zone_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <SeverityBadge tier={zone.priority_tier} score={zone.severity_score} />
          {zone.deterioration_delta !== 'stable' && (
            <span className="flex items-center gap-1 text-orange-400 text-xs font-medium">
              <TrendingUp className="w-3 h-3" /> {zone.deterioration_delta}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Users className="w-4 h-4 text-blue-400" />}
            label="Population Affected"
            value={zone.population_affected_est.toLocaleString()}
          />
          <StatCard
            icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
            label="Casualties"
            value={String(zone.casualties)}
            highlight={zone.casualties > 0}
          />
        </div>

        {/* Needs */}
        <Section title="Unmet Needs">
          <div className="flex flex-wrap gap-2">
            {zone.needs.map((n, i) => (
              <NeedTag key={i} type={n.type} urgency={n.urgency} />
            ))}
          </div>
        </Section>

        {/* Source Confidence */}
        <Section title="Source Confidence">
          <div className="flex flex-col gap-2">
            <ConfidenceBar value={zone.source_confidence} refs={zone.source_refs} />
            <div className="mt-1 space-y-1">
              {zone.source_refs.map((r, i) => (
                <div key={i} className="text-xs font-mono text-slate-400 bg-slate-800 rounded px-2 py-1 break-all">{r}</div>
              ))}
            </div>
          </div>
        </Section>

        {/* Zone History */}
        <Section title="Zone State History">
          {histLoading ? (
            <div className="text-xs text-slate-500 animate-pulse">Loading history…</div>
          ) : (
            <div className="relative pl-4 border-l border-slate-700 space-y-3">
              {(history || []).map((h, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[1.3rem] top-1 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-500" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-300 font-medium">
                        Score: {h.severity_score} · {h.priority_tier}
                      </p>
                      {h.note && <p className="text-xs text-slate-500 mt-0.5">{h.note}</p>}
                    </div>
                    <p className="text-xs text-slate-600 shrink-0">
                      {new Date(h.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Raw payload toggle */}
        <div>
          <button
            onClick={() => setShowRaw(v => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Raw payload
          </button>
          {showRaw && (
            <pre className="mt-2 text-xs text-slate-400 bg-slate-800/80 rounded p-3 overflow-auto max-h-48 border border-slate-700">
              {JSON.stringify(zone, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, highlight }: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className={cn('text-lg font-bold', highlight ? 'text-red-400' : 'text-slate-100')}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Activity className="w-3 h-3" /> {title}
      </h3>
      {children}
    </div>
  );
}
