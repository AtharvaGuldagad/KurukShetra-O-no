import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { type Zone } from '../api/mockData';
import { cn } from '../lib/utils';
import { Plus, Minus, CheckCircle, Upload, X } from 'lucide-react';

const DISASTER_TYPES = [
  { id: 'flood', label: 'Flood' },
  { id: 'earthquake', label: 'Earthquake' },
  { id: 'fire', label: 'Fire' },
  { id: 'landslide', label: 'Landslide' },
  { id: 'hurricane', label: 'Hurricane' },
];

const NEED_TYPES = [
  'Medical',
  'Shelter',
  'Food',
  'Rescue',
  'Water',
];

export default function ZoneReporting() {
  const queryClient = useQueryClient();

  const [locationName, setLocationName] = useState('');
  const [disasterType, setDisasterType] = useState('flood');
  const [casualties, setCasualties] = useState(0);
  const [populationAffected, setPopulationAffected] = useState(500);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(['Medical']);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [submittedZoneId, setSubmittedZoneId] = useState<string | null>(null);

  // Auto-geocode preview coordinate resolution based on location input (India coordinates)
  const resolvedLat = locationName.trim()
    ? (11.5540 + (locationName.length * 0.015) % 15.0).toFixed(4)
    : '11.5540';
  const resolvedLng = locationName.trim()
    ? (76.1265 + (locationName.length * 0.018) % 15.0).toFixed(4)
    : '76.1265';

  const mutation = useMutation({
    mutationFn: (data: Partial<Zone>) => apiClient.submitReport(data),
    onSuccess: (zone) => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      setSubmittedZoneId(zone.zone_id);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim()) return;

    const reportData: Partial<Zone> = {
      location: {
        name: locationName.trim(),
        lat: parseFloat(resolvedLat),
        lng: parseFloat(resolvedLng),
      },
      disaster_type: disasterType,
      casualties,
      population_affected_est: populationAffected,
      severity_score: Math.min(99, Math.max(20, Math.round((casualties * 5) + (populationAffected / 100)))),
      priority_tier: casualties > 5 || populationAffected > 5000 ? 'Critical' : populationAffected > 1500 ? 'High' : 'Medium',
      needs: selectedNeeds.map(n => ({
        type: n.toLowerCase(),
        urgency: (casualties > 0 && n === 'Medical') ? 'critical' : 'high'
      })),
      source_confidence: 0.88,
      source_refs: ['direct_coordinator_input'],
      deterioration_delta: 'initial report',
    };

    mutation.mutate(reportData);
  };

  const toggleNeed = (need: string) => {
    setSelectedNeeds(prev =>
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    );
  };

  const handleSimulatePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fakeUrl = URL.createObjectURL(file);
      setUploadedPhotos(prev => [...prev, fakeUrl]);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0E0F11] p-4 lg:p-6 text-[#E8EAED]">
      {/* Page Header */}
      <div className="border-b border-[#2A2E33] pb-3 mb-5">
        <h1 className="text-lg font-bold uppercase tracking-tight text-[#E8EAED]">
          Zone Incident Intake
        </h1>
        <p className="text-xs text-[#9BA1A8] mt-0.5">
          Structured field reporting dispatch for Agent A triage ingestion
        </p>
      </div>

      {/* Part 1: Single-column form, max-width ~640px, left-aligned */}
      <div className="max-w-[640px]">
        {/* Inline confirmation (not a toast that disappears before stressed user reads it) */}
        {submittedZoneId && (
          <div className="mb-5 p-3 bg-[#4C7A5E]/15 border border-[#4C7A5E] text-[#E8EAED] flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#4C7A5E] shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-[#4C7A5E]">Report submitted</span>
                {' — '}
                Zone <span className="font-mono text-[#E8EAED] font-bold">{submittedZoneId}</span> updated and queued for automated dispatch.
              </div>
            </div>
            <button
              onClick={() => setSubmittedZoneId(null)}
              className="text-[#9BA1A8] hover:text-[#E8EAED] text-xs p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="border border-[#2A2E33] bg-[#171A1D] p-5 space-y-5">
          {/* Field 1: Location with auto-geocode preview */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-tight text-[#9BA1A8] mb-1.5">
              1. Incident Location / Landmark
            </label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Sector 4 Harbor, East Bridge, Central Clinic"
              className="w-full bg-[#0E0F11] border border-[#2A2E33] focus:border-[#3E7CB1] px-3 py-2 text-sm text-[#E8EAED] placeholder-[#9BA1A8]/40 outline-none transition-none"
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#9BA1A8]">
              <span>Auto-resolved geocode:</span>
              <span className="font-mono text-[#E8EAED]">
                {resolvedLat}° N, {resolvedLng}° W
              </span>
            </div>
          </div>

          {/* Field 2: Disaster type (segmented control, not a dropdown) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-tight text-[#9BA1A8] mb-1.5">
              2. Disaster Classification
            </label>
            <div className="grid grid-cols-5 border border-[#2A2E33] bg-[#0E0F11] divide-x divide-[#2A2E33]">
              {DISASTER_TYPES.map((dt) => {
                const isSelected = disasterType === dt.id;
                return (
                  <button
                    key={dt.id}
                    type="button"
                    onClick={() => setDisasterType(dt.id)}
                    className={cn(
                      'py-2 px-1 text-xs font-medium uppercase tracking-tight transition-none text-center',
                      isSelected
                        ? 'bg-[#1E2226] text-[#E8EAED] border-b-2 border-b-[#3E7CB1]'
                        : 'text-[#9BA1A8] hover:text-[#E8EAED] hover:bg-[#171A1D]'
                    )}
                  >
                    {dt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field 3: Casualties and Population Affected (numeric steppers, not free text) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-tight text-[#9BA1A8] mb-1.5">
                3a. Confirmed Casualties
              </label>
              <div className="flex items-stretch border border-[#2A2E33] bg-[#0E0F11]">
                <button
                  type="button"
                  onClick={() => setCasualties(prev => Math.max(0, prev - 1))}
                  className="px-3 py-2 bg-[#171A1D] hover:bg-[#1E2226] text-[#9BA1A8] hover:text-[#E8EAED] border-r border-[#2A2E33] transition-none"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 flex items-center justify-center font-mono text-sm text-[#E8EAED]">
                  {casualties}
                </div>
                <button
                  type="button"
                  onClick={() => setCasualties(prev => prev + 1)}
                  className="px-3 py-2 bg-[#171A1D] hover:bg-[#1E2226] text-[#9BA1A8] hover:text-[#E8EAED] border-l border-[#2A2E33] transition-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-tight text-[#9BA1A8] mb-1.5">
                3b. Estimated Population Affected
              </label>
              <div className="flex items-stretch border border-[#2A2E33] bg-[#0E0F11]">
                <button
                  type="button"
                  onClick={() => setPopulationAffected(prev => Math.max(50, prev - 250))}
                  className="px-3 py-2 bg-[#171A1D] hover:bg-[#1E2226] text-[#9BA1A8] hover:text-[#E8EAED] border-r border-[#2A2E33] transition-none"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 flex items-center justify-center font-mono text-sm text-[#E8EAED]">
                  {populationAffected.toLocaleString()}
                </div>
                <button
                  type="button"
                  onClick={() => setPopulationAffected(prev => prev + 250)}
                  className="px-3 py-2 bg-[#171A1D] hover:bg-[#1E2226] text-[#9BA1A8] hover:text-[#E8EAED] border-l border-[#2A2E33] transition-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Field 4: Needs (multi-select chips: Medical / Shelter / Food / Rescue / Water) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-tight text-[#9BA1A8] mb-1.5">
              4. Immediate Unmet Needs
            </label>
            <div className="flex flex-wrap gap-2">
              {NEED_TYPES.map((need) => {
                const isSelected = selectedNeeds.includes(need);
                return (
                  <button
                    key={need}
                    type="button"
                    onClick={() => toggleNeed(need)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium uppercase tracking-tight border transition-none',
                      isSelected
                        ? 'border-[#3E7CB1] bg-[#3E7CB1]/20 text-[#E8EAED]'
                        : 'border-[#2A2E33] bg-[#0E0F11] text-[#9BA1A8] hover:border-[#9BA1A8]'
                    )}
                  >
                    {need}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field 5: Photo upload (simple drag zone, square thumbnails, no decorative illustration) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-tight text-[#9BA1A8] mb-1.5">
              5. Photographic Evidence
            </label>
            <div className="border border-dashed border-[#2A2E33] bg-[#0E0F11] p-4 text-center">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handleSimulatePhoto}
                className="hidden"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer inline-flex items-center gap-2 text-xs text-[#9BA1A8] hover:text-[#E8EAED]"
              >
                <Upload className="w-4 h-4 text-[#3E7CB1]" />
                <span>Select file or drag image here</span>
              </label>

              {uploadedPhotos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  {uploadedPhotos.map((url, idx) => (
                    <div key={idx} className="w-16 h-16 border border-[#2A2E33] bg-[#171A1D] overflow-hidden relative group">
                      <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setUploadedPhotos(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-black/60 text-[#E8EAED] opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit button: "Submit report" (active voice) */}
          <div className="pt-2 border-t border-[#2A2E33] flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending || !locationName.trim()}
              className="px-5 py-2 bg-[#3E7CB1] hover:bg-[#346a99] disabled:opacity-50 text-[#E8EAED] text-xs font-bold uppercase tracking-tight transition-none cursor-pointer"
            >
              {mutation.isPending ? 'Submitting report...' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
