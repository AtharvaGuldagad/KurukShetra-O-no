import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type Zone } from '../../api/mockData';

const STYLE_ID = 'solace-map-styles';
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes solace-live-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(62, 124, 177, 0.8); }
      70%  { box-shadow: 0 0 0 10px rgba(62, 124, 177, 0); }
      100% { box-shadow: 0 0 0 0 rgba(62, 124, 177, 0); }
    }
    .solace-marker-wrap {
      background: transparent !important;
      border: none !important;
    }
    .solace-marker-inner {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .solace-marker-dot {
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      line-height: 1;
      color: #E8EAED;
      font-family: 'IBM Plex Mono', monospace;
      border-radius: 50%;
      box-sizing: border-box;
      user-select: none;
      cursor: pointer;
    }
    .solace-marker-pulse-active {
      animation: solace-live-pulse 600ms ease-out forwards;
    }
    .leaflet-tooltip-solace {
      background: #171A1D;
      border: 1px solid #2A2E33;
      color: #E8EAED;
      border-radius: 2px;
      font-size: 11px;
      padding: 6px 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.6);
      font-family: 'Public Sans', sans-serif;
    }
    .leaflet-tooltip-solace.leaflet-tooltip-top::before {
      border-top-color: #2A2E33;
    }
    .leaflet-container {
      background: #0d0e10 !important;
      font-family: 'Public Sans', sans-serif !important;
    }
    /* Apply dark inversion filter ONLY to the tile pane, not markers */
    .leaflet-tile-pane {
      filter: invert(1) hue-rotate(180deg) brightness(0.82) contrast(1.35) saturate(0.55);
    }
    /* Attribution dark styling */
    .leaflet-control-attribution {
      background: rgba(14, 15, 17, 0.85) !important;
      color: #9BA1A8 !important;
      font-size: 9px !important;
    }
    .leaflet-control-attribution a {
      color: #3E7CB1 !important;
    }
  `;
  document.head.appendChild(style);
}

const TIER_COLORS: Record<string, string> = {
  Critical: '#C4432E',
  High:     '#C97A2E',
  Medium:   '#B8A13A',
  Low:      '#4C7A5E',
};

// Default India center coordinates
const INDIA_CENTER: L.LatLngTuple = [21.5, 79.0];
const INDIA_ZOOM = 5;

function createZoneIcon(zone: Zone, isSelected: boolean, isRecentlyUpdated: boolean): L.DivIcon {
  const color = TIER_COLORS[zone.priority_tier] ?? '#9BA1A8';
  
  // Moderate size: 18px to 24px
  const pop = zone.population_affected_est || 1000;
  const sizeRatio = Math.min(1, Math.max(0, (pop - 1000) / 20000));
  const baseSize = Math.round(18 + sizeRatio * 6);
  const wrapSize = baseSize + 8;
  const pulseClass = isRecentlyUpdated ? 'solace-marker-pulse-active' : '';

  return L.divIcon({
    className: 'solace-marker-wrap',
    html: `
      <div class="solace-marker-inner" style="width:${wrapSize}px;height:${wrapSize}px;">
        <div class="solace-marker-dot ${pulseClass}" style="
          width:${baseSize}px;
          height:${baseSize}px;
          background:${color};
          border:${isSelected ? '2.5px solid #FFFFFF' : '1.5px solid rgba(14,15,17,0.8)'};
          font-size:${baseSize <= 18 ? 9 : 10}px;
        ">
          <span>${zone.severity_score}</span>
        </div>
      </div>`,
    iconSize:   [wrapSize, wrapSize],
    iconAnchor: [wrapSize / 2, wrapSize / 2],
  });
}

interface ZoneMapProps {
  zones: Zone[];
  selectedZoneId: string | null;
  recentlyUpdated: Set<string>;
  onSelectZone: (zoneId: string) => void;
}

export default function ZoneMap({
  zones,
  selectedZoneId,
  recentlyUpdated,
  onSelectZone,
}: ZoneMapProps) {
  const mapRef       = useRef<HTMLDivElement>(null);
  const mapInstance  = useRef<L.Map | null>(null);
  const markers      = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef  = useRef(onSelectZone);
  onSelectRef.current = onSelectZone;

  // Init OSM + dark CSS-filter map once (India view)
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: INDIA_CENTER,
      zoom: INDIA_ZOOM,
      zoomControl: true,
      attributionControl: true,
      minZoom: 4,
      maxZoom: 18,
    });

    // OpenStreetMap standard tiles — free, no API key.
    // The dark look is achieved purely via CSS filter on .leaflet-tile-pane
    // (invert + hue-rotate + brightness/contrast/saturate), so markers
    // rendered in separate panes remain unfiltered and full-colour.
    L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19,
        // Tell browsers the tiles are cross-origin so the CSS filter renders correctly
        crossOrigin: 'anonymous',
      }
    ).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      markers.current.clear();
    };
  }, []);

  // Sync markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const activeIds = new Set(zones.map(z => z.zone_id));

    // Remove stale markers
    for (const [id, m] of markers.current) {
      if (!activeIds.has(id)) {
        m.remove();
        markers.current.delete(id);
      }
    }

    // Upsert markers
    zones.forEach(zone => {
      const isSelected = zone.zone_id === selectedZoneId;
      const isRecentlyUpdated = recentlyUpdated.has(zone.zone_id);
      const icon = createZoneIcon(zone, isSelected, isRecentlyUpdated);
      const latlng: L.LatLngTuple = [zone.location.lat, zone.location.lng];

      const existing = markers.current.get(zone.zone_id);
      if (existing) {
        existing.setIcon(icon);
        existing.setLatLng(latlng);
        existing.setTooltipContent(buildTooltip(zone));
      } else {
        const m = L.marker(latlng, { icon })
          .addTo(map)
          .bindTooltip(buildTooltip(zone), {
            direction: 'top',
            offset: [0, -4],
            className: 'leaflet-tooltip-solace',
          })
          .on('click', () => onSelectRef.current(zone.zone_id));

        markers.current.set(zone.zone_id, m);
      }
    });

    // Fly to selected zone
    if (selectedZoneId) {
      const z = zones.find(z => z.zone_id === selectedZoneId);
      if (z) map.flyTo([z.location.lat, z.location.lng], 9, { duration: 0.6 });
    }
  }, [zones, selectedZoneId, recentlyUpdated]);

  const handleResetIndiaView = () => {
    if (mapInstance.current) {
      mapInstance.current.flyTo(INDIA_CENTER, INDIA_ZOOM, { duration: 0.6 });
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0E0F11]">
      <div ref={mapRef} className="w-full h-full" />

      {/* Overview controls overlay */}
      <div className="absolute top-2 right-2 z-[500] flex items-center gap-2">
        <button
          onClick={handleResetIndiaView}
          className="px-2.5 py-1 bg-[#171A1D] border border-[#2A2E33] hover:border-[#3E7CB1] text-[#E8EAED] text-xs uppercase tracking-tight font-medium select-none cursor-pointer"
        >
          Reset National View
        </button>
      </div>

      {/* Compact operational legend */}
      <div className="absolute bottom-2 left-2 z-[500] bg-[#171A1D]/90 border border-[#2A2E33] px-2.5 py-1 text-[11px] text-[#9BA1A8] flex items-center gap-3 select-none">
        <span className="font-semibold text-[#E8EAED] uppercase tracking-tight">Triage:</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#C4432E]" /> Critical</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#C97A2E]" /> High</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#B8A13A]" /> Medium</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4C7A5E]" /> Low</span>
      </div>
    </div>
  );
}

function buildTooltip(zone: Zone): string {
  const color = TIER_COLORS[zone.priority_tier] ?? '#9BA1A8';
  return `
    <div style="font-family: 'Public Sans', sans-serif;">
      <div style="font-weight: 700; color:#E8EAED;">${zone.location.name}</div>
      <div style="font-size: 11px; margin-top: 2px; color: ${color}; font-weight: 700;">
        ${zone.priority_tier.toUpperCase()} · SCORE ${zone.severity_score}
      </div>
      <div style="font-size: 11px; color:#9BA1A8; font-family: 'IBM Plex Mono', monospace; margin-top: 2px;">
        POP: ${zone.population_affected_est.toLocaleString()} · ${zone.disaster_type.toUpperCase()}
      </div>
    </div>`;
}
