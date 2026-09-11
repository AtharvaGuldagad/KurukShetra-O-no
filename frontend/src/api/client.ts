import { seedZones, seedInventory, seedAllocations, seedAgencyTasks, seedAuditLog, type Zone, type InventoryItem, type Allocation, type AgencyTask } from './mockData';
import { socket } from './socket';

const USE_MOCK = true;

// In-memory data store for the mock
let db = {
  zones: [...seedZones],
  inventory: [...seedInventory],
  allocations: [...seedAllocations],
  agencyTasks: [...seedAgencyTasks],
  auditLog: [...seedAuditLog]
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiClient = {
  getZones: async (): Promise<Zone[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
    return [...db.zones];
  },
  
  getZoneHistory: async (_id: string): Promise<any[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
    return [{ timestamp: new Date().toISOString(), status: 'history_stub' }];
  },
  
  submitReport: async (report: Partial<Zone>): Promise<Zone> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(500);
    const newZone = { 
      ...report, 
      zone_id: `zone_${Date.now()}`,
      severity_score: report.severity_score || 50,
      priority_tier: report.priority_tier || 'Medium',
      source_confidence: report.source_confidence || 0.7,
      source_refs: report.source_refs || ['field_report'],
      deterioration_delta: 'new'
    } as Zone;
    
    db.zones.push(newZone);
    db.auditLog.push({ timestamp: new Date().toISOString(), message: `New zone report submitted: ${newZone.location?.name}`});
    
    // Trigger mock WS event
    socket.emitFromServer('ZoneUpdated', newZone);
    
    return newZone;
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
    if (idx === -1) throw new Error("Not found");
    
    db.inventory[idx] = { ...db.inventory[idx], ...updates };
    
    // In our mock world, changing inventory might trigger a recalculation event a bit later
    setTimeout(() => {
      socket.emitFromServer('AllocationRecalculated', { reason: 'inventory_changed' });
    }, 1000);
    
    return db.inventory[idx];
  },
  
  getAllocations: async (): Promise<Allocation[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
    return [...db.allocations];
  },

  recalculateAllocations: async (): Promise<void> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(800);
    socket.emitFromServer('AllocationRecalculated', { reason: 'manual_trigger' });
  },

  updateAgencyTaskStatus: async (id: string, status: string): Promise<AgencyTask> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
    const idx = db.agencyTasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error("Not found");
    
    db.agencyTasks[idx].status = status as any;
    socket.emitFromServer('AgencyStatusChanged', db.agencyTasks[idx]);
    return db.agencyTasks[idx];
  },
  
  getAuditLog: async (_filter?: string): Promise<any[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
    return [...db.auditLog];
  }
};
