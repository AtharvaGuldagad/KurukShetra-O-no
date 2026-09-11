import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { socket } from '../api/socket';
import { type Zone } from '../api/mockData';
import { ZoneList } from '../components/dashboard/ZoneList';
import { ZoneDetailPanel } from '../components/dashboard/ZoneDetailPanel';

import { Activity, Map as MapIcon, List, RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

// Lazy import the map to avoid SSR/leaflet issues
import ZoneMap from '../components/map/ZoneMap';
import { BottomDock } from '../components/dashboard/BottomDock';
import { ReallocationModal, type ReallocationPlan } from '../components/dashboard/ReallocationModal';

const UPDATE_FLASH_DURATION = 4000; // ms to show "just updated" indicator

interface DuplicateFlag {
  id: string;
  zone_id: string;
  conflict: string[];
  need_type: string;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [wsEvents, setWsEvents] = useState<string[]>([]);
  const [duplicateFlags, setDuplicateFlags] = useState<DuplicateFlag[]>([]);
  const [reallocationPlan, setReallocationPlan] = useState<ReallocationPlan | null>(null);

  const { data: zones = [], isLoading, error, isFetching } = useQuery<Zone[]>({
    queryKey: ['zones'],
    queryFn: apiClient.getZones,
    staleTime: 1000 * 60 * 5, // zones only refresh on WS event or manual trigger
  });

  const flashZone = useCallback((zoneId: string) => {
    setRecentlyUpdated(prev => {
      const next = new Set(prev);
      next.add(zoneId);
      return next;
    });
    setTimeout(() => {
      setRecentlyUpdated(prev => {
        const next = new Set(prev);
        next.delete(zoneId);
        return next;
      });
    }, UPDATE_FLASH_DURATION);
  }, []);

  // Wire WebSocket events
  useEffect(() => {
    const onZoneUpdated = (updatedZone: Zone) => {
      // Directly update the React Query cache — no refetch needed
      queryClient.setQueryData<Zone[]>(['zones'], (old = []) => {
        const exists = old.some(z => z.zone_id === updatedZone.zone_id);
        const next = exists
          ? old.map(z => z.zone_id === updatedZone.zone_id ? updatedZone : z)
          : [...old, updatedZone];
        return next.sort((a, b) => b.severity_score - a.severity_score);
      });
      flashZone(updatedZone.zone_id);
      setWsEvents(prev => [`ZoneUpdated: ${updatedZone.location?.name ?? updatedZone.zone_id}`, ...prev.slice(0, 4)]);
    };

    const onAllocationRecalculated = (data: any) => {
      if (data.diffs && data.diffs.length > 0) {
        setReallocationPlan(data);
      } else {
        queryClient.invalidateQueries({ queryKey: ['allocations'] });
      }
      setWsEvents(prev => [`AllocationRecalculated: ${data.reason ?? 'triggered'}`, ...prev.slice(0, 4)]);
    };

    const onAgencyStatusChanged = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['agency-tasks'] });
      setWsEvents(prev => [`AgencyStatusChanged: ${data.agency_name ?? data.agency_id}`, ...prev.slice(0, 4)]);
    };

    const onDuplicateFlagged = (data: { zone_id: string; conflict: string[]; need_type: string }) => {
      setDuplicateFlags(prev => [
        { id: Math.random().toString(36).substring(2, 11), ...data },
        ...prev
      ]);
      setWsEvents(prev => [`DuplicateFlagged: ${data.zone_id}`, ...prev.slice(0, 4)]);
    };

    socket.on('ZoneUpdated', onZoneUpdated);
    socket.on('AllocationRecalculated', onAllocationRecalculated);
    socket.on('AgencyStatusChanged', onAgencyStatusChanged);
    socket.on('DuplicateFlagged', onDuplicateFlagged);

    return () => {
      socket.off('ZoneUpdated', onZoneUpdated);
      socket.off('AllocationRecalculated', onAllocationRecalculated);
      socket.off('AgencyStatusChanged', onAgencyStatusChanged);
      socket.off('DuplicateFlagged', onDuplicateFlagged);
    };
  }, [queryClient, flashZone]);

  const selectedZone = zones.find(z => z.zone_id === selectedZoneId) ?? null;

  const criticalCount = zones.filter(z => z.priority_tier === 'Critical').length;
  const highCount = zones.filter(z => z.priority_tier === 'High').length;
  const totalCasualties = zones.reduce((s, z) => s + z.casualties, 0);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400 gap-2">
        <AlertCircle className="w-5 h-5" />
        <p>Failed to load zones. Check your connection.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {reallocationPlan && (
        <ReallocationModal
          plan={reallocationPlan}
          onClose={(accepted) => {
            setReallocationPlan(null);
            if (accepted) {
              queryClient.invalidateQueries({ queryKey: ['allocations'] });
            }
          }}
        />
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">LIVE</span>
          </div>
          <StatPill label="Critical" value={criticalCount} color="text-red-400" />
          <StatPill label="High" value={highCount} color="text-orange-400" />
          <StatPill label="Casualties" value={totalCasualties} color="text-red-300" />
          <StatPill label="Zones" value={zones.length} color="text-slate-300" />
        </div>

        <div className="flex items-center gap-2">
          {/* Live event feed */}
          {wsEvents.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-blue-400 bg-blue-950/50 border border-blue-800 rounded px-2 py-1">
              <Activity className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-48">{wsEvents[0]}</span>
            </div>
          )}

          {isFetching && (
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" />
          )}

          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
            {(['split', 'map', 'list'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 flex items-center gap-1.5 transition-colors',
                  viewMode === mode
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                )}
              >
                {mode === 'map' && <MapIcon className="w-3 h-3" />}
                {mode === 'list' && <List className="w-3 h-3" />}
                <span className="capitalize">{mode}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* DUPLICATE FLAGS PANEL */}
        {duplicateFlags.length > 0 && (
          <div className="absolute top-4 right-4 z-[2000] flex flex-col gap-2 w-80 pointer-events-none">
            {duplicateFlags.map(flag => (
              <div key={flag.id} className="bg-slate-800 border border-yellow-500/50 rounded-lg p-3 shadow-lg pointer-events-auto flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5 text-yellow-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-semibold text-sm">Duplicate Effort</span>
                  </div>
                  <button 
                    onClick={() => setDuplicateFlags(prev => prev.filter(f => f.id !== flag.id))}
                    className="text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded transition-colors"
                  >
                    Resolve
                  </button>
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  <span className="text-slate-400 font-medium">Zone:</span> {flag.zone_id} <br/>
                  <span className="text-slate-400 font-medium">Need:</span> {flag.need_type}
                </div>
                <div className="text-xs font-medium text-slate-200 bg-slate-900/50 p-1.5 rounded mt-1">
                  Conflicting Agencies:
                  <ul className="list-disc pl-4 mt-1 text-red-300">
                    {flag.conflict.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Zone list sidebar */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className="w-72 xl:w-80 shrink-0 flex flex-col border-r border-slate-700 bg-slate-900/50 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800 shrink-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Priority Zones ({zones.length})
              </p>
            </div>
            <div className="flex-1 overflow-hidden px-2 py-2">
              {isLoading ? (
                <ZoneListSkeleton />
              ) : (
                <ZoneList
                  zones={zones}
                  selectedZoneId={selectedZoneId}
                  recentlyUpdated={recentlyUpdated}
                  onSelectZone={id => setSelectedZoneId(prev => prev === id ? null : id)}
                />
              )}
            </div>
          </div>
        )}

        {/* Map area */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500">
                Loading map…
              </div>
            ) : (
              <ZoneMap
                zones={zones}
                selectedZoneId={selectedZoneId}
                recentlyUpdated={recentlyUpdated}
                onSelectZone={id => setSelectedZoneId(prev => prev === id ? null : id)}
              />
            )}
          </div>
        )}

        {/* Detail panel */}
        {selectedZone && (
          <div className="w-80 xl:w-96 shrink-0 border-l border-slate-700 overflow-hidden">
            <ZoneDetailPanel
              zone={selectedZone}
              onClose={() => setSelectedZoneId(null)}
            />
          </div>
        )}
        
        {/* Bottom Dock for Resource Operations */}
        <BottomDock />
      </div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className={cn('text-sm font-bold tabular-nums', color)}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function ZoneListSkeleton() {
  return (
    <div className="space-y-2 px-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-slate-800/60 animate-pulse" />
      ))}
    </div>
  );
}
