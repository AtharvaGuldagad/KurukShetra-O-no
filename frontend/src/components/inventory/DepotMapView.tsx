import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { type Depot, type InventoryItem } from '../../types/inventory';
import { Phone, User, ArrowRight, PlusCircle } from 'lucide-react';

interface DepotMapViewProps {
  depots: Depot[];
  inventory: InventoryItem[];
  onSelectDepot?: (depotId: string) => void;
  onOpenIntakeModal?: (depotId: string) => void;
}

// Function to generate tactical custom divIcon with status-based colors & pulse
const createDepotMarkerIcon = (status: Depot['status'], code: string) => {
  let bgColor = 'bg-emerald-500';
  let ringColor = 'border-emerald-300';
  let pulseClass = '';

  if (status === 'compromised') {
    bgColor = 'bg-red-500';
    ringColor = 'border-red-300';
    pulseClass = 'animate-ping';
  } else if (status === 'high_capacity') {
    bgColor = 'bg-amber-500';
    ringColor = 'border-amber-300';
  }

  return L.divIcon({
    className: 'custom-depot-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        ${
          status === 'compromised'
            ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: rgba(239,68,68,0.5);" class="${pulseClass}"></div>`
            : ''
        }
        <div style="position: relative; width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-family: monospace; font-size: 11px; box-shadow: 0 4px 10px rgba(0,0,0,0.6);" class="${bgColor} border-2 ${ringColor}">
          ${code.slice(-2)}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

export const DepotMapView: React.FC<DepotMapViewProps> = ({
  depots,
  inventory,
  onSelectDepot,
  onOpenIntakeModal,
}) => {
  // Center roughly around Los Angeles area where our seed depots are located
  const defaultCenter: [number, number] = [34.05, -118.25];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl mb-6">
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <span>Disaster Response Staging Map</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              ({depots.length} Monitored Geo-Depots)
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-time staging facilities, live capacity load, and compromised zone status
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Operational</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-300">High Capacity (&gt;85%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-400 font-semibold">Compromised</span>
          </div>
        </div>
      </div>

      {/* Leaflet Map Box */}
      <div className="h-[440px] w-full relative">
        <MapContainer
          center={defaultCenter}
          zoom={10}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {depots.map((depot) => {
            const depotInventory = inventory.filter((item) => item.depotId === depot.id);
            const capacityPercent = Math.min(
              100,
              Math.round((depot.currentCapacityUnits / depot.maxCapacityUnits) * 100)
            );

            return (
              <Marker
                key={depot.id}
                position={[depot.coordinates.lat, depot.coordinates.lng]}
                icon={createDepotMarkerIcon(depot.status, depot.code)}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-2 text-slate-900 min-w-[260px] max-w-[320px]">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b pb-2 mb-2">
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                          <span>{depot.name}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-mono">
                            {depot.code}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">{depot.locationName}</div>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          depot.status === 'operational'
                            ? 'bg-emerald-100 text-emerald-800'
                            : depot.status === 'compromised'
                            ? 'bg-red-100 text-red-800 animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {depot.status}
                      </span>
                    </div>

                    {/* Status Alert Note if compromised */}
                    {depot.statusNotes && (
                      <div
                        className={`text-xs p-2 rounded mb-2 font-medium ${
                          depot.status === 'compromised'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        {depot.statusNotes}
                      </div>
                    )}

                    {/* Capacity Indicator */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Staging Utilization:</span>
                        <span className="font-bold font-mono">
                          {capacityPercent}% ({depot.currentCapacityUnits.toLocaleString()} /{' '}
                          {depot.maxCapacityUnits.toLocaleString()})
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            capacityPercent > 85
                              ? 'bg-red-500'
                              : capacityPercent > 65
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Inventory Items list preview */}
                    <div className="border-t pt-2 mt-2">
                      <div className="text-xs font-bold text-slate-700 mb-1">
                        Stored Stock ({depotInventory.length} types):
                      </div>
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-xs">
                        {depotInventory.slice(0, 4).map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center text-[11px] bg-slate-100 p-1 rounded"
                          >
                            <span className="truncate pr-1">{item.name}</span>
                            <span className="font-mono font-bold text-slate-800 shrink-0">
                              {item.availableQuantity} {item.unit}
                            </span>
                          </div>
                        ))}
                        {depotInventory.length > 4 && (
                          <div className="text-[10px] text-slate-500 text-center italic">
                            +{depotInventory.length - 4} more resource types
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Depot Contacts */}
                    <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t pt-2">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{depot.managerName}</span>
                      </span>
                      <span className="flex items-center space-x-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{depot.contactNumber}</span>
                      </span>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center space-x-2 mt-2">
                      {onOpenIntakeModal && (
                        <button
                          onClick={() => onOpenIntakeModal(depot.id)}
                          className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded text-xs font-semibold flex items-center justify-center space-x-1"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>+ Intake</span>
                        </button>
                      )}
                      {onSelectDepot && (
                        <button
                          onClick={() => onSelectDepot(depot.id)}
                          className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
