export type ResourceCategory = 
  | 'Vehicles' 
  | 'Medical' 
  | 'Food & Water' 
  | 'Shelter & Rescue' 
  | 'Personnel';

export type DepotStatus = 'operational' | 'compromised' | 'high_capacity';

export interface InventoryItem {
  id: string;
  name: string;
  category: ResourceCategory;
  depotId: string;
  depotName: string;
  agency: string;
  availableQuantity: number;
  inTransitQuantity: number;
  minimumThreshold: number;
  unit: string;
  lastUpdated: string;
}

export interface Depot {
  id: string;
  code: string;
  name: string;
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: DepotStatus;
  maxCapacityUnits: number;
  currentCapacityUnits: number;
  managerName: string;
  contactNumber: string;
  statusNotes?: string;
}

export type TransactionType = 'intake' | 'damaged' | 'lost' | 'expired';

export interface StockTransaction {
  id: string;
  timestamp: string;
  itemId?: string;
  itemName: string;
  category: ResourceCategory;
  depotId: string;
  depotName: string;
  quantityChanged: number;
  type: TransactionType;
  agency: string;
  reportedBy: string;
  notes?: string;
}

export interface LowStockAlert {
  id: string;
  itemId: string;
  itemName: string;
  category: ResourceCategory;
  depotName: string;
  available: number;
  minimumThreshold: number;
  severity: 'critical' | 'warning';
  message: string;
}
