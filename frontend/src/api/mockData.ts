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
  status?: string;
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


