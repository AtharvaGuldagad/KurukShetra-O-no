import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { socket } from './api/socket';
import { InventoryDashboard } from './components/inventory/InventoryDashboard';
import { 
  ShieldAlert, 
  Boxes, 
  MapPin, 
  Users, 
  ClipboardList, 
  Activity
} from 'lucide-react';

const queryClient = new QueryClient();

// Placeholders for future phases
const CoordinationDashboard = () => (
  <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl space-y-4">
    <ShieldAlert className="w-12 h-12 text-blue-400 mx-auto" />
    <h2 className="text-xl font-bold text-white">PS20 — Emergency Coordination Dashboard</h2>
    <p className="text-sm text-slate-400 max-w-lg mx-auto">
      Incident zone heatmaps, needs-assessment scoring, and dynamic OR-Tools optimization allocations.
    </p>
    <div className="pt-4">
      <NavLink
        to="/inventory"
        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-500/25"
      >
        <Boxes className="w-4 h-4" />
        <span>Open Resource Inventory Command Center &rarr;</span>
      </NavLink>
    </div>
  </div>
);

const ZoneReporting = () => (
  <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl space-y-3">
    <MapPin className="w-10 h-10 text-emerald-400 mx-auto" />
    <h2 className="text-lg font-bold text-white">Zone Field Incident Reporting</h2>
    <p className="text-xs text-slate-400">
      Multi-agent ingest form for ground crews, satellite feeds, and damage assessments.
    </p>
  </div>
);

const AgencyConsole = () => (
  <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl space-y-3">
    <Users className="w-10 h-10 text-purple-400 mx-auto" />
    <h2 className="text-lg font-bold text-white">Inter-Agency Coordination Console</h2>
    <p className="text-xs text-slate-400">
      Cross-agency task dispatching (Red Cross, FEMA, US Coast Guard, WFP, National Guard).
    </p>
  </div>
);

const AuditLog = () => (
  <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl space-y-3">
    <ClipboardList className="w-10 h-10 text-amber-400 mx-auto" />
    <h2 className="text-lg font-bold text-white">Audit & Decision Trail</h2>
    <p className="text-xs text-slate-400">
      Full transparent audit log of algorithmic allocation decisions and supply shipments.
    </p>
  </div>
);

const Shell = ({ children }: { children: React.ReactNode }) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerMockEvent = () => {
    socket.emitFromServer('ZoneUpdated', { id: 'mock_zone_delta', status: 'live delta report' });
    socket.emitFromServer('AllocationRecalculated', { reason: 'manual_dev_simulation_test' });
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Emergency System Bar */}
      <header className="bg-slate-950/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
          {/* Logo / Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-black tracking-tight text-white">
                  KURUKSHETRA <span className="text-blue-400">PS20</span>
                </h1>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  v1.2 Agentic
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Disaster Relief & Resource Coordinator
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2 text-xs font-semibold">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg flex items-center space-x-1.5 transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </NavLink>

            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg flex items-center space-x-1.5 transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Resource Inventory</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
            </NavLink>

            <NavLink
              to="/report"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg flex items-center space-x-1.5 transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Report Zone</span>
            </NavLink>

            <NavLink
              to="/agency"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg flex items-center space-x-1.5 transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Agencies</span>
            </NavLink>

            <NavLink
              to="/audit"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg flex items-center space-x-1.5 transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Audit Log</span>
            </NavLink>
          </nav>

          {/* Right Status Indicator */}
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{timeStr || 'LIVE'}</span>
            </div>

            <button
              onClick={triggerMockEvent}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded border border-slate-800 text-[10px] font-mono transition"
              title="Broadcast simulated WebSocket event"
            >
              Simulate WS
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 p-4 text-center text-xs text-slate-500">
        PS20 Agentic Disaster Relief & Emergency Resource Coordinator • Multi-Agent Autonomous Supply Routing
      </footer>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Shell>
          <Routes>
            <Route path="/" element={<Navigate to="/inventory" replace />} />
            <Route path="/overview" element={<CoordinationDashboard />} />
            <Route path="/inventory" element={<InventoryDashboard />} />
            <Route path="/report" element={<ZoneReporting />} />
            <Route path="/agency" element={<AgencyConsole />} />
            <Route path="/audit" element={<AuditLog />} />
          </Routes>
        </Shell>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
