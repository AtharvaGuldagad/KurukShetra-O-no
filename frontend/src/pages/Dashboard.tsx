import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { socket } from '../api/socket';
import { type Zone } from '../api/mockData';
import { ZoneList } from '../components/dashboard/ZoneList';
import { ZoneDetailPanel } from '../components/dashboard/ZoneDetailPanel';
import ZoneMap from '../components/map/ZoneMap';
import { BottomDock } from '../components/dashboard/BottomDock';
import { ReallocationTimelineModal, type ReallocationPlan } from './ReallocationTimeline';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  const [reallocationPlan, setReallocationPlan] = useState<ReallocationPlan | null>(null);

  const { data: zones = [], isLoading, error } = useQuery<Zone[]>({
    queryKey: ['zones'],
    queryFn: apiClient.getZones,
    staleTime: 1000 * 60 * 5,
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
    }, 600); // 600ms per Part 8 Motion Rules
  }, []);

  // WebSocket listeners
  useEffect(() => {
    const onZoneUpdated = (updatedZone: Zone) => {
      queryClient.setQueryData<Zone[]>(['zones'], (old = []) => {
        const exists = old.some(z => z.zone_id === updatedZone.zone_id);
        const next = exists
          ? old.map(z => z.zone_id === updatedZone.zone_id ? updatedZone : z)
          : [...old, updatedZone];
        return next.sort((a, b) => b.severity_score - a.severity_score);
      });
      flashZone(updatedZone.zone_id);
    };

    const onAllocationRecalculated = (data: any) => {
      if (data.diffs && data.diffs.length > 0) {
        setReallocationPlan(data);
      } else {
        queryClient.invalidateQueries({ queryKey: ['allocations'] });
      }
    };

    const onAgencyStatusChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['agency-tasks'] });
    };

    socket.on('ZoneUpdated', onZoneUpdated);
    socket.on('AllocationRecalculated', onAllocationRecalculated);
    socket.on('AgencyStatusChanged', onAgencyStatusChanged);

    return () => {
      socket.off('ZoneUpdated', onZoneUpdated);
      socket.off('AllocationRecalculated', onAllocationRecalculated);
      socket.off('AgencyStatusChanged', onAgencyStatusChanged);
    };
  }, [queryClient, flashZone]);

  const selectedZone = zones.find(z => z.zone_id === selectedZoneId) ?? null;

  const criticalCount = zones.filter(z => z.priority_tier === 'Critical').length;
  const highCount = zones.filter(z => z.priority_tier === 'High').length;

  if (error) {
    return (
      <div className="p-8 text-xs font-mono text-[#C4432E] bg-[#0E0F11]">
        ERROR: Failed to connect to telemetry service.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0E0F11]">
      {/* Reallocation Plan Modal / Diff View */}
      {reallocationPlan && (
        <ReallocationTimelineModal
          plan={reallocationPlan}
          onClose={(accepted) => {
            setReallocationPlan(null);
            if (accepted) {
              queryClient.invalidateQueries({ queryKey: ['allocations'] });
            }
          }}
        />
      )}

      {/* Status strip — single line, no jargon */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#2A2E33] bg-[#171A1D] shrink-0 select-none">
        <div className="flex items-center gap-3 text-xs min-w-0">
          <span className="font-medium text-[#E8EAED]">
            Coordination
          </span>

          <span className="text-[#2A2E33]" aria-hidden="true">|</span>

          <div className="flex items-center gap-3 font-mono text-[11px] truncate">
            <span className="text-[#9BA1A8]">
              {criticalCount} critical
            </span>
            <span className="text-[#9BA1A8]">
              {highCount} high
            </span>
            <span className="text-[#9BA1A8]">
              {zones.length} zones
            </span>
          </div>
        </div>

        <div className="hidden sm:block text-[11px] font-mono text-[#9BA1A8] shrink-0">
          {zones.length > 0 ? 'Live triage' : error ? 'Offline — showing cache' : isLoading ? 'Loading…' : 'No zones'}
        </div>
      </div>


      {/* Main layout: map + ranked list. Detail opens as side panel, dock overlays bottom. */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Left Map */}
        <div className="w-full md:w-[58%] h-[38vh] md:h-full overflow-hidden border-b md:border-b-0 md:border-r border-[#2A2E33] pb-0">
          {isLoading ? (
            <div className="w-full h-full bg-[#0E0F11] flex items-center justify-center">
              <div className="font-mono text-xs text-[#9BA1A8]">Loading zones…</div>
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

        {/* Right Ranked Zone List */}
        <div className="w-full md:w-[42%] flex-1 md:flex-none md:h-full flex flex-col overflow-hidden bg-[#171A1D]">
          <div className="px-3 py-2 border-b border-[#2A2E33] flex items-center justify-between shrink-0">
            <span className="text-xs font-medium text-[#9BA1A8]">
              Zones by severity ({zones.length})
            </span>
          </div>

          <div className="flex-1 overflow-hidden">
            <ZoneList
              zones={zones}
              selectedZoneId={selectedZoneId}
              recentlyUpdated={recentlyUpdated}
              onSelectZone={id => setSelectedZoneId(prev => prev === id ? null : id)}
            />
          </div>
        </div>

        {/* Zone Detail Inspector Drawer (if selected) */}
        {selectedZone && (
          <div className="absolute top-0 right-0 bottom-9 w-80 lg:w-96 z-40 bg-[#171A1D] border-l border-[#2A2E33]">
            <ZoneDetailPanel
              zone={selectedZone}
              onClose={() => setSelectedZoneId(null)}
            />
          </div>
        )}

        {/* Docked Resource Operations Panel at bottom */}
        <BottomDock />
      </div>
    </div>
  );
}
