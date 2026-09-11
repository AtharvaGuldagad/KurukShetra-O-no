import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { socket } from './api/socket';
import { seedZones } from './api/mockData';
import { db, addAuditEntry } from './api/client';
import { cn } from './lib/utils';
import {
  Map, FileText, Package, Radio, ScrollText,
  Zap, AlertCircle, ChevronDown
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import ZoneReporting from './pages/ZoneReporting';
import Inventory from './pages/Inventory';
import AuditLog from './pages/AuditLog';
import AgencyConsole from './pages/AgencyConsole';
import { useState } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 },
  }
});

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: Map, exact: true },
  { to: '/report', label: 'Zone Report', icon: FileText },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/agency', label: 'Agency', icon: Radio },
  { to: '/audit', label: 'Audit Log', icon: ScrollText },
];

const DEV_TRIGGERS = [
  { event: 'ZoneUpdated', label: 'Zone↑', color: 'bg-blue-700 hover:bg-blue-600' },
  { event: 'AllocationRecalculated', label: 'Alloc', color: 'bg-purple-700 hover:bg-purple-600' },
  { event: 'DuplicateFlagged', label: 'Dup', color: 'bg-yellow-700 hover:bg-yellow-600' },
  { event: 'AgencyStatusChanged', label: 'Agency', color: 'bg-green-700 hover:bg-green-600' },
];

function Shell({ children }: { children: React.ReactNode }) {
  const [devOpen, setDevOpen] = useState(false);

  const handleDevTrigger = (event: string) => {
    if (event === 'ZoneUpdated') {
      const zone = { ...seedZones[0] };
      zone.severity_score = Math.min(99, zone.severity_score + Math.floor(Math.random() * 10) + 1);
      zone.deterioration_delta = `+${Math.floor(Math.random() * 10) + 1} since last report`;
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
      addAuditEntry({
        timestamp: new Date().toISOString(),
        event_type: 'duplicate_flagged',
        actor: 'Agent A (Detection)',
        zone_id: 'zone_042',
        summary: 'Flagged duplicate effort in Zone 042 between Red Cross Unit 4 and FEMA Response Team for medical needs.',
        raw_payload: { zone_id: 'zone_042', conflict: ['Red Cross Unit 4', 'FEMA Response Team'], need_type: 'medical' }
      });
      socket.emitFromServer('DuplicateFlagged', { zone_id: 'zone_042', conflict: ['Red Cross Unit 4', 'FEMA Response Team'], need_type: 'medical' });
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top nav bar */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur shrink-0 z-50 relative">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 shadow-lg shadow-red-900/50">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-none">PS20 COORDINATOR</p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Agentic Disaster Relief</p>
          </div>
        </div>

        {/* Nav — desktop only */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-slate-700 text-slate-100 font-medium'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* DEV trigger toggle */}
        <button
          onClick={() => setDevOpen(v => !v)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors border',
            devOpen
              ? 'bg-slate-700 border-slate-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          )}
        >
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          DEV
          <ChevronDown className={cn("w-3 h-3 transition-transform", devOpen && "rotate-180")} />
        </button>

        {/* DEV drawer */}
        {devOpen && (
          <div className="absolute top-full right-0 mt-1 mr-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-3 flex flex-col gap-2 z-50 min-w-52">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Mock WS Event Triggers</p>
            {DEV_TRIGGERS.map(({ event, label, color }) => (
              <button
                key={event}
                onClick={() => { handleDevTrigger(event); setDevOpen(false); }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-white transition-colors text-left',
                  color
                )}
              >
                <Zap className="w-3 h-3" />
                <span className="font-semibold">{label}</span>
                <span className="ml-auto text-white/60">{event}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Mobile bottom-tab nav */}
      <nav className="md:hidden flex items-center border-t border-slate-800 bg-slate-900/95 backdrop-blur shrink-0">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => cn(
              'flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition-colors',
              isActive ? 'text-blue-400' : 'text-slate-500'
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
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
            <Route path="/audit" element={<AuditLog />} />
          </Routes>
        </Shell>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
