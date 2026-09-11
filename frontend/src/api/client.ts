import { seedZones, seedInventory, seedAllocations, seedAgencyTasks, seedAuditLog, type Zone, type InventoryItem, type Allocation, type AgencyTask, type AuditEntry } from './mockData';
import { socket } from './socket';

// ─── Feature Flag ────────────────────────────────────────────────────────────
// Toggle this to false to swap to the real REST/WS backend.
// The base URL can also be set via VITE_API_BASE_URL env var.
const USE_MOCK = true;
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// ─── Real-backend helper ──────────────────────────────────────────────────────
async function fetchApi<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Mock in-memory DB ────────────────────────────────────────────────────────
export const db = {
  zones: [...seedZones],
  inventory: [...seedInventory],
  allocations: [...seedAllocations],
  agencyTasks: [...seedAgencyTasks],
  auditLog: [...seedAuditLog] as AuditEntry[]
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let auditIdCounter = 100;
export function addAuditEntry(entry: Omit<AuditEntry, 'id'>) {
  const full: AuditEntry = { id: `audit_${auditIdCounter++}`, ...entry };
  db.auditLog.unshift(full);
  return full;
}

export interface AuditFilter {
  event_type?: string;
  actor?: string;
  search?: string;
}

// ─── API Client ───────────────────────────────────────────────────────────────
export const apiClient = {
  // GET /api/zones
  getZones: async (): Promise<Zone[]> => {
    if (!USE_MOCK) return fetchApi<Zone[]>('/api/zones');
    await delay(300);
    return [...db.zones].sort((a, b) => b.severity_score - a.severity_score);
  },

  // GET /api/zones/:id/history
  getZoneHistory: async (id: string): Promise<any[]> => {
    if (!USE_MOCK) return fetchApi<any[]>(`/api/zones/${id}/history`);
    await delay(300);
    const zone = db.zones.find(z => z.zone_id === id);
    return [
      { timestamp: new Date(Date.now() - 7200000).toISOString(), severity_score: (zone?.severity_score || 50) - 10, priority_tier: zone?.priority_tier, note: 'Initial report' },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), severity_score: (zone?.severity_score || 50) - 5, priority_tier: zone?.priority_tier, note: 'Updated from field team' },
      { timestamp: new Date().toISOString(), severity_score: zone?.severity_score, priority_tier: zone?.priority_tier, note: 'Current state' },
    ];
  },

  // POST /api/zones/report
  submitReport: async (report: Partial<Zone>): Promise<Zone> => {
    if (!USE_MOCK) return fetchApi<Zone>('/api/zones/report', { method: 'POST', body: JSON.stringify(report) });
    await delay(600);

    const existingIdx = db.zones.findIndex(z => z.zone_id === report.zone_id);
    let zone: Zone;

    if (existingIdx >= 0) {
      db.zones[existingIdx] = { ...db.zones[existingIdx], ...report } as Zone;
      zone = db.zones[existingIdx];
    } else {
      zone = {
        zone_id: `zone_${Date.now()}`,
        severity_score: 50,
        priority_tier: 'Medium',
        source_confidence: 0.7,
        source_refs: ['field_report'],
        deterioration_delta: 'new',
        ...report
      } as Zone;
      db.zones.push(zone);
    }

    addAuditEntry({
      timestamp: new Date().toISOString(),
      event_type: 'report_submitted',
      actor: 'Field Reporter',
      zone_id: zone.zone_id,
      summary: `New zone report submitted: ${zone.location?.name} (severity: ${zone.severity_score})`,
      raw_payload: zone
    });

    socket.emitFromServer('ZoneUpdated', zone);
    return zone;
  },

  // GET /api/inventory
  getInventory: async (): Promise<InventoryItem[]> => {
    if (!USE_MOCK) return fetchApi<InventoryItem[]>('/api/inventory');
    await delay(300);
    return [...db.inventory];
  },

  // PATCH /api/inventory/:id
  updateInventory: async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
    if (!USE_MOCK) return fetchApi<InventoryItem>(`/api/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    await delay(300);
    const idx = db.inventory.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Inventory item not found');

    db.inventory[idx] = { ...db.inventory[idx], ...updates };

    addAuditEntry({
      timestamp: new Date().toISOString(),
      event_type: 'inventory_updated',
      actor: 'Coordinator',
      summary: `Inventory updated: ${db.inventory[idx].resource_type} at ${db.inventory[idx].depot} → ${db.inventory[idx].quantity} units`,
      raw_payload: db.inventory[idx]
    });

    // Simulate agent recalculating allocations after inventory change
    setTimeout(() => {
      addAuditEntry({
        timestamp: new Date().toISOString(),
        event_type: 'allocation_recalculated',
        actor: 'Agent B',
        summary: 'Allocations recalculated following inventory update.',
        raw_payload: { reason: 'inventory_changed' }
      });
      socket.emitFromServer('AllocationRecalculated', { reason: 'inventory_changed' });
    }, 1500);

    return db.inventory[idx];
  },

  // GET /api/allocations
  getAllocations: async (): Promise<Allocation[]> => {
    if (!USE_MOCK) return fetchApi<Allocation[]>('/api/allocations');
    await delay(300);
    return [...db.allocations];
  },

  // POST /api/allocations/recalculate
  recalculateAllocations: async (): Promise<void> => {
    if (!USE_MOCK) { await fetchApi<void>('/api/allocations/recalculate', { method: 'POST' }); return; }
    await delay(1000);

    addAuditEntry({
      timestamp: new Date().toISOString(),
      event_type: 'allocation_recalculated',
      actor: 'Coordinator (Manual)',
      summary: 'Manual reallocation triggered — Agent B recalculating priorities.',
      raw_payload: { reason: 'manual_trigger' }
    });

    socket.emitFromServer('AllocationRecalculated', { reason: 'manual_trigger' });
  },

  // POST /api/agency-tasks/:id/status
  updateAgencyTaskStatus: async (id: string, status: string): Promise<AgencyTask> => {
    if (!USE_MOCK) return fetchApi<AgencyTask>(`/api/agency-tasks/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
    await delay(300);
    const idx = db.agencyTasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Task not found');

    const prev = db.agencyTasks[idx].status;
    db.agencyTasks[idx].status = status as AgencyTask['status'];

    addAuditEntry({
      timestamp: new Date().toISOString(),
      event_type: 'agency_status_changed',
      actor: db.agencyTasks[idx].agency_name,
      zone_id: db.agencyTasks[idx].zone_id,
      summary: `${db.agencyTasks[idx].agency_name} task status changed: ${prev} → ${status} (zone: ${db.agencyTasks[idx].zone_name})`,
      raw_payload: db.agencyTasks[idx]
    });

    socket.emitFromServer('AgencyStatusChanged', db.agencyTasks[idx]);
    return db.agencyTasks[idx];
  },

  // GET /api/audit-log?event_type=...&actor=...&search=...
  getAuditLog: async (filter?: AuditFilter): Promise<AuditEntry[]> => {
    if (!USE_MOCK) {
      const params = new URLSearchParams();
      if (filter?.event_type && filter.event_type !== 'all') params.set('event_type', filter.event_type);
      if (filter?.actor && filter.actor !== 'all') params.set('actor', filter.actor);
      if (filter?.search) params.set('search', filter.search);
      const qs = params.toString();
      return fetchApi<AuditEntry[]>(`/api/audit-log${qs ? `?${qs}` : ''}`);
    }
    await delay(300);
    let results = [...db.auditLog];
    if (filter) {
      if (filter.event_type && filter.event_type !== 'all') {
        results = results.filter(r => r.event_type === filter.event_type);
      }
      if (filter.actor && filter.actor !== 'all') {
        results = results.filter(r => r.actor === filter.actor);
      }
      if (filter.search) {
        const query = filter.search.toLowerCase();
        results = results.filter(r =>
          r.summary.toLowerCase().includes(query) ||
          r.zone_id?.toLowerCase().includes(query)
        );
      }
    }
    return results;
  },

  // GET /api/agency-tasks
  getAgencyTasks: async (): Promise<AgencyTask[]> => {
    if (!USE_MOCK) return fetchApi<AgencyTask[]>('/api/agency-tasks');
    await delay(300);
    return [...db.agencyTasks];
  }
};
