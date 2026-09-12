import { type InventoryItem, type Depot, type StockTransaction } from '../types/inventory';

export interface ZoneNeed {
  type: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export interface Zone {
  zone_id: string;
  location: { lat: number; lng: number; name: string };
  disaster_type: string;
  population_affected_est: number;
  casualties: number;
  needs: ZoneNeed[];
  severity_score: number;
  priority_tier: 'Critical' | 'High' | 'Medium' | 'Low';
  source_confidence: number;
  source_refs: string[];
  deterioration_delta: string;
}

export interface Allocation {
  allocation_id: string;
  zone_id: string;
  resource_type: string;
  quantity: number;
  source_depot: string;
  assigned_agency: string;
  reasoning: string;
  requires_human_approval: boolean;
  timestamp: string;
}

export interface AgencyTask {
  id: string;
  agency_id: string;
  allocation_id: string;
  status: 'assigned' | 'in_progress' | 'completed';
}

export const seedZones: Zone[] = [
  {
    zone_id: "zone_042",
    location: { lat: 34.0522, lng: -118.2437, name: "Ward 7, Riverside Floods" },
    disaster_type: "flood",
    population_affected_est: 4200,
    casualties: 3,
    needs: [{ type: "medical", urgency: "critical" }, { type: "shelter", urgency: "high" }],
    severity_score: 87,
    priority_tier: "Critical",
    source_confidence: 0.8,
    source_refs: ["report_id_001"],
    deterioration_delta: "+12 since last report"
  },
  {
    zone_id: "zone_043",
    location: { lat: 34.0622, lng: -118.2537, name: "District 2, Hillside Landslip" },
    disaster_type: "landslide",
    population_affected_est: 1500,
    casualties: 0,
    needs: [{ type: "food", urgency: "medium" }],
    severity_score: 45,
    priority_tier: "Medium",
    source_confidence: 0.9,
    source_refs: ["sensor_net_42"],
    deterioration_delta: "stable"
  },
  {
    zone_id: "zone_044",
    location: { lat: 34.0422, lng: -118.2637, name: "Downtown Core Structural Rupture" },
    disaster_type: "earthquake",
    population_affected_est: 12000,
    casualties: 15,
    needs: [{ type: "rescue", urgency: "critical" }, { type: "medical", urgency: "high" }],
    severity_score: 95,
    priority_tier: "Critical",
    source_confidence: 0.95,
    source_refs: ["news_url_abc"],
    deterioration_delta: "+2 since last report"
  }
];

export const seedDepots: Depot[] = [
  {
    id: "depot_central",
    code: "HUB-01",
    name: "Central Logistics Hub",
    locationName: "Downtown Metro Staging Depot",
    coordinates: { lat: 34.0522, lng: -118.2437 },
    status: "operational",
    maxCapacityUnits: 30000,
    currentCapacityUnits: 22600,
    managerName: "Capt. Mark Vance",
    contactNumber: "+1 (555) 019-2831",
    statusNotes: "Full air and ground access active. Primary supply distribution point."
  },
  {
    id: "depot_west",
    code: "STG-02",
    name: "West Coastal Staging Base",
    locationName: "Santa Monica Marine Base",
    coordinates: { lat: 34.0195, lng: -118.4912 },
    status: "operational",
    maxCapacityUnits: 15000,
    currentCapacityUnits: 6850,
    managerName: "Elena Rostova",
    contactNumber: "+1 (555) 019-8822",
    statusNotes: "Marine launchpad operational. Handling coastal flood evacuation units."
  },
  {
    id: "depot_north",
    code: "STG-03",
    name: "North Mountain Shelter Depot",
    locationName: "Pasadena Foothills Complex",
    coordinates: { lat: 34.1478, lng: -118.1445 },
    status: "high_capacity",
    maxCapacityUnits: 20000,
    currentCapacityUnits: 19100,
    managerName: "David Chen",
    contactNumber: "+1 (555) 019-4411",
    statusNotes: "Near capacity (95.5%) due to massive evacuee intake from northern zone."
  },
  {
    id: "depot_south",
    code: "LOG-04",
    name: "South Harbor Emergency Base",
    locationName: "Long Beach Port Terminal 4",
    coordinates: { lat: 33.7701, lng: -118.1937 },
    status: "compromised",
    maxCapacityUnits: 25000,
    currentCapacityUnits: 8200,
    managerName: "Lt. Sarah Jenkins",
    contactNumber: "+1 (555) 019-7733",
    statusNotes: "CRITICAL: Access Highway 710 underwater. Ground freight halted; watercraft only."
  },
  {
    id: "depot_east",
    code: "AIR-05",
    name: "East Valley Airfield Staging",
    locationName: "El Monte Logistics Airfield",
    coordinates: { lat: 34.0861, lng: -118.0353 },
    status: "operational",
    maxCapacityUnits: 22000,
    currentCapacityUnits: 13900,
    managerName: "Marcus Sterling",
    contactNumber: "+1 (555) 019-5566",
    statusNotes: "Cargo helipad active. Inter-agency airlift operations ready."
  }
];

export const seedInventory: InventoryItem[] = [
  // Vehicles
  {
    id: "inv_v1",
    name: "Inflatable Rescue Boats (40HP)",
    category: "Vehicles",
    depotId: "depot_west",
    depotName: "West Coastal Staging Base",
    agency: "US Coast Guard Aux",
    availableQuantity: 3,
    inTransitQuantity: 2,
    minimumThreshold: 6,
    unit: "Boats",
    lastUpdated: "12 mins ago"
  },
  {
    id: "inv_v2",
    name: "Inflatable Rescue Boats (40HP)",
    category: "Vehicles",
    depotId: "depot_south",
    depotName: "South Harbor Emergency Base",
    agency: "State Emergency Agency",
    availableQuantity: 0,
    inTransitQuantity: 3,
    minimumThreshold: 5,
    unit: "Boats",
    lastUpdated: "5 mins ago"
  },
  {
    id: "inv_v3",
    name: "High-Clearance 4x4 Evac Trucks",
    category: "Vehicles",
    depotId: "depot_central",
    depotName: "Central Logistics Hub",
    agency: "National Guard",
    availableQuantity: 14,
    inTransitQuantity: 8,
    minimumThreshold: 10,
    unit: "Vehicles",
    lastUpdated: "35 mins ago"
  },
  {
    id: "inv_v4",
    name: "High-Clearance 4x4 Evac Trucks",
    category: "Vehicles",
    depotId: "depot_east",
    depotName: "East Valley Airfield Staging",
    agency: "FEMA",
    availableQuantity: 5,
    inTransitQuantity: 6,
    minimumThreshold: 6,
    unit: "Vehicles",
    lastUpdated: "1 hour ago"
  },
  {
    id: "inv_v5",
    name: "Emergency Evacuation Buses (40-seat)",
    category: "Vehicles",
    depotId: "depot_central",
    depotName: "Central Logistics Hub",
    agency: "Municipal Transit Authority",
    availableQuantity: 9,
    inTransitQuantity: 11,
    minimumThreshold: 8,
    unit: "Buses",
    lastUpdated: "40 mins ago"
  },

  // Medical
  {
    id: "inv_m1",
    name: "Trauma Surgical Kits (Level 1)",
    category: "Medical",
    depotId: "depot_central",
    depotName: "Central Logistics Hub",
    agency: "Red Cross",
    availableQuantity: 180,
    inTransitQuantity: 70,
    minimumThreshold: 50,
    unit: "Kits",
    lastUpdated: "20 mins ago"
  },
  {
    id: "inv_m2",
    name: "Trauma Surgical Kits (Level 1)",
    category: "Medical",
    depotId: "depot_west",
    depotName: "West Coastal Staging Base",
    agency: "Doctors Without Borders",
    availableQuantity: 35,
    inTransitQuantity: 25,
    minimumThreshold: 40,
    unit: "Kits",
    lastUpdated: "15 mins ago"
  },
  {
    id: "inv_m3",
    name: "Emergency Blood Units (O-Neg/Plasma)",
    category: "Medical",
    depotId: "depot_central",
    depotName: "Central Logistics Hub",
    agency: "Red Cross",
    availableQuantity: 8,
    inTransitQuantity: 22,
    minimumThreshold: 30,
    unit: "Units",
    lastUpdated: "8 mins ago"
  },
  {
    id: "inv_m4",
    name: "Portable Automated Defibrillators",
    category: "Medical",
    depotId: "depot_east",
    depotName: "East Valley Airfield Staging",
    agency: "Public Health Agency",
    availableQuantity: 28,
    inTransitQuantity: 12,
    minimumThreshold: 15,
    unit: "Units",
    lastUpdated: "2 hours ago"
  },

  // Food & Water
  {
    id: "inv_f1",
    name: "Ready-to-Eat Emergency Food Packs (MRE)",
    category: "Food & Water",
    depotId: "depot_central",
    depotName: "Central Logistics Hub",
    agency: "World Central Kitchen",
    availableQuantity: 12500,
    inTransitQuantity: 4200,
    minimumThreshold: 3000,
    unit: "Packs",
    lastUpdated: "18 mins ago"
  },
  {
    id: "inv_f2",
    name: "Ready-to-Eat Emergency Food Packs (MRE)",
    category: "Food & Water",
    depotId: "depot_north",
    depotName: "North Mountain Shelter Depot",
    agency: "WFP / Local Food Bank",
    availableQuantity: 7800,
    inTransitQuantity: 3200,
    minimumThreshold: 2000,
    unit: "Packs",
    lastUpdated: "45 mins ago"
  },
  {
    id: "inv_f3",
    name: "Clean Drinking Water Containers (10L)",
    category: "Food & Water",
    depotId: "depot_central",
    depotName: "Central Logistics Hub",
    agency: "UNICEF",
    availableQuantity: 9200,
    inTransitQuantity: 3500,
    minimumThreshold: 2500,
    unit: "Cans",
    lastUpdated: "25 mins ago"
  },
  {
    id: "inv_f4",
    name: "Clean Drinking Water Containers (10L)",
    category: "Food & Water",
    depotId: "depot_east",
    depotName: "East Valley Airfield Staging",
    agency: "UNICEF",
    availableQuantity: 4100,
    inTransitQuantity: 1900,
    minimumThreshold: 1500,
    unit: "Cans",
    lastUpdated: "1 hour ago"
  },
  {
    id: "inv_f5",
    name: "Industrial Water Purification Mobile Units",
    category: "Food & Water",
    depotId: "depot_west",
    depotName: "West Coastal Staging Base",
    agency: "Oxfam",
    availableQuantity: 1,
    inTransitQuantity: 3,
    minimumThreshold: 4,
    unit: "Units",
    lastUpdated: "14 mins ago"
  },

  // Shelter & Rescue
  {
    id: "inv_s1",
    name: "All-Weather Family Shelter Tents (6-person)",
    category: "Shelter & Rescue",
    depotId: "depot_central",
    depotName: "Central Logistics Hub",
    agency: "FEMA",
    availableQuantity: 420,
    inTransitQuantity: 180,
    minimumThreshold: 150,
    unit: "Tents",
    lastUpdated: "30 mins ago"
  },
  {
    id: "inv_s2",
    name: "All-Weather Family Shelter Tents (6-person)",
    category: "Shelter & Rescue",
    depotId: "depot_north",
    depotName: "North Mountain Shelter Depot",
    agency: "UNHCR",
    availableQuantity: 310,
    inTransitQuantity: 190,
    minimumThreshold: 120,
    unit: "Tents",
    lastUpdated: "55 mins ago"
  },
  {
    id: "inv_s3",
    name: "Heavy Hydraulic Rescue Extrication Sets",
    category: "Shelter & Rescue",
    depotId: "depot_east",
    depotName: "East Valley Airfield Staging",
    agency: "County Fire Dept",
    availableQuantity: 2,
    inTransitQuantity: 4,
    minimumThreshold: 4,
    unit: "Sets",
    lastUpdated: "42 mins ago"
  },
  {
    id: "inv_s4",
    name: "Thermal Fleece Emergency Blankets",
    category: "Shelter & Rescue",
    depotId: "depot_north",
    depotName: "North Mountain Shelter Depot",
    agency: "Red Cross",
    availableQuantity: 4500,
    inTransitQuantity: 1800,
    minimumThreshold: 1000,
    unit: "Blankets",
    lastUpdated: "10 mins ago"
  },

  // Personnel
  {
    id: "inv_p1",
    name: "Certified Urban Search & Rescue Squads",
    category: "Personnel",
    depotId: "depot_central",
    depotName: "Central Logistics Hub",
    agency: "Task Force 1 (USAR)",
    availableQuantity: 4,
    inTransitQuantity: 12,
    minimumThreshold: 6,
    unit: "Squads (8-man)",
    lastUpdated: "6 mins ago"
  },
  {
    id: "inv_p2",
    name: "Emergency Mobile Paramedic Units",
    category: "Personnel",
    depotId: "depot_west",
    depotName: "West Coastal Staging Base",
    agency: "State Emergency Medical Corps",
    availableQuantity: 3,
    inTransitQuantity: 7,
    minimumThreshold: 5,
    unit: "Teams (4-med)",
    lastUpdated: "22 mins ago"
  },
  {
    id: "inv_p3",
    name: "Structural Collapse Engineers",
    category: "Personnel",
    depotId: "depot_east",
    depotName: "East Valley Airfield Staging",
    agency: "Army Corps of Engineers",
    availableQuantity: 5,
    inTransitQuantity: 3,
    minimumThreshold: 3,
    unit: "Engineers",
    lastUpdated: "1 hour ago"
  }
];

export const seedTransactions: StockTransaction[] = [
  {
    id: "tx_101",
    timestamp: "10 mins ago",
    itemName: "Ready-to-Eat Emergency Food Packs (MRE)",
    category: "Food & Water",
    depotId: "depot_central",
    depotName: "Central Logistics Hub",
    quantityChanged: 2500,
    type: "intake",
    agency: "World Central Kitchen",
    reportedBy: "Sgt. O'Connor",
    notes: "Convoy arriving from Regional Distribution Center."
  },
  {
    id: "tx_102",
    timestamp: "25 mins ago",
    itemName: "Inflatable Rescue Boats (40HP)",
    category: "Vehicles",
    depotId: "depot_south",
    depotName: "South Harbor Emergency Base",
    quantityChanged: -2,
    type: "damaged",
    agency: "State Emergency Agency",
    reportedBy: "Capt. Ruiz",
    notes: "Propeller shearing damage from submerged debris during flood rescue."
  },
  {
    id: "tx_103",
    timestamp: "45 mins ago",
    itemName: "Clean Drinking Water Containers (10L)",
    category: "Food & Water",
    depotId: "depot_north",
    depotName: "North Mountain Shelter Depot",
    quantityChanged: 1000,
    type: "intake",
    agency: "UNICEF",
    reportedBy: "David Chen",
    notes: "Emergency water tanker drop."
  }
];

export const seedAllocations: Allocation[] = [];
export const seedAgencyTasks: AgencyTask[] = [];
export const seedAuditLog: any[] = [];
