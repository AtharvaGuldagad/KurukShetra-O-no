import type { Zone, InventoryItem, Allocation, AgencyTask, AuditEntry } from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function fetchApi<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('solace_auth_token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { ...headers, ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}



// ─── Response Transformers ────────────────────────────────────────────────────
// Backend returns slightly different shapes — normalize to frontend types.

function transformBackendZone(z: any): Zone {
  return {
    zone_id: z.zone_id ?? z.id,
    location: z.location ?? { lat: 0, lng: 0, name: 'Unknown' },
    disaster_type: z.disaster_type ?? 'other',
    population_affected_est: z.population_affected_est ?? 0,
    casualties: z.casualties ?? 0,
    needs: z.needs ?? [],
    severity_score: z.severity_score ?? 0,
    priority_tier: z.priority_tier ?? 'Low',
    source_confidence: z.source_confidence ?? 0,
    source_refs: z.source_refs ?? [],
    deterioration_delta: z.deterioration_delta ?? 'unknown',
  };
}

function transformBackendInventory(r: any): InventoryItem {
  return {
    id: r.id,
    resource_type: r.resource_type,
    quantity: r.quantity_available ?? r.quantity ?? 0,
    baseline_quantity: r.baseline_quantity ?? r.quantity_available ?? 0,
    depot: r.depot_location ?? r.depot ?? '',
    agency: r.owning_agency ?? r.agency ?? '',
  };
}

function transformBackendAllocation(a: any): Allocation {
  // Backend uses: Proposed, Approved, Rejected, Dispatched
  // Frontend uses: pending_approval, approved, rejected, dispatched
  const statusMap: Record<string, string> = {
    'Proposed': 'pending_approval',
    'Approved': 'approved',
    'Rejected': 'rejected',
    'Dispatched': 'dispatched',
  };
  const rawStatus = a.status ?? 'Proposed';
  const normalizedStatus = statusMap[rawStatus] ?? rawStatus.toLowerCase().replace(/[- ]/g, '_');

  return {
    allocation_id: a.allocation_id ?? a.id,
    zone_id: a.zone_id,
    resource_type: a.resource_type,
    quantity: a.quantity,
    source_depot: a.source_depot,
    assigned_agency: a.assigned_agency,
    reasoning: a.reasoning ?? '',
    requires_human_approval: a.requires_human_approval ?? false,
    status: normalizedStatus,
    timestamp: a.timestamp ?? a.created_at ?? new Date().toISOString(),
  };
}

function transformBackendTask(t: any): AgencyTask {
  // Backend uses: Pending, Accepted, In-Progress, Completed
  // Frontend uses: assigned, in_progress, completed
  const statusMap: Record<string, AgencyTask['status']> = {
    'Pending': 'assigned',
    'Accepted': 'in_progress',
    'In-Progress': 'in_progress',
    'Completed': 'completed',
  };
  const rawStatus = t.status ?? 'Pending';
  const normalizedStatus = statusMap[rawStatus] ?? (rawStatus.toLowerCase().replace(/[- ]/g, '_') as AgencyTask['status']);

  return {
    id: t.id,
    agency_id: t.agency_id ?? '',
    agency_name: t.agency_name ?? t.agency_id ?? '',
    zone_id: t.zone_id ?? '',
    zone_name: t.zone_name ?? '',
    allocation_id: t.allocation_id ?? '',
    task_type: t.task_type ?? '',
    status: normalizedStatus,
    capacity: t.capacity ?? 0,
  };
}

function transformBackendAudit(e: any): AuditEntry {
  return {
    id: e.id?.toString() ?? '',
    timestamp: e.created_at ?? e.timestamp ?? new Date().toISOString(),
    event_type: (e.event_type ?? '').replace('.', '_') as AuditEntry['event_type'],
    actor: e.actor ?? 'SYSTEM',
    zone_id: e.payload?.zone_id ?? e.zone_id,
    summary: e.payload?.summary ?? e.summary ?? `${e.event_type} event`,
    raw_payload: e.payload ?? e.raw_payload,
  };
}

export const apiClient = {
  // GET /zones
  getZones: async (): Promise<Zone[]> => {
    const data = await fetchApi<any[]>('/zones');
    return data.map(transformBackendZone).sort((a, b) => b.severity_score - a.severity_score);
  },

  // GET /zones/:id/history
  getZoneHistory: async (id: string): Promise<any[]> => {
    return await fetchApi<any[]>(`/zones/${id}/history`);
  },

  // POST /reports
  submitReport: async (report: Partial<Zone> & { description_raw?: string }): Promise<Zone> => {

    // Build raw_text from structured report for Agent A processing
    // Include the citizen's free-text description — this is the primary input for Agent A
    const parts = [
      `Location: ${report.location?.name ?? 'Unknown'}`,
      `Disaster type: ${report.disaster_type ?? 'unknown'}`,
      `Population affected: ${report.population_affected_est ?? 0}`,
      `Casualties: ${report.casualties ?? 0}`,
      `Needs: ${report.needs?.map(n => `${n.type} (${n.urgency})`).join(', ') ?? 'unknown'}`,
    ];
    // Append raw description so Agent A can extract richer context
    if ((report as any).description_raw) {
      parts.push(`Situation report: ${(report as any).description_raw}`);
    }
    const rawText = parts.join('. ');

    const result = await fetchApi<any>('/reports', {
      method: 'POST',
      body: JSON.stringify({ raw_text: rawText, reported_by: 'Field Reporter' }),
    });

    // Return a Zone-compatible shape from the backend response
    return transformBackendZone({
      zone_id: result.zone_id,
      ...result.state,
    });
  },

  // GET /inventory
  getInventory: async (): Promise<InventoryItem[]> => {
    const data = await fetchApi<any[]>('/inventory');
    return data.map(transformBackendInventory);
  },

  // PATCH /inventory/:id
  updateInventory: async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {

    const backendUpdates: any = {};
    if (updates.quantity !== undefined) backendUpdates.quantity_available = updates.quantity;
    if (updates.depot !== undefined) backendUpdates.depot_location = updates.depot;
    if (updates.agency !== undefined) backendUpdates.owning_agency = updates.agency;

    const data = await fetchApi<any>(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(backendUpdates),
    });
    return transformBackendInventory(data);
  },

  // GET /allocations
  getAllocations: async (): Promise<Allocation[]> => {
    const data = await fetchApi<any[]>('/allocations');
    return data.map(transformBackendAllocation);
  },

  // POST /allocations/recalculate
  recalculateAllocations: async (): Promise<any> => {
    return await fetchApi<any>('/allocations/recalculate', { method: 'POST' });
  },

  // PATCH /agency-tasks/:id/status
  updateAgencyTaskStatus: async (id: string, status: string): Promise<AgencyTask> => {

    const data = await fetchApi<any>(`/agency-tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return transformBackendTask(data);
  },

  // GET /audit-log?event_type=...&actor=...&search=...
  getAuditLog: async (filter?: { event_type?: string, actor?: string, search?: string }): Promise<AuditEntry[]> => {

    const params = new URLSearchParams();
    if (filter?.event_type && filter.event_type !== 'all') params.set('event_type', filter.event_type);
    if (filter?.actor && filter.actor !== 'all') params.set('actor', filter.actor);
    if (filter?.search) params.set('search', filter.search);
    const qs = params.toString();
    const data = await fetchApi<any[]>(`/audit-log${qs ? `?${qs}` : ''}`);
    return data.map(transformBackendAudit);
  },

  // GET /agency-tasks
  getAgencyTasks: async (): Promise<AgencyTask[]> => {
    const data = await fetchApi<any[]>('/agency-tasks');
    return data.map(transformBackendTask);
  },
  
  // PATCH /allocations/:id/status
  // Backend expects capitalized statuses: Approved, Rejected, Dispatched
  updateAllocationStatus: async (id: string, status: string): Promise<Allocation> => {
    // Normalize: frontend sends lowercase, backend expects capitalized
    const backendStatusMap: Record<string, string> = {
      'approved': 'Approved',
      'rejected': 'Rejected',
      'dispatched': 'Dispatched',
    };
    const backendStatus = backendStatusMap[status] ?? status;

    const data = await fetchApi<any>(`/allocations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: backendStatus })
    });
    return transformBackendAllocation(data);
  }
};
