import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import { CitizenLayout } from './layouts/CitizenLayout';
import { OfficialLayout } from './layouts/OfficialLayout';

// Pages
import { CitizenHome } from './pages/citizen/CitizenHome';
import { CitizenReport } from './pages/citizen/CitizenReport';
import { LoginPage } from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AuditLog from './pages/AuditLog';
import AgencyConsole from './pages/AgencyConsole';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10000 },
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Citizen UI (Public) */}
            <Route path="/" element={<CitizenLayout />}>
              <Route index element={<CitizenHome />} />
              <Route path="report" element={<CitizenReport />} />
            </Route>

            {/* Official Auth */}
            <Route path="/official/login" element={<LoginPage />} />

            {/* Official UI (Protected) */}
            <Route path="/official" element={<OfficialLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="agencies" element={<AgencyConsole />} />
              <Route path="audit" element={<AuditLog />} />
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
