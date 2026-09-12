
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { AlertTriangle, Users } from 'lucide-react';

// For demo purposes, we will not use the full complex ZoneMap on the citizen view.
// We'll show a simplified list/card view of current incidents.
export function CitizenHome() {
  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['zones'],
    queryFn: apiClient.getZones,
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-8 border-b border-slate-200 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Active Disaster Zones</h2>
          <p className="text-slate-500">
            Real-time assessment of affected areas. Information is updated continuously by field reporters and emergency services.
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading incident data...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50/50">
            {zones.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
                No active incidents reported.
              </div>
            ) : (
              zones.map((zone) => (
                <div key={zone.zone_id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className={`h-2 w-full ${zone.severity_score >= 80 ? 'bg-rose-500' : 'bg-amber-400'}`} />
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <h3 className="font-bold text-slate-900 leading-tight flex-1">{zone.location.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide
                        ${zone.severity_score >= 80 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}
                      `}>
                        {zone.severity_score >= 80 ? 'CRITICAL' : 'HIGH'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-4 capitalize font-medium">
                      <AlertTriangle className="w-4 h-4 text-slate-400" />
                      {zone.disaster_type}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Users className="w-3 h-3" /> Affected
                        </p>
                        <p className="font-semibold text-slate-700">
                          {zone.population_affected_est > 0 ? zone.population_affected_est.toLocaleString() : 'Estimating...'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Needs</p>
                        <div className="flex gap-1 flex-wrap">
                          {zone.needs.slice(0,2).map(n => (
                            <span key={n.type} className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {n.type}
                            </span>
                          ))}
                          {zone.needs.length > 2 && <span className="text-[10px] px-1 py-0.5 text-slate-400">+{zone.needs.length - 2}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
