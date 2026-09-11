import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { socket } from './api/socket';
import { seedZones } from './api/mockData';
import { db } from './api/client';
import Dashboard from './pages/Dashboard';
import { cn } from './lib/utils';
import {
  Map, FileText, Package, Radio, ScrollText,
  Zap, AlertCircle
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 },
  }
});

// Stub pages for phases 2–8
const ZoneReporting = () => (
  <div className="p-8 text-slate-400">
    <h2 className="text-xl font-semibold text-slate-200 mb-2">Zone Reporting</h2>
    <p>Field report submission form — Phase 3.</p>
  </div>
);
const Inventory = () => (
  <div className="p-8 text-slate-400">
    <h2 className="text-xl font-semibold text-slate-200 mb-2">Resource Inventory</h2>
    <p>Stock management table — Phase 4.</p>
  </div>
);
const AgencyConsole = () => (
  <div className="p-8 text-slate-400">
    <h2 className="text-xl font-semibold text-slate-200 mb-2">Agency Console</h2>
    <p>Per-agency task queue — Phase 8.</p>
  </div>
);
const AuditLog = () => (
  <div className="p-8 text-slate-400">
    <h2 className="text-xl font-semibold text-slate-200 mb-2">Audit Log</h2>
    <p>Filterable event history — Phase 6.</p>
  </div>
);

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: Map, exact: true },
  { to: '/report', label: 'Zone Report', icon: FileText },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/agency', label: 'Agency', icon: Radio },
  { to: '/audit', label: 'Audit Log', icon: ScrollText },
];

function Shell({ children }: { children: React.ReactNode }) {
  const handleDevTrigger = (event: string) => {
    if (event === 'ZoneUpdated') {
      // Pick a random zone and bump its score
      const zone = { ...seedZones[0] };
      zone.severity_score = Math.min(99, zone.severity_score + Math.floor(Math.random() * 10) + 1);
      zone.deterioration_delta = `+${Math.floor(Math.random() * 10) + 1} since last report`;
      zone.priority_tier = 'Critical';
      db.zones = db.zones.map(z => z.zone_id === zone.zone_id ? zone : z);
      socket.emitFromServer('ZoneUpdated', zone);
    } else if (event === 'AllocationRecalculated') {
      socket.emitFromServer('AllocationRecalculated', { reason: 'dev_trigger' });
    } else if (event === 'DuplicateFlagged') {
      socket.emitFromServer('DuplicateFlagged', {
        zone_id: 'zone_042',
        conflict: ['Red Cross Unit 4', 'FEMA Response Team'],
        need_type: 'medical'
      });
    } else if (event === 'AgencyStatusChanged') {
      socket.emitFromServer('AgencyStatusChanged', { agency_id: 'agency_redcross_4', status: 'in_progress' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top nav bar */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur shrink-0 z-50">
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

        {/* Nav */}
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

        {/* Dev controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-600 font-mono mr-1">DEV</span>
          {[
            { event: 'ZoneUpdated', label: 'Zone↑', color: 'bg-blue-700 hover:bg-blue-600' },
            { event: 'AllocationRecalculated', label: 'Alloc', color: 'bg-purple-700 hover:bg-purple-600' },
            { event: 'DuplicateFlagged', label: 'Dup', color: 'bg-yellow-700 hover:bg-yellow-600' },
            { event: 'AgencyStatusChanged', label: 'Agency', color: 'bg-green-700 hover:bg-green-600' },
          ].map(({ event, label, color }) => (
            <button
              key={event}
              onClick={() => handleDevTrigger(event)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-white transition-colors',
                color
              )}
            >
              <Zap className="w-2.5 h-2.5" />
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
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
