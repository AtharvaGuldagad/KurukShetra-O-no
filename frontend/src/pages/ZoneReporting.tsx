import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { FileText, Send, CheckCircle2, Info, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { type Zone } from '../api/mockData';

export default function ZoneReporting() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    zone_id: '',
    locationName: '',
    lat: '',
    lng: '',
    disaster_type: 'flood',
    casualties: 0,
    population_affected_est: 0,
    severity_score: 50,
    raw_report: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: Partial<Zone>) => apiClient.submitReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      setToastMessage("Report submitted successfully.");
      setTimeout(() => {
        setToastMessage(null);
        navigate('/'); // Go back to dashboard after a delay
      }, 2000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert to the Partial<Zone> structure expected by mock API
    const reportData: Partial<Zone> = {
      ...(formData.zone_id ? { zone_id: formData.zone_id } : {}),
      location: {
        name: formData.locationName || 'Unknown Location',
        lat: parseFloat(formData.lat) || 34.0, // Defaulting to somewhere around LA for the map
        lng: parseFloat(formData.lng) || -118.2,
      },
      disaster_type: formData.disaster_type,
      casualties: formData.casualties,
      population_affected_est: formData.population_affected_est,
      severity_score: formData.severity_score,
      priority_tier: formData.severity_score >= 80 ? 'Critical' : formData.severity_score >= 60 ? 'High' : formData.severity_score >= 40 ? 'Medium' : 'Low',
    };

    mutation.mutate(reportData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['casualties', 'population_affected_est', 'severity_score'].includes(name) 
        ? Number(value) 
        : value
    }));
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 lg:p-12 bg-slate-950">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 bg-blue-900/50 rounded-lg text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Zone Reporting</h1>
            <p className="text-slate-500 text-sm">Submit field reports for Agent A triage processing.</p>
          </div>
          <NavLink
            to="/"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </NavLink>
        </div>

        {toastMessage && (
          <div className="p-4 bg-green-950/50 border border-green-900/50 text-green-400 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{toastMessage}</span>
            <span className="text-sm ml-auto animate-pulse">Redirecting to Dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Zone ID (Optional)</label>
              <input 
                type="text" 
                name="zone_id"
                value={formData.zone_id}
                onChange={handleChange}
                placeholder="e.g. zone_042"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3" /> Leave blank to create a new zone
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Disaster Type</label>
              <select 
                name="disaster_type"
                value={formData.disaster_type}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="flood">Flood</option>
                <option value="fire">Fire</option>
                <option value="earthquake">Earthquake</option>
                <option value="landslide">Landslide</option>
                <option value="hurricane">Hurricane</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Location Name</label>
              <input 
                type="text" 
                name="locationName"
                required
                value={formData.locationName}
                onChange={handleChange}
                placeholder="e.g. Westside Clinic"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Latitude</label>
              <input 
                type="number"
                name="lat"
                step="0.0001"
                min="-90"
                max="90"
                value={formData.lat}
                onChange={handleChange}
                placeholder="34.0522"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Longitude</label>
              <input 
                type="number"
                name="lng"
                step="0.0001"
                min="-180"
                max="180"
                value={formData.lng}
                onChange={handleChange}
                placeholder="-118.2437"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Reported Casualties</label>
              <input 
                type="number" 
                name="casualties"
                min="0"
                value={formData.casualties}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Population Affected (Est.)</label>
              <input 
                type="number" 
                name="population_affected_est"
                min="0"
                value={formData.population_affected_est}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Computed Severity Score (Mock Agent A)</label>
              <span className={cn(
                "text-sm font-bold px-2 py-0.5 rounded",
                formData.severity_score >= 80 ? "text-red-400 bg-red-950/40" : formData.severity_score >= 60 ? "text-orange-400 bg-orange-950/40" : formData.severity_score >= 40 ? "text-yellow-400 bg-yellow-950/40" : "text-green-400 bg-green-950/40"
              )}>
                {formData.severity_score}
              </span>
            </div>
            <div className="relative">
              <input 
                type="range" 
                name="severity_score"
                min="0" 
                max="100"
                value={formData.severity_score}
                onChange={handleChange}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${
                    formData.severity_score >= 80 ? '#ef4444' : formData.severity_score >= 60 ? '#f97316' : formData.severity_score >= 40 ? '#eab308' : '#22c55e'
                  } ${formData.severity_score}%, #1e293b ${formData.severity_score}%)`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Low (0)</span><span>Medium (40)</span><span>High (60)</span><span>Critical (80)</span>
            </div>
            <p className="text-xs text-slate-500 italic">
              *In the full system, Agent A computes this score based on the raw report text. We use a slider here to manually override and test the UI thresholds.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Raw Report Text</label>
            <textarea 
              name="raw_report"
              rows={4}
              value={formData.raw_report}
              onChange={handleChange}
              placeholder="Enter the unstructured field report..."
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-y"
            ></textarea>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button 
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Report
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
