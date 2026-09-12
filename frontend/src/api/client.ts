import { 
  seedZones, 
  seedInventory, 
  seedAllocations, 
  seedAgencyTasks, 
  seedAuditLog, 
  seedDepots, 
  seedTransactions,
  type Zone, 
  type Allocation, 
  type AgencyTask 
} from './mockData';
import { type InventoryItem, type Depot, type StockTransaction, type DepotStatus, type ResourceCategory } from '../types/inventory';
import { socket } from './socket';

const USE_MOCK = true;

// In-memory data store for the mock
let db = {
  zones: [...seedZones],
  depots: [...seedDepots],
  inventory: [...seedInventory],
  allocations: [...seedAllocations],
  agencyTasks: [...seedAgencyTasks],
  auditLog: [...seedAuditLog],
  transactions: [...seedTransactions]
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiClient = {
  getZones: async (): Promise<Zone[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(200);
    return [...db.zones];
  },
  
  getZoneHistory: async (_id: string): Promise<any[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(200);
    return [{ timestamp: new Date().toISOString(), status: 'history_stub' }];
  },
  
  submitReport: async (report: Partial<Zone>): Promise<Zone> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);
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
    
    socket.emitFromServer('ZoneUpdated', newZone);
    return newZone;
  },

  // Depot Operations
  getDepots: async (): Promise<Depot[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(200);
    return [...db.depots];
  },

  updateDepotStatus: async (depotId: string, status: DepotStatus, notes?: string): Promise<Depot> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(250);
    const idx = db.depots.findIndex(d => d.id === depotId);
    if (idx === -1) throw new Error("Depot not found");

    db.depots[idx] = {
      ...db.depots[idx],
      status,
      statusNotes: notes ?? db.depots[idx].statusNotes
    };

    socket.emitFromServer('DepotStatusChanged', db.depots[idx]);
    // Status change might compromise inventory routing
    socket.emitFromServer('AllocationRecalculated', { reason: `Depot ${db.depots[idx].name} status changed to ${status}` });

    return db.depots[idx];
  },

  // Inventory Operations
  getInventory: async (): Promise<InventoryItem[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(200);
    return [...db.inventory];
  },

  addInventoryIntake: async (data: {
    name: string;
    category: ResourceCategory;
    depotId: string;
    agency: string;
    quantity: number;
    unit: string;
    reportedBy: string;
    notes?: string;
  }): Promise<InventoryItem> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(350);

    const depot = db.depots.find(d => d.id === data.depotId);
    if (!depot) throw new Error("Depot not found");

    const existingIndex = db.inventory.findIndex(
      item => item.name.toLowerCase() === data.name.toLowerCase() && item.depotId === data.depotId
    );

    let updatedItem: InventoryItem;

    if (existingIndex >= 0) {
      db.inventory[existingIndex] = {
        ...db.inventory[existingIndex],
        availableQuantity: db.inventory[existingIndex].availableQuantity + data.quantity,
        agency: data.agency || db.inventory[existingIndex].agency,
        lastUpdated: 'Just now'
      };
      updatedItem = db.inventory[existingIndex];
    } else {
      updatedItem = {
        id: `inv_${Date.now()}`,
        name: data.name,
        category: data.category,
        depotId: data.depotId,
        depotName: depot.name,
        agency: data.agency,
        availableQuantity: data.quantity,
        inTransitQuantity: 0,
        minimumThreshold: Math.max(5, Math.floor(data.quantity * 0.2)),
        unit: data.unit || 'Units',
        lastUpdated: 'Just now'
      };
      db.inventory.push(updatedItem);
    }

    // Update depot capacity used
    const dIdx = db.depots.findIndex(d => d.id === data.depotId);
    if (dIdx >= 0) {
      db.depots[dIdx].currentCapacityUnits += data.quantity;
    }

    // Log transaction
    const tx: StockTransaction = {
      id: `tx_${Date.now()}`,
      timestamp: 'Just now',
      itemId: updatedItem.id,
      itemName: updatedItem.name,
      category: updatedItem.category,
      depotId: depot.id,
      depotName: depot.name,
      quantityChanged: data.quantity,
      type: 'intake',
      agency: data.agency,
      reportedBy: data.reportedBy || 'Depot Manager',
      notes: data.notes || `Incoming shipment of ${data.quantity} ${data.unit}`
    };
    db.transactions.unshift(tx);

    socket.emitFromServer('InventoryUpdated', updatedItem);
    socket.emitFromServer('AllocationRecalculated', { reason: 'new_stock_intake', item: updatedItem.name });

    return updatedItem;
  },

  adjustInventoryStock: async (data: {
    itemId: string;
    quantity: number; // positive number to deduct
    type: 'damaged' | 'lost' | 'expired';
    reportedBy: string;
    notes?: string;
  }): Promise<InventoryItem> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(300);

    const idx = db.inventory.findIndex(i => i.id === data.itemId);
    if (idx === -1) throw new Error("Inventory item not found");

    const currentItem = db.inventory[idx];
    const deduction = Math.min(currentItem.availableQuantity, data.quantity);
    
    db.inventory[idx] = {
      ...currentItem,
      availableQuantity: Math.max(0, currentItem.availableQuantity - deduction),
      lastUpdated: 'Just now'
    };

    // Update depot capacity
    const dIdx = db.depots.findIndex(d => d.id === currentItem.depotId);
    if (dIdx >= 0) {
      db.depots[dIdx].currentCapacityUnits = Math.max(0, db.depots[dIdx].currentCapacityUnits - deduction);
    }

    // Log transaction
    const tx: StockTransaction = {
      id: `tx_${Date.now()}`,
      timestamp: 'Just now',
      itemId: currentItem.id,
      itemName: currentItem.name,
      category: currentItem.category,
      depotId: currentItem.depotId,
      depotName: currentItem.depotName,
      quantityChanged: -deduction,
      type: data.type,
      agency: currentItem.agency,
      reportedBy: data.reportedBy || 'Field Officer',
      notes: data.notes || `Marked ${deduction} ${currentItem.unit} as ${data.type}`
    };
    db.transactions.unshift(tx);

    socket.emitFromServer('InventoryUpdated', db.inventory[idx]);
    socket.emitFromServer('AllocationRecalculated', { reason: `stock_adjusted_${data.type}`, item: currentItem.name });

    return db.inventory[idx];
  },

  getTransactions: async (): Promise<StockTransaction[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(150);
    return [...db.transactions];
  },

  getAllocations: async (): Promise<Allocation[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(200);
    return [...db.allocations];
  },

  recalculateAllocations: async (): Promise<void> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(500);
    socket.emitFromServer('AllocationRecalculated', { reason: 'manual_trigger' });
  },

  updateAgencyTaskStatus: async (id: string, status: string): Promise<AgencyTask> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(200);
    const idx = db.agencyTasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error("Not found");
    
    db.agencyTasks[idx].status = status as any;
    socket.emitFromServer('AgencyStatusChanged', db.agencyTasks[idx]);
    return db.agencyTasks[idx];
  },
  
  getAuditLog: async (_filter?: string): Promise<any[]> => {
    if (!USE_MOCK) throw new Error("Real API not implemented");
    await delay(200);
    return [...db.auditLog];
  }
};
