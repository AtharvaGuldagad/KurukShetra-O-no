import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Package, Truck, Activity, ShieldAlert, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';

export function OfficialLayout() {
  const { role, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState<string>('connected');

  // Must be authenticated to see this layout
  if (!isAuthenticated) {
    return <Navigate to="/official/login" replace />;
  }

  // Socket connection heartbeat visualizer optional feature here
  useEffect(() => {
    // In a real app we'd attach to socket state, setting connected here for now
    setConnectionStatus('connected');
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/official/login');
  };

  const navItems = [
    { name: 'Coordination', path: '/official', icon: LayoutDashboard },
    { name: 'Inventory', path: '/official/inventory', icon: Package },
    { name: 'Agency Units', path: '/official/agencies', icon: Truck },
    { name: 'Audit Log', path: '/official/audit', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col font-mono selection:bg-emerald-900 selection:text-emerald-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 shadow-xl shadow-black/20">
        <div className="flex justify-between items-center h-14 px-4">
          <div className="flex items-center gap-6">
            <Link to="/official" className="flex items-center gap-2 group">
              <div className="bg-emerald-950 p-1.5 rounded-md border border-emerald-900 group-hover:border-emerald-700 transition-colors">
                <ShieldAlert className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-emerald-50 font-bold leading-tight tracking-wide">SOLACE</span>
                <span className="text-[9px] text-emerald-500 font-semibold tracking-widest uppercase">Ops Center</span>
              </div>
            </Link>

            <nav className="hidden md:flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-slate-800 text-emerald-400 shadow-inner" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800">
              <div className={cn(
                "w-2 h-2 rounded-full",
                connectionStatus === 'connected' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              )} />
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                {connectionStatus}
              </span>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-200">ADMIN</span>
                <span className="text-[10px] text-emerald-500 uppercase tracking-wider">{role}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto border-t border-slate-800 p-2 gap-1 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all",
                  isActive ? "bg-slate-800 text-emerald-400" : "text-slate-400"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main App Content - No more full Shell wrapping, the Layout *is* the shell */}
      <main className="flex-1 flex overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
