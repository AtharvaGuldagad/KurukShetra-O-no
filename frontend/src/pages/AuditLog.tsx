import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, type AuditFilter } from '../api/client';
import { type AuditEntry } from '../api/mockData';
import { cn } from '../lib/utils';
import {
  ScrollText, RefreshCw, Activity, Package, Map, AlertCircle, Radio, Search, ChevronDown, ChevronUp
} from 'lucide-react';

const EVENT_TYPES = [
  { value: 'all', label: 'All Events' },
  { value: 'zone_updated', label: 'Zone Updates' },
  { value: 'allocation_recalculated', label: 'Allocations' },
  { value: 'report_submitted', label: 'Reports' },
  { value: 'agency_status_changed', label: 'Agency Status' },
  { value: 'duplicate_flagged', label: 'Duplicate Flags' },
  { value: 'inventory_updated', label: 'Inventory Updates' }
];

const ACTORS = [
  { value: 'all', label: 'All Actors' },
  { value: 'Agent A', label: 'Agent A' },
  { value: 'Agent A (Detection)', label: 'Agent A (Detection)' },
  { value: 'Agent B', label: 'Agent B' },
  { value: 'Coordinator', label: 'Coordinator' },
  { value: 'Coordinator (Manual)', label: 'Coordinator (Manual)' },
  { value: 'Field Reporter', label: 'Field Reporter' },
  { value: 'Dev Trigger (Mock System)', label: 'Dev Trigger (Mock)' },
  { value: 'Red Cross Unit 4', label: 'Red Cross Unit 4' }
];

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'zone_updated': return <Map className="w-4 h-4 text-blue-400" />;
    case 'allocation_recalculated': return <Package className="w-4 h-4 text-purple-400" />;
    case 'report_submitted': return <ScrollText className="w-4 h-4 text-green-400" />;
    case 'agency_status_changed': return <Radio className="w-4 h-4 text-teal-400" />;
    case 'duplicate_flagged': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    case 'inventory_updated': return <Activity className="w-4 h-4 text-orange-400" />;
    default: return <Activity className="w-4 h-4 text-slate-400" />;
  }
}

function LogEntryRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
      <div 
        className="p-4 flex gap-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="shrink-0 mt-1">
          <EventIcon type={entry.event_type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-1">
            <p className="text-sm text-slate-200 leading-snug">{entry.summary}</p>
            <span className="text-xs text-slate-500 whitespace-nowrap tabular-nums">
              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-medium text-slate-300">{entry.actor}</span>
            {entry.zone_id && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="font-mono">{entry.zone_id}</span>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="text-slate-500 capitalize">{entry.event_type.replace(/_/g, ' ')}</span>
            
            <div className="ml-auto flex items-center gap-1 text-slate-500 hover:text-slate-300">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{expanded ? 'Hide Payload' : 'Show Payload'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {expanded && entry.raw_payload && (
        <div className="px-12 pb-4 pt-1">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 overflow-x-auto">
            <pre className="text-xs text-slate-300 font-mono">
              {JSON.stringify(entry.raw_payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditLog() {
  const [filters, setFilters] = useState<AuditFilter>({
    event_type: 'all',
    actor: 'all',
    search: ''
  });

  const { data: logs = [], isLoading, error, isFetching } = useQuery({
    queryKey: ['audit', filters],
    queryFn: () => apiClient.getAuditLog(filters),
    staleTime: 10000,
  });

  if (error) {
    return (
      <div className="p-8 text-red-400 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        Failed to load audit logs.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 mr-auto">
          <div className="p-2 bg-slate-800 rounded-lg">
            <ScrollText className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100 leading-tight">Audit Log</h1>
            <p className="text-xs text-slate-400">System-wide event history</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48 shrink-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search summary or zone ID..."
              value={filters.search || ''}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <select
            value={filters.event_type}
            onChange={e => setFilters(prev => ({ ...prev, event_type: e.target.value }))}
            className="w-full sm:w-40 py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
          >
            {EVENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={filters.actor}
            onChange={e => setFilters(prev => ({ ...prev, actor: e.target.value }))}
            className="w-full sm:w-40 py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
          >
            {ACTORS.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>

          <button
            onClick={() => {}}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <ScrollText className="w-12 h-12 mb-3 text-slate-700" />
            <p>No audit events found matching filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {logs.map(log => (
              <LogEntryRow key={log.id} entry={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
