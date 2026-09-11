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

export interface InventoryItem {
  id: string;
  resource_type: string;
  quantity: number;
  depot: string;
  agency: string;
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
    location: { lat: 34.0522, lng: -118.2437, name: "Ward 7, Riverside" },
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
    location: { lat: 34.0622, lng: -118.2537, name: "District 2, Hillside" },
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
    location: { lat: 34.0422, lng: -118.2637, name: "Downtown Core" },
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

export const seedInventory: InventoryItem[] = [
  { id: "inv_1", resource_type: "medical_kits", quantity: 500, depot: "depot_1", agency: "Red Cross" },
  { id: "inv_2", resource_type: "shelter_tents", quantity: 200, depot: "depot_2", agency: "FEMA" },
  { id: "inv_3", resource_type: "food_rations", quantity: 10000, depot: "depot_1", agency: "World Central Kitchen" },
];

export const seedAllocations: Allocation[] = [];
export const seedAgencyTasks: AgencyTask[] = [];
export const seedAuditLog: any[] = [];
