import { seedZones, seedInventory, seedAllocations, seedAgencyTasks, seedAuditLog, type Zone, type InventoryItem, type Allocation, type AgencyTask, type AuditEntry } from './mockData';
import { socket } from './socket';

const USE_MOCK = true;

// In-memory data store for the mock
export const db = {
  zones: [...seedZones],
  inventory: [...seedInventory],
  allocations: [...seedAllocations],
  agencyTasks: [...seedAgencyTasks],
  auditLog: [...seedAuditLog] as AuditEntry[]
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let auditIdCounter = 100;
function addAuditEntry(entry: Omit<AuditEntry, 'id'>) {
  const full: AuditEntry = { id: `audit_${auditIdCounter++}`, ...entry };
  db.auditLog.unshift(full);
  return full;
}

export const apiClient = {
  getZones: async (): Promise<Zone[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
    return [...db.zones].sort((a, b) => b.severity_score - a.severity_score);
  },

  getZoneHistory: async (_id: string): Promise<any[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
    const zone = db.zones.find(z => z.zone_id === _id);
    return [
      { timestamp: new Date(Date.now() - 7200000).toISOString(), severity_score: (zone?.severity_score || 50) - 10, priority_tier: zone?.priority_tier, note: 'Initial report' },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), severity_score: (zone?.severity_score || 50) - 5, priority_tier: zone?.priority_tier, note: 'Updated from field team' },
      { timestamp: new Date().toISOString(), severity_score: zone?.severity_score, priority_tier: zone?.priority_tier, note: 'Current state' },
    ];
  },

  submitReport: async (report: Partial<Zone>): Promise<Zone> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(600);

    // Check if zone exists to update
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

  getInventory: async (): Promise<InventoryItem[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
    return [...db.inventory];
  },

  updateInventory: async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
    const idx = db.inventory.findIndex(i => i.id === id);
    if (idx === -1) throw new Error("Inventory item not found");

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

  getAllocations: async (): Promise<Allocation[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
    return [...db.allocations];
  },

  recalculateAllocations: async (): Promise<void> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
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

  updateAgencyTaskStatus: async (id: string, status: string): Promise<AgencyTask> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
    const idx = db.agencyTasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error("Task not found");

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

  getAuditLog: async (_filter?: string): Promise<AuditEntry[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
    return [...db.auditLog];
  },

  getAgencyTasks: async (): Promise<AgencyTask[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
    return [...db.agencyTasks];
  }
};
