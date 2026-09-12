import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { MapPin, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';

export function CitizenReport() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    location: '',
    disaster_type: 'flood',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simplistic mapping to API expected payload
      await apiClient.submitReport({
        location: { lat: 0, lng: 0, name: formData.location },
        disaster_type: formData.disaster_type,
        needs: [{ type: 'rescue', urgency: 'high' }], // Agent A is meant to parse raw text, so this is minimal
        description_raw: formData.description 
      } as any);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-12 bg-emerald-50 rounded-2xl p-8 border border-emerald-100 text-center animate-in zoom-in-95">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Report Submitted</h2>
        <p className="text-slate-600 mb-6">
          Thank you. Your incident report has been securely transmitted to the SOLACE emergency operations center.
        </p>
        <p className="text-sm text-slate-500">Redirecting to map...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-200 bg-rose-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="text-rose-500 w-5 h-5" />
              Report Incident
            </h2>
            <p className="text-sm text-slate-600 mt-1">If this is a life-threatening emergency, call your local authorities first.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Location</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                required
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="City, neighborhood, or landmark"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Disaster Type</label>
            <select
              value={formData.disaster_type}
              onChange={e => setFormData({...formData, disaster_type: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              <option value="flood">Flood</option>
              <option value="landslide">Landslide</option>
              <option value="earthquake">Earthquake</option>
              <option value="hurricane">Cyclone / Hurricane</option>
              <option value="fire">Wildfire</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Situation Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              required
              rows={5}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors resize-none"
              placeholder="Describe what you see. How many people are affected? Are there immediate rescue or medical needs?"
            />
            <p className="text-xs text-slate-500">Our AI (Agent A) will process this text to extract urgent needs automatically.</p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 focus:ring-4 focus:ring-rose-100 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
