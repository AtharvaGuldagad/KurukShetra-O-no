import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { socket } from './api/socket';

const queryClient = new QueryClient();

// Placeholder components for Phase 0
const Dashboard = () => <div><h2>Dashboard</h2><p>Coordination map and ranked list will go here.</p></div>;
const ZoneReporting = () => <div><h2>Zone Reporting</h2><p>Field report form will go here.</p></div>;
const Inventory = () => <div><h2>Inventory</h2><p>Stock management will go here.</p></div>;
const AgencyConsole = () => <div><h2>Agency Console</h2><p>Agency tasks will go here.</p></div>;
const AuditLog = () => <div><h2>Audit Log</h2><p>Event history will go here.</p></div>;

const Shell = ({ children }: { children: React.ReactNode }) => {
  const triggerMockEvent = () => {
    // A mock dev-only trigger
    socket.emitFromServer('ZoneUpdated', { id: 'mock_zone', status: 'live event triggered!' });
    alert('Mock WebSocket ZoneUpdated event fired (check console / React Query later).');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">PS20 — Emergency Coordinator</h1>
        <nav className="space-x-4">
          <NavLink to="/" className={({isActive}) => isActive ? "font-bold underline" : ""}>Dashboard</NavLink>
          <NavLink to="/report" className={({isActive}) => isActive ? "font-bold underline" : ""}>Report Zone</NavLink>
          <NavLink to="/inventory" className={({isActive}) => isActive ? "font-bold underline" : ""}>Inventory</NavLink>
          <NavLink to="/agency" className={({isActive}) => isActive ? "font-bold underline" : ""}>Agency Console</NavLink>
          <NavLink to="/audit" className={({isActive}) => isActive ? "font-bold underline" : ""}>Audit Log</NavLink>
        </nav>
        <button 
          onClick={triggerMockEvent}
          className="bg-accent text-accent-foreground px-3 py-1 rounded text-sm hover:opacity-90"
        >
          [DEV] Fire WS Event
        </button>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
};

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
