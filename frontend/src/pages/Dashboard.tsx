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
import { AlertTriangle, X } from 'lucide-react';

export interface DuplicateFlag {
  id: string;
  zone_id: string;
  conflict: string[];
  need_type: string;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  const [duplicateFlags, setDuplicateFlags] = useState<DuplicateFlag[]>([
    {
      id: 'init_dup_1',
      zone_id: 'zone_042',
      conflict: ['NDRF 4th Battalion', 'SDRF Disaster Strike Force'],
      need_type: 'rescue extrication'
    }
  ]);
  const [resolvingFlag, setResolvingFlag] = useState<DuplicateFlag | null>(null);
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

    const onDuplicateFlagged = (data: { zone_id: string; conflict: string[]; need_type: string }) => {
      setDuplicateFlags(prev => [
        { id: Math.random().toString(36).substring(2, 9), ...data },
        ...prev
      ]);
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

      {/* Duplicate conflict resolution side-by-side modal */}
      {resolvingFlag && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#171A1D] border border-[#2A2E33] w-full max-w-2xl p-4 text-[#E8EAED]">
            <div className="flex items-center justify-between border-b border-[#2A2E33] pb-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-tight text-[#C97A2E]">
                Resolve Assignment Conflict — Zone {resolvingFlag.zone_id}
              </span>
              <button onClick={() => setResolvingFlag(null)} className="text-[#9BA1A8] hover:text-[#E8EAED]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#9BA1A8] mb-4">
              Select which agency retains primary responsibility for <strong className="text-[#E8EAED]">{resolvingFlag.need_type}</strong> in this zone. The second agency will be freed for reassignment.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {resolvingFlag.conflict.map((agency, idx) => (
                <div key={idx} className="border border-[#2A2E33] bg-[#0E0F11] p-3 flex flex-col justify-between">
                  <div>
                    <div className="font-semibold text-sm text-[#E8EAED]">{agency}</div>
                    <div className="text-xs text-[#9BA1A8] mt-1">Assigned: {resolvingFlag.need_type}</div>
                    <div className="font-mono text-[11px] text-[#9BA1A8] mt-0.5">Status: Deployed</div>
                  </div>
                  <button
                    onClick={() => {
                      setDuplicateFlags(prev => prev.filter(f => f.id !== resolvingFlag.id));
                      setResolvingFlag(null);
                    }}
                    className="mt-4 px-3 py-1.5 bg-[#1E2226] border border-[#3E7CB1] text-[#E8EAED] hover:bg-[#3E7CB1] text-xs uppercase tracking-tight transition-none text-center"
                  >
                    Assign Primary & Reassign Other
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#2A2E33]">
              <button
                onClick={() => setResolvingFlag(null)}
                className="px-3 py-1 text-xs text-[#9BA1A8] hover:text-[#E8EAED]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instrumentation Sub-header Status Bar */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#2A2E33] bg-[#171A1D] shrink-0 select-none">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-semibold uppercase tracking-tight text-[#E8EAED]">
            Coordination Console
          </span>

          <span className="text-[#2A2E33]">|</span>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-[#9BA1A8]">
              CRITICAL: <strong className="text-[#C4432E]">{criticalCount}</strong>
            </span>
            <span className="text-[#9BA1A8]">
              HIGH: <strong className="text-[#C97A2E]">{highCount}</strong>
            </span>
            <span className="text-[#9BA1A8]">
              CASUALTIES: <strong className="text-[#E8EAED]">{totalCasualties}</strong>
            </span>
            <span className="text-[#9BA1A8]">
              ZONES: <strong className="text-[#E8EAED]">{zones.length}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#9BA1A8]">
          <span className="font-mono text-[11px]">
            EPSG:4326 · 100% SIGNAL
          </span>
        </div>
      </div>

      {/* Part 5: Docked Banner at top of panel in severity-high color */}
      {duplicateFlags.length > 0 && (
        <div className="border-b border-[#2A2E33] bg-[#C97A2E]/10 border-l-4 border-l-[#C97A2E] p-2.5 px-3 flex items-center justify-between shrink-0 slide-down-alert">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-[#C97A2E] shrink-0" />
            <span className="text-[#E8EAED]">
              <strong className="text-[#C97A2E]">Duplicate Effort:</strong>{' '}
              {duplicateFlags[0].conflict.join(' and ')} both assigned to Zone {duplicateFlags[0].zone_id} — {duplicateFlags[0].need_type}.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDuplicateFlags(prev => prev.slice(1))}
              className="px-2.5 py-1 text-xs uppercase tracking-tight bg-[#171A1D] border border-[#2A2E33] hover:border-[#9BA1A8] text-[#9BA1A8] hover:text-[#E8EAED] transition-none"
            >
              Keep both
            </button>
            <button
              onClick={() => setResolvingFlag(duplicateFlags[0])}
              className="px-2.5 py-1 text-xs uppercase tracking-tight bg-[#C97A2E] text-[#0E0F11] font-semibold transition-none"
            >
              Resolve
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout: Left Map (~60%), Right Ranked Zone List (~40%) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Map: 60% */}
        <div className="w-[60%] h-full overflow-hidden border-r border-[#2A2E33]">
          {isLoading ? (
            <div className="w-full h-full bg-[#0E0F11] flex items-center justify-center font-mono text-xs text-[#9BA1A8]">
              INITIALIZING CARTOGRAPHY TELEMETRY...
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

        {/* Right Ranked Zone List: 40% */}
        <div className="w-[40%] h-full flex flex-col overflow-hidden bg-[#171A1D]">
          <div className="p-2 px-3 border-b border-[#2A2E33] bg-[#1E2226] flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold uppercase tracking-tight text-[#9BA1A8]">
              Ranked Zone Triage ({zones.length})
            </span>
            <span className="text-[11px] font-mono text-[#9BA1A8]">
              BY SEVERITY
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
          <div className="absolute top-0 right-0 bottom-0 w-80 lg:w-96 z-40 shadow-none">
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
