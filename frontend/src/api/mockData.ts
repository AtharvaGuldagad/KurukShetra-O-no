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
    location: { lat: 11.5540, lng: 76.1265, name: "Wayanad Sector 4, Meppadi (Kerala)" },
    disaster_type: "landslide",
    population_affected_est: 4800,
    casualties: 12,
    needs: [{ type: "rescue", urgency: "critical" }, { type: "medical", urgency: "critical" }, { type: "shelter", urgency: "high" }],
    severity_score: 92,
    priority_tier: "Critical",
    source_confidence: 0.94,
    source_refs: ["IMD_radar_kerala", "NDRF_battalion_dispatch_04"],
    deterioration_delta: "+8 since morning assessment"
  },
  {
    zone_id: "zone_044",
    location: { lat: 26.1820, lng: 91.7500, name: "Guwahati Brahmaputra Bank (Assam)" },
    disaster_type: "flood",
    population_affected_est: 19500,
    casualties: 5,
    needs: [{ type: "food", urgency: "critical" }, { type: "water", urgency: "critical" }, { type: "rescue", urgency: "high" }],
    severity_score: 88,
    priority_tier: "Critical",
    source_confidence: 0.91,
    source_refs: ["CWC_water_gauge_brahmaputra", "Assam_SDMA_bulletin"],
    deterioration_delta: "+15cm water level surge"
  },
  {
    zone_id: "zone_043",
    location: { lat: 19.8135, lng: 85.8312, name: "Puri Coastal Sector (Odisha)" },
    disaster_type: "hurricane",
    population_affected_est: 14000,
    casualties: 1,
    needs: [{ type: "shelter", urgency: "high" }, { type: "food", urgency: "medium" }],
    severity_score: 68,
    priority_tier: "High",
    source_confidence: 0.89,
    source_refs: ["Odisha_OSDMA_cyclone_alert", "coastal_station_puri"],
    deterioration_delta: "stable perimeter"
  },
  {
    zone_id: "zone_045",
    location: { lat: 30.5574, lng: 79.5658, name: "Joshimath Slope, Chamoli (Uttarakhand)" },
    disaster_type: "landslide",
    population_affected_est: 3200,
    casualties: 0,
    needs: [{ type: "shelter", urgency: "high" }, { type: "medical", urgency: "medium" }],
    severity_score: 72,
    priority_tier: "High",
    source_confidence: 0.85,
    source_refs: ["GSI_subsidence_sensor_grid", "Chamoli_dist_admin"],
    deterioration_delta: "+3mm displacement"
  },
  {
    zone_id: "zone_046",
    location: { lat: 9.9312, lng: 76.2673, name: "Kochi Backwaters, Ernakulam (Kerala)" },
    disaster_type: "flood",
    population_affected_est: 6200,
    casualties: 0,
    needs: [{ type: "water", urgency: "medium" }, { type: "medical", urgency: "low" }],
    severity_score: 44,
    priority_tier: "Medium",
    source_confidence: 0.82,
    source_refs: ["Kochi_municipal_sluice_report"],
    deterioration_delta: "stable"
  },
  {
    zone_id: "zone_047",
    location: { lat: 19.0650, lng: 72.8720, name: "Mumbai Mithi River Basin (Maharashtra)" },
    disaster_type: "flood",
    population_affected_est: 8500,
    casualties: 0,
    needs: [{ type: "shelter", urgency: "low" }],
    severity_score: 34,
    priority_tier: "Low",
    source_confidence: 0.78,
    source_refs: ["BMC_disaster_cell_mumbai"],
    deterioration_delta: "receding water level"
  }
];

export const seedInventory: InventoryItem[] = [
  { id: "inv_1", resource_type: "Trauma Surgical Kits", quantity: 650, baseline_quantity: 1200, depot: "Nagpur Central Depot", agency: "Indian Red Cross Society" },
  { id: "inv_2", resource_type: "Inflatable Rescue Boats (Gemini)", quantity: 42, baseline_quantity: 80, depot: "Arakkonam NDRF Base", agency: "NDRF 4th Battalion" },
  { id: "inv_3", resource_type: "High-Capacity Water Purifiers", quantity: 95, baseline_quantity: 200, depot: "Pune Western Depot", agency: "SDRF Disaster Strike Force" },
  { id: "inv_4", resource_type: "Emergency Food Packets", quantity: 18000, baseline_quantity: 25000, depot: "Kolkata Eastern Depot", agency: "Aapda Mitra Relief Corps" },
  { id: "inv_5", resource_type: "Heavy Debris Cutters & Extrication Kits", quantity: 28, baseline_quantity: 60, depot: "Arakkonam NDRF Base", agency: "NDRF 4th Battalion" },
];

export const seedAllocations: Allocation[] = [
  {
    allocation_id: "alloc_001",
    zone_id: "zone_042",
    resource_type: "Heavy Debris Cutters & Extrication Kits",
    quantity: 14,
    source_depot: "Arakkonam NDRF Base",
    assigned_agency: "NDRF 4th Battalion",
    reasoning: "Critical landslide search & rescue in Meppadi hill slope. High trapped civilian count.",
    requires_human_approval: false,
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    allocation_id: "alloc_002",
    zone_id: "zone_044",
    resource_type: "Inflatable Rescue Boats (Gemini)",
    quantity: 24,
    source_depot: "Kolkata Eastern Depot",
    assigned_agency: "SDRF Disaster Strike Force",
    reasoning: "Brahmaputra embankment breach in Guwahati. Island settlement evacuation underway.",
    requires_human_approval: false,
    timestamp: new Date(Date.now() - 2400000).toISOString()
  },
  {
    allocation_id: "alloc_003",
    zone_id: "zone_042",
    resource_type: "Trauma Surgical Kits",
    quantity: 200,
    source_depot: "Nagpur Central Depot",
    assigned_agency: "Indian Red Cross Society",
    reasoning: "Urgent surgical care for landslide crush victims at Meppadi triage point.",
    requires_human_approval: true,
    timestamp: new Date(Date.now() - 1200000).toISOString()
  }
];

export const seedAgencyTasks: AgencyTask[] = [
  {
    id: "task_001",
    agency_id: "agency_ndrf_4",
    agency_name: "NDRF 4th Battalion",
    zone_id: "zone_042",
    zone_name: "Wayanad Sector 4, Meppadi (Kerala)",
    allocation_id: "alloc_001",
    task_type: "rescue",
    status: "in_progress",
    capacity: 65
  },
  {
    id: "task_002",
    agency_id: "agency_sdrf",
    agency_name: "SDRF Disaster Strike Force",
    zone_id: "zone_044",
    zone_name: "Guwahati Brahmaputra Bank (Assam)",
    allocation_id: "alloc_002",
    task_type: "evacuation",
    status: "in_progress",
    capacity: 45
  },
  {
    id: "task_003",
    agency_id: "agency_ircs",
    agency_name: "Indian Red Cross Society",
    zone_id: "zone_042",
    zone_name: "Wayanad Sector 4, Meppadi (Kerala)",
    allocation_id: "alloc_003",
    task_type: "medical",
    status: "assigned",
    capacity: 30
  }
];

export const seedAuditLog: AuditEntry[] = [
  {
    id: "audit_001",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    event_type: "zone_updated",
    actor: "Agent A",
    zone_id: "zone_042",
    summary: "Zone Wayanad Sector 4 severity escalated to Critical (92) — landslide casualties confirmed at 12.",
    raw_payload: { zone_id: "zone_042", severity_score: 92, priority_tier: "Critical" }
  },
  {
    id: "audit_002",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    event_type: "allocation_recalculated",
    actor: "Agent B",
    zone_id: "zone_042",
    summary: "14 extrication kits deployed to Wayanad (NDRF 4th Battalion) from Arakkonam Base.",
    raw_payload: { allocation_id: "alloc_001" }
  },
  {
    id: "audit_003",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    event_type: "duplicate_flagged",
    actor: "Agent A (Detection)",
    zone_id: "zone_042",
    summary: "Flagged overlap: NDRF 4th Battalion and SDRF Strike Force both mobilized for Sector 4 search grid.",
    raw_payload: { zone_id: "zone_042", conflict: ["NDRF 4th Battalion", "SDRF Disaster Strike Force"], need_type: "rescue extrication" }
  }
];
