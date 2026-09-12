import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { type AuditEntry } from '../api/mockData';
import { cn } from '../lib/utils';
import { RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';

const EVENT_TYPES = [
  { value: 'all', label: 'All Event Types' },
  { value: 'zone_updated', label: 'zone_updated' },
  { value: 'allocation_recalculated', label: 'allocation_recalculated' },
  { value: 'report_submitted', label: 'report_submitted' },
  { value: 'agency_status_changed', label: 'agency_status_changed' },
  { value: 'duplicate_flagged', label: 'duplicate_flagged' },
  { value: 'inventory_updated', label: 'inventory_updated' }
];

const ACTORS = [
  { value: 'all', label: 'All Actors' },
  { value: 'Agent A', label: 'Agent A' },
  { value: 'Agent A (Detection)', label: 'Agent A (Detection)' },
  { value: 'Agent B', label: 'Agent B' },
  { value: 'Coordinator', label: 'Coordinator' },
  { value: 'Coordinator (Manual)', label: 'Coordinator (Manual)' },
  { value: 'Field Reporter', label: 'Field Reporter' },
  { value: 'Dev Trigger (Mock System)', label: 'Dev Trigger' },
  { value: 'Red Cross Unit 4', label: 'Red Cross Unit 4' }
];

export default function AuditLog() {
  const [eventType, setEventType] = useState('all');
  const [actor, setActor] = useState('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<'all' | '1h' | '24h'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters = {
    event_type: eventType,
    actor: actor,
    search: search
  };

  const { data: rawLogs = [], isLoading, error, isFetching, refetch } = useQuery<AuditEntry[]>({
    queryKey: ['audit', filters],
    queryFn: () => apiClient.getAuditLog(filters),
    staleTime: 5000,
  });

  const logs = rawLogs.filter(entry => {
    if (dateRange === '1h') {
      return Date.now() - new Date(entry.timestamp).getTime() <= 3600 * 1000;
    }
    if (dateRange === '24h') {
      return Date.now() - new Date(entry.timestamp).getTime() <= 24 * 3600 * 1000;
    }
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-[#0E0F11] overflow-hidden text-[#E8EAED]">
      {/* Top Header Strip */}
      <div className="h-10 px-4 border-b border-[#2A2E33] bg-[#171A1D] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-tight text-[#E8EAED]">
            Audit Telemetry Log
          </span>
          <span className="text-[#2A2E33]">|</span>
          <span className="font-mono text-xs text-[#9BA1A8]">
            {logs.length} RECORDS STREAMED
          </span>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs uppercase tracking-tight bg-[#1E2226] border border-[#2A2E33] hover:border-[#3E7CB1] text-[#E8EAED] transition-none disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3 h-3", isFetching && "animate-spin")} />
          Tail
        </button>
      </div>

      {/* Main Content: Left Persistent Filter Strip + Right Dense Log Stream */}
      <div className="flex flex-1 overflow-hidden">
        {/* Persistent Left-side Filter Strip (Part 6) */}
        <div className="w-56 shrink-0 border-r border-[#2A2E33] bg-[#171A1D] flex flex-col p-3 gap-4 overflow-y-auto text-xs">
          {/* Keyword search input */}
          <div>
            <span className="font-semibold uppercase tracking-tight text-[#9BA1A8] block mb-1.5 text-[11px]">
              Query Filter
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search payload/zone..."
              className="w-full bg-[#0E0F11] border border-[#2A2E33] focus:border-[#3E7CB1] px-2 py-1 text-xs font-mono text-[#E8EAED] placeholder-[#9BA1A8]/40 outline-none"
            />
          </div>

          {/* Time range selector */}
          <div>
            <span className="font-semibold uppercase tracking-tight text-[#9BA1A8] block mb-1.5 text-[11px]">
              Time Range
            </span>
            <div className="flex flex-col border border-[#2A2E33] divide-y divide-[#2A2E33] bg-[#0E0F11]">
              {(['all', '1h', '24h'] as const).map(tr => (
                <button
                  key={tr}
                  onClick={() => setDateRange(tr)}
                  className={cn(
                    'px-2.5 py-1 text-left uppercase text-[11px] transition-none',
                    dateRange === tr
                      ? 'bg-[#1E2226] text-[#E8EAED] font-semibold'
                      : 'text-[#9BA1A8] hover:text-[#E8EAED]'
                  )}
                >
                  {tr === 'all' ? 'All available' : tr === '1h' ? 'Past 1 hour' : 'Past 24 hours'}
                </button>
              ))}
            </div>
          </div>

          {/* Event Type Filter */}
          <div>
            <span className="font-semibold uppercase tracking-tight text-[#9BA1A8] block mb-1.5 text-[11px]">
              Event Classification
            </span>
            <div className="flex flex-col border border-[#2A2E33] divide-y divide-[#2A2E33] bg-[#0E0F11]">
              {EVENT_TYPES.map(et => (
                <button
                  key={et.value}
                  onClick={() => setEventType(et.value)}
                  className={cn(
                    'px-2.5 py-1 text-left font-mono text-[11px] truncate transition-none',
                    eventType === et.value
                      ? 'bg-[#1E2226] text-[#E8EAED] font-semibold'
                      : 'text-[#9BA1A8] hover:text-[#E8EAED]'
                  )}
                >
                  {et.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actor Filter */}
          <div>
            <span className="font-semibold uppercase tracking-tight text-[#9BA1A8] block mb-1.5 text-[11px]">
              Originating Actor
            </span>
            <div className="flex flex-col border border-[#2A2E33] divide-y divide-[#2A2E33] bg-[#0E0F11]">
              {ACTORS.map(ac => (
                <button
                  key={ac.value}
                  onClick={() => setActor(ac.value)}
                  className={cn(
                    'px-2.5 py-1 text-left text-[11px] truncate transition-none',
                    actor === ac.value
                      ? 'bg-[#1E2226] text-[#E8EAED] font-semibold'
                      : 'text-[#9BA1A8] hover:text-[#E8EAED]'
                  )}
                >
                  {ac.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dense Terminal-like Table Stream (Part 6) */}
        <div className="flex-1 overflow-auto bg-[#0E0F11] font-mono text-xs">
          {isLoading ? (
            <div className="p-4 text-[#9BA1A8]">CONNECTING TO SYSTEM LOG STREAM...</div>
          ) : error ? (
            <div className="p-4 text-[#C4432E]">FAILED TO STREAM AUDIT LOGS.</div>
          ) : logs.length === 0 ? (
            <div className="p-4 text-[#9BA1A8]">NO LOG ENTRIES MATCH CURRENT FILTER SET.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2A2E33] bg-[#171A1D] text-[#9BA1A8] sticky top-0 z-10 font-sans">
                  <th className="p-2 font-medium uppercase tracking-tight text-[11px] w-36">Timestamp</th>
                  <th className="p-2 font-medium uppercase tracking-tight text-[11px] w-48">Event Type</th>
                  <th className="p-2 font-medium uppercase tracking-tight text-[11px] w-36">Actor</th>
                  <th className="p-2 font-medium uppercase tracking-tight text-[11px]">Payload Summary</th>
                  <th className="p-2 font-medium uppercase tracking-tight text-[11px] w-12 text-right">Raw</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2E33]">
                {logs.map(entry => {
                  const isExpanded = expandedId === entry.id;
                  const time = new Date(entry.timestamp).toISOString().replace('T', ' ').substring(0, 19) + 'Z';

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className={cn(
                        'hover:bg-[#171A1D] cursor-pointer select-none',
                        isExpanded && 'bg-[#171A1D]'
                      )}
                    >
                      {/* Timestamp in IBM Plex Mono */}
                      <td className="p-2 text-[#9BA1A8] whitespace-nowrap text-[11px]">
                        {time}
                      </td>

                      {/* Event Type: Plain text, NO colored badge per Part 6 */}
                      <td className="p-2 text-[#E8EAED] whitespace-nowrap text-[11px]">
                        {entry.event_type}
                      </td>

                      {/* Actor */}
                      <td className="p-2 text-[#9BA1A8] whitespace-nowrap text-[11px] font-sans">
                        {entry.actor}
                      </td>

                      {/* One-line payload summary */}
                      <td className="p-2 text-[#E8EAED] font-sans text-xs">
                        <div className="truncate max-w-xl">
                          {entry.summary}
                        </div>
                        {isExpanded && entry.raw_payload && (
                          <div className="mt-2 p-2 bg-[#0E0F11] border border-[#2A2E33] text-[11px] font-mono text-[#9BA1A8] overflow-x-auto">
                            <pre>{JSON.stringify(entry.raw_payload, null, 2)}</pre>
                          </div>
                        )}
                      </td>

                      {/* Raw expand button */}
                      <td className="p-2 text-right text-[#9BA1A8]">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 inline" /> : <ChevronRight className="w-3.5 h-3.5 inline" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
