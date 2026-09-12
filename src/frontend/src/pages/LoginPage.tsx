import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, User, AlertCircle, Loader2 } from 'lucide-react';


export function LoginPage() {
  const [username, setUsername] = useState('ADMIN');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      
      if (!res.ok) {
        throw new Error('Invalid credentials');
      }
      
      const data = await res.json();
      login(data.access_token, data.role);
      
      if (data.role === 'official') {
        navigate('/official');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 z-10 text-center space-y-2">
        <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-2xl mb-2 backdrop-blur-sm">
          <Shield className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">SOLACE</h1>
        <p className="text-slate-400 font-medium tracking-wide text-sm">Disaster Relief Operations Center</p>
      </div>
      
      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10">
        <div className="p-8">
          <h2 className="text-xl font-semibold text-white mb-6 tracking-tight">Official Login</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all sm:text-sm"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all sm:text-sm"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-sm transition-all animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-emerald-950 bg-emerald-400 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all shadow-[0_0_20px_rgba(52,211,153,0.1)] hover:shadow-[0_0_25px_rgba(52,211,153,0.2)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-900" />
              ) : (
                "Authenticate & Connect"
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-slate-950/50 p-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            For authorized government and agency personnel only.
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center z-10">
        <a 
          href="/" 
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
          className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 focus:outline-none"
        >
          <span>Return to Citizen Portal</span>
        </a>
      </div>
    </div>
  );
}
