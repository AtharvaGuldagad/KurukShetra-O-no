import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { socket } from './api/socket';
import { seedZones } from './api/mockData';
import { db, addAuditEntry } from './api/client';
import { cn } from './lib/utils';
import {
  Map, FileText, Package, Radio, ScrollText, GitCommit,
  AlertTriangle, ChevronDown, Activity
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import ZoneReporting from './pages/ZoneReporting';
import Inventory from './pages/Inventory';
import AuditLog from './pages/AuditLog';
import AgencyConsole from './pages/AgencyConsole';
import ReallocationTimeline from './pages/ReallocationTimeline';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 },
  }
});

const NAV_ITEMS = [
  { to: '/', label: 'Coordination', icon: Map, exact: true },
  { to: '/report', label: 'Zone Intake', icon: FileText },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/agency', label: 'Agency Units', icon: Radio },
  { to: '/timeline', label: 'Re-allocation', icon: GitCommit },
  { to: '/audit', label: 'Audit Log', icon: ScrollText },
];

const DEV_TRIGGERS = [
  { event: 'ZoneUpdated', label: 'Zone Update' },
  { event: 'AllocationRecalculated', label: 'Agent B Rebalance' },
  { event: 'DuplicateFlagged', label: 'Duplicate Conflict' },
  { event: 'AgencyStatusChanged', label: 'Agency Step' },
];

function Shell({ children }: { children: React.ReactNode }) {
  const [devOpen, setDevOpen] = useState(false);
  const [activeConflictCount, setActiveConflictCount] = useState(1);

  const handleDevTrigger = (event: string) => {
    if (event === 'ZoneUpdated') {
      const zone = { ...seedZones[0] };
      zone.severity_score = Math.min(99, zone.severity_score + Math.floor(Math.random() * 8) + 1);
      zone.deterioration_delta = `+${Math.floor(Math.random() * 6) + 1} since last sweep`;
      zone.priority_tier = 'Critical';
      db.zones = db.zones.map(z => z.zone_id === zone.zone_id ? zone : z);
      addAuditEntry({
        timestamp: new Date().toISOString(),
        event_type: 'zone_updated',
        actor: 'Dev Trigger (Mock System)',
        zone_id: zone.zone_id,
        summary: `Mock Update: Zone ${zone.location.name} severity increased to ${zone.priority_tier} (${zone.severity_score})`,
        raw_payload: zone
      });
      socket.emitFromServer('ZoneUpdated', zone);
    } else if (event === 'AllocationRecalculated') {
      const mockPayload = {
        reason: 'Automated re-balancing triggered by resource scarcity in Critical zones.',
        diffs: [
          { id: 'diff_1', resource: 'Mobile Clinic (Medical)', from_zone: 'Zone 01', to_zone: 'Zone 42', impact: 'Zone 01 priority dropped slightly, Zone 42 stabilized.' },
          { id: 'diff_2', resource: 'Heavy Rescue Squad (Search & Rescue)', from_zone: 'Zone 15', to_zone: 'Zone 08', impact: 'Reduced response time to Zone 08 collapse incident by 15 mins.' }
        ]
      };
      addAuditEntry({
        timestamp: new Date().toISOString(),
        event_type: 'allocation_recalculated',
        actor: 'Agent B',
        summary: 'Agent B generated an optimized re-allocation plan.',
        raw_payload: mockPayload
      });
      socket.emitFromServer('AllocationRecalculated', mockPayload);
    } else if (event === 'DuplicateFlagged') {
      setActiveConflictCount(c => c + 1);
      addAuditEntry({
        timestamp: new Date().toISOString(),
        event_type: 'duplicate_flagged',
        actor: 'Agent A (Detection)',
        zone_id: 'zone_042',
        summary: 'Flagged duplicate effort in Zone 042 between Red Cross Unit 4 and FEMA Response Team for medical supplies.',
        raw_payload: { zone_id: 'zone_042', conflict: ['Red Cross Unit 4', 'FEMA Response Team'], need_type: 'medical supplies' }
      });
      socket.emitFromServer('DuplicateFlagged', { zone_id: 'zone_042', conflict: ['Red Cross Unit 4', 'FEMA Response Team'], need_type: 'medical supplies' });
    } else if (event === 'AgencyStatusChanged') {
      addAuditEntry({
        timestamp: new Date().toISOString(),
        event_type: 'agency_status_changed',
        actor: 'Red Cross Unit 4',
        zone_id: 'zone_042',
        summary: 'Mock Update: Agency status changed to in_progress.',
        raw_payload: { agency_id: 'agency_redcross_4', status: 'in_progress' }
      });
      socket.emitFromServer('AgencyStatusChanged', { agency_id: 'agency_redcross_4', status: 'in_progress' });
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0E0F11] text-[#E8EAED]">
      {/* Persistent Left Rail Navigation (Part 0 Layout) */}
      <aside className="w-52 shrink-0 border-r border-[#2A2E33] bg-[#171A1D] flex flex-col justify-between select-none">
        <div>
          {/* Header Brand */}
          <div className="h-10 border-b border-[#2A2E33] px-3 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-tight text-[#E8EAED] flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#3E7CB1]" />
              PS20 Console
            </span>
            <span className="font-mono text-[10px] text-[#9BA1A8]">
              v1.2.0
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-0.5">
            {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) => cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 text-xs uppercase tracking-tight transition-none',
                  isActive
                    ? 'bg-[#1E2226] text-[#E8EAED] font-semibold border-l-2 border-l-[#3E7CB1]'
                    : 'text-[#9BA1A8] hover:text-[#E8EAED] hover:bg-[#1E2226]/50'
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Part 5: Conflicts section in nav rail with count badge */}
          {activeConflictCount > 0 && (
            <div className="mx-2 mt-4 p-2 border border-[#C97A2E] bg-[#C97A2E]/10">
              <div className="flex items-center justify-between text-xs text-[#C97A2E] font-semibold uppercase tracking-tight">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Conflicts
                </span>
                <span className="font-mono text-[11px] bg-[#C97A2E] text-[#0E0F11] px-1 font-bold">
                  {activeConflictCount}
                </span>
              </div>
              <p className="text-[11px] text-[#9BA1A8] mt-1 leading-tight">
                Active resource assignment overlap flagged by Agent A.
              </p>
            </div>
          )}
        </div>

        {/* System telemetry footer in rail */}
        <div className="p-3 border-t border-[#2A2E33] text-[11px] font-mono text-[#9BA1A8] space-y-1">
          <div>NODE: LA-OPS-01</div>
          <div>NET: SECURE / WS</div>
        </div>
      </aside>

      {/* Main Console Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Page Header (Part 0 & 2: Title, single live status dot, operational clock, filters) */}
        <header className="h-10 border-b border-[#2A2E33] bg-[#171A1D] px-4 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-tight text-[#E8EAED]">
              Disaster Relief Operations System
            </span>

            {/* Part 2: A single live-status indicator in the header (small dot + "Live" text) */}
            <div className="flex items-center gap-1.5 text-xs text-[#4C7A5E]">
              <span className="w-2 h-2 rounded-full bg-[#4C7A5E] animate-pulse" />
              <span className="font-mono text-[11px] font-semibold uppercase text-[#E8EAED]">Live</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* UTC Clock */}
            <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-[#9BA1A8]">
              <span>UTC</span>
              <span className="text-[#E8EAED]">18:59:55Z</span>
            </div>

            {/* DEV WebSocket Trigger Menu */}
            <div className="relative">
              <button
                onClick={() => setDevOpen(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono border transition-none',
                  devOpen
                    ? 'bg-[#1E2226] border-[#3E7CB1] text-[#E8EAED]'
                    : 'bg-[#0E0F11] border-[#2A2E33] text-[#9BA1A8] hover:text-[#E8EAED]'
                )}
              >
                <Activity className="w-3 h-3 text-[#3E7CB1]" />
                <span>WS-SIM</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", devOpen && "rotate-180")} />
              </button>

              {devOpen && (
                <div className="absolute top-full right-0 mt-1 bg-[#171A1D] border border-[#2A2E33] p-2 flex flex-col gap-1 z-50 min-w-56 text-xs">
                  <div className="text-[10px] uppercase font-mono text-[#9BA1A8] px-2 py-1">
                    Simulate WebSocket Event
                  </div>
                  {DEV_TRIGGERS.map(({ event, label }) => (
                    <button
                      key={event}
                      onClick={() => { handleDevTrigger(event); setDevOpen(false); }}
                      className="px-2 py-1.5 text-left hover:bg-[#1E2226] text-[#E8EAED] font-mono text-[11px] flex items-center justify-between"
                    >
                      <span>{label}</span>
                      <span className="text-[10px] text-[#9BA1A8]">[{event}]</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Routed Content Area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Shell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/report" element={<ZoneReporting />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/agency" element={<AgencyConsole />} />
            <Route path="/timeline" element={<ReallocationTimeline />} />
            <Route path="/audit" element={<AuditLog />} />
          </Routes>
        </Shell>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
