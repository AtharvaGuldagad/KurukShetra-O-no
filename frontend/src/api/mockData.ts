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
  baseline_quantity: number;
  depot: string;
  agency: string;
}

export interface AgencyTask {
  id: string;
  agency_id: string;
  agency_name: string;
  zone_id: string;
  zone_name: string;
  allocation_id: string;
  task_type: string;
  status: 'assigned' | 'in_progress' | 'completed';
  capacity: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  event_type: 'zone_updated' | 'allocation_recalculated' | 'report_submitted' | 'agency_status_changed' | 'duplicate_flagged' | 'inventory_updated';
  actor: string;
  zone_id?: string;
  summary: string;
  raw_payload?: any;
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
    source_confidence: 0.80,
    source_refs: ["report_id_001", "https://news.example.com/flood-ward7"],
    deterioration_delta: "+12 since last report"
  },
  {
    zone_id: "zone_044",
    location: { lat: 34.0300, lng: -118.2800, name: "Downtown Core" },
    disaster_type: "earthquake",
    population_affected_est: 12000,
    casualties: 15,
    needs: [{ type: "rescue", urgency: "critical" }, { type: "medical", urgency: "high" }, { type: "food", urgency: "medium" }],
    severity_score: 95,
    priority_tier: "Critical",
    source_confidence: 0.95,
    source_refs: ["sensor_grid_7", "https://news.example.com/quake-downtown"],
    deterioration_delta: "+2 since last report"
  },
  {
    zone_id: "zone_043",
    location: { lat: 34.0722, lng: -118.2137, name: "District 2, Hillside" },
    disaster_type: "landslide",
    population_affected_est: 1500,
    casualties: 0,
    needs: [{ type: "food", urgency: "medium" }, { type: "shelter", urgency: "low" }],
    severity_score: 45,
    priority_tier: "Medium",
    source_confidence: 0.90,
    source_refs: ["sensor_net_42"],
    deterioration_delta: "stable"
  },
  {
    zone_id: "zone_045",
    location: { lat: 34.0850, lng: -118.3100, name: "Northgate Industrial" },
    disaster_type: "fire",
    population_affected_est: 800,
    casualties: 1,
    needs: [{ type: "evacuation", urgency: "high" }, { type: "medical", urgency: "medium" }],
    severity_score: 71,
    priority_tier: "High",
    source_confidence: 0.75,
    source_refs: ["field_report_009"],
    deterioration_delta: "+5 since last report"
  },
  {
    zone_id: "zone_046",
    location: { lat: 34.0150, lng: -118.1950, name: "Eastside Harbor" },
    disaster_type: "flood",
    population_affected_est: 3100,
    casualties: 0,
    needs: [{ type: "shelter", urgency: "medium" }],
    severity_score: 38,
    priority_tier: "Low",
    source_confidence: 0.65,
    source_refs: ["community_report_003"],
    deterioration_delta: "stable"
  }
];

export const seedInventory: InventoryItem[] = [
  { id: "inv_1", resource_type: "medical_kits", quantity: 500, baseline_quantity: 1000, depot: "depot_1", agency: "Red Cross" },
  { id: "inv_2", resource_type: "shelter_tents", quantity: 200, baseline_quantity: 400, depot: "depot_2", agency: "FEMA" },
  { id: "inv_3", resource_type: "food_rations", quantity: 10000, baseline_quantity: 15000, depot: "depot_1", agency: "World Central Kitchen" },
  { id: "inv_4", resource_type: "rescue_equipment", quantity: 45, baseline_quantity: 100, depot: "depot_3", agency: "Fire Dept Unit 2" },
  { id: "inv_5", resource_type: "water_purifiers", quantity: 80, baseline_quantity: 150, depot: "depot_2", agency: "FEMA" },
];

export const seedAllocations: Allocation[] = [
  {
    allocation_id: "alloc_001",
    zone_id: "zone_044",
    resource_type: "rescue_equipment",
    quantity: 20,
    source_depot: "depot_3",
    assigned_agency: "Fire Dept Unit 2",
    reasoning: "Critical tier, active earthquake rescue needed, highest casualty count.",
    requires_human_approval: false,
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    allocation_id: "alloc_002",
    zone_id: "zone_042",
    resource_type: "medical_kits",
    quantity: 150,
    source_depot: "depot_1",
    assigned_agency: "Red Cross Unit 4",
    reasoning: "Critical tier, unmet medical need, deteriorating access.",
    requires_human_approval: false,
    timestamp: new Date(Date.now() - 1800000).toISOString()
  },
  {
    allocation_id: "alloc_003",
    zone_id: "zone_045",
    resource_type: "shelter_tents",
    quantity: 50,
    source_depot: "depot_2",
    assigned_agency: "FEMA Response Team",
    reasoning: "High tier fire evacuation — shelter deployment requires coordinator sign-off due to active fire perimeter.",
    requires_human_approval: true,
    timestamp: new Date(Date.now() - 900000).toISOString()
  }
];

export const seedAgencyTasks: AgencyTask[] = [
  {
    id: "task_001",
    agency_id: "agency_fire_2",
    agency_name: "Fire Dept Unit 2",
    zone_id: "zone_044",
    zone_name: "Downtown Core",
    allocation_id: "alloc_001",
    task_type: "rescue",
    status: "in_progress",
    capacity: 30
  },
  {
    id: "task_002",
    agency_id: "agency_redcross_4",
    agency_name: "Red Cross Unit 4",
    zone_id: "zone_042",
    zone_name: "Ward 7, Riverside",
    allocation_id: "alloc_002",
    task_type: "medical",
    status: "assigned",
    capacity: 20
  },
  {
    id: "task_003",
    agency_id: "agency_fema",
    agency_name: "FEMA Response Team",
    zone_id: "zone_045",
    zone_name: "Northgate Industrial",
    allocation_id: "alloc_003",
    task_type: "evacuation",
    status: "assigned",
    capacity: 50
  }
];

export const seedAuditLog: AuditEntry[] = [
  {
    id: "audit_001",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    event_type: "zone_updated",
    actor: "Agent A",
    zone_id: "zone_044",
    summary: "Zone Downtown Core severity increased to Critical (95) — earthquake casualties reported at 15.",
    raw_payload: { zone_id: "zone_044", severity_score: 95, priority_tier: "Critical" }
  },
  {
    id: "audit_002",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    event_type: "allocation_recalculated",
    actor: "Agent B",
    zone_id: "zone_044",
    summary: "Allocation recalculated — 20 rescue kits assigned to Downtown Core (Fire Dept Unit 2).",
    raw_payload: { allocation_id: "alloc_001" }
  },
  {
    id: "audit_003",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    event_type: "allocation_recalculated",
    actor: "Agent B",
    zone_id: "zone_042",
    summary: "150 medical kits allocated to Ward 7, Riverside (Red Cross Unit 4) — critical need, deteriorating.",
    raw_payload: { allocation_id: "alloc_002" }
  }
];
