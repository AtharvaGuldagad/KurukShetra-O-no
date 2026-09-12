import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, Map, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export function CitizenLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">SOLACE</h1>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Citizen Portal</p>
              </div>
            </div>

            <nav className="flex gap-1 md:gap-4">
              <Link
                to="/"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                  location.pathname === '/' 
                    ? "bg-slate-100 text-slate-900" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Active Zones</span>
              </Link>
              <Link
                to="/report"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                  location.pathname === '/report'
                    ? "bg-rose-50 text-rose-700"
                    : "text-rose-600 hover:bg-rose-50"
                )}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Report Incident</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>SOLACE Disaster Relief Operations. For emergency, please call local authorities directly.</p>
          <div className="mt-2">
            <Link to="/official" className="text-emerald-600 hover:underline">Official Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
