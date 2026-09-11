import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type Zone } from '../../api/mockData';

// Inject global CSS into <head> once — must happen before any icon is created
const STYLE_ID = 'ps20-map-styles';
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes ps20-ping {
      0%   { transform: scale(1);   opacity: 0.6; }
      100% { transform: scale(3.5); opacity: 0; }
    }
    .ps20-marker-wrap {
      background: transparent !important;
      border: none !important;
    }
    .ps20-marker-inner {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ps20-marker-dot {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      line-height: 1;
      color: #fff;
      position: relative;
      z-index: 2;
      transition: transform 0.2s ease;
    }
    .ps20-marker-pulse {
      position: absolute;
      top: -2px; left: -2px; right: -2px; bottom: -2px; /* cover parent border */
      border-radius: 50%;
      z-index: 1;
      animation: ps20-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    .leaflet-tooltip-ps20 {
      background: #1e293b;
      border: 1px solid #334155;
      color: #e2e8f0;
      border-radius: 6px;
      font-size: 12px;
      padding: 6px 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
      font-family: system-ui, sans-serif;
    }
    .leaflet-tooltip-ps20.leaflet-tooltip-top::before {
      border-top-color: #334155;
    }
    .leaflet-container {
      background: #0f172a !important;
    }
    .custom-dark-tiles {
      filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3);
    }
  `;
  document.head.appendChild(style);
}

const TIER_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High:     '#f97316',
  Medium:   '#eab308',
  Low:      '#22c55e',
};

function createZoneIcon(zone: Zone, isSelected: boolean): L.DivIcon {
  const color = TIER_COLORS[zone.priority_tier] ?? '#94a3b8';
  const baseSize = isSelected ? 22 : 16;
  const wrapSize = baseSize + 16; // room for pulse ring
  const borderPx = isSelected ? 3 : 2;
  const fontSize = baseSize <= 16 ? 8 : 10;
  const shadow = `0 0 ${isSelected ? 14 : 8}px ${color}99`;
  const pulse = zone.priority_tier === 'Critical'
    ? `<div class="ps20-marker-pulse" style="background:inherit;opacity:0.6;"></div>`
    : '';

  return L.divIcon({
    className: 'ps20-marker-wrap',
    html: `
      <div class="ps20-marker-inner" style="width:${wrapSize}px;height:${wrapSize}px;">
        <div class="ps20-marker-dot" style="
          width:${baseSize}px;
          height:${baseSize}px;
          background:${color};
          border:${borderPx}px solid ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.55)'};
          box-shadow:${shadow};
          font-size:${fontSize}px;
        ">
          ${pulse}
          <span style="position:relative;z-index:2">${zone.severity_score}</span>
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
  // Keep a stable ref to the callback to avoid re-creating markers on every render
  const onSelectRef  = useRef(onSelectZone);
  onSelectRef.current = onSelectZone;

  // --- Init map once ---
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [34.052, -118.250],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: 'abc',
        maxZoom: 19,
        className: 'custom-dark-tiles',
      }
    ).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      markers.current.clear();
    };
  }, []);

  // --- Sync markers ---
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
      const icon = createZoneIcon(zone, isSelected);
      const latlng: L.LatLngTuple = [zone.location.lat, zone.location.lng];

      const existing = markers.current.get(zone.zone_id);
      if (existing) {
        existing.setIcon(icon);
        existing.setLatLng(latlng);
        // Refresh tooltip content (score / tier may have changed)
        existing.setTooltipContent(buildTooltip(zone));
      } else {
        const m = L.marker(latlng, { icon })
          .addTo(map)
          .bindTooltip(buildTooltip(zone), {
            direction: 'top',
            offset: [0, -4],
            className: 'leaflet-tooltip-ps20',
          })
          .on('click', () => onSelectRef.current(zone.zone_id));

        markers.current.set(zone.zone_id, m);
      }
    });

    // Fly to selected zone
    if (selectedZoneId) {
      const z = zones.find(z => z.zone_id === selectedZoneId);
      if (z) map.flyTo([z.location.lat, z.location.lng], 14, { duration: 0.7 });
    }
  }, [zones, selectedZoneId, recentlyUpdated]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {recentlyUpdated.size > 0 && (
        <div className="absolute top-3 left-3 z-[1000] pointer-events-none
          bg-blue-900/70 border border-blue-400 rounded-lg px-3 py-1.5
          text-xs text-blue-200 font-medium flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Live update received
        </div>
      )}
    </div>
  );
}

function buildTooltip(zone: Zone): string {
  const color = TIER_COLORS[zone.priority_tier] ?? '#94a3b8';
  return `
    <div>
      <strong style="color:#f1f5f9">${zone.location.name}</strong><br>
      <span style="color:${color};font-weight:600">${zone.priority_tier}</span>
      &nbsp;·&nbsp;Score: <strong>${zone.severity_score}</strong><br>
      <span style="color:#94a3b8">${zone.disaster_type} · ${zone.population_affected_est.toLocaleString()} affected</span>
    </div>`;
}
