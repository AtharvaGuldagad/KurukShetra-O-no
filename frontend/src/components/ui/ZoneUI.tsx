import { type Zone } from '../../api/mockData';
import { cn } from '../../lib/utils';

const TIER_CONFIG = {
  Critical: {
    bg: 'bg-red-900/60',
    border: 'border-red-500',
    text: 'text-red-300',
    badge: 'bg-red-500 text-white',
    dot: 'bg-red-500',
    ring: 'ring-red-500',
    mapColor: '#ef4444',
    pulse: 'animate-pulse',
  },
  High: {
    bg: 'bg-orange-900/50',
    border: 'border-orange-500',
    text: 'text-orange-300',
    badge: 'bg-orange-500 text-white',
    dot: 'bg-orange-500',
    ring: 'ring-orange-500',
    mapColor: '#f97316',
    pulse: '',
  },
  Medium: {
    bg: 'bg-yellow-900/40',
    border: 'border-yellow-500',
    text: 'text-yellow-300',
    badge: 'bg-yellow-500 text-black',
    dot: 'bg-yellow-400',
    ring: 'ring-yellow-500',
    mapColor: '#eab308',
    pulse: '',
  },
  Low: {
    bg: 'bg-green-900/30',
    border: 'border-green-600',
    text: 'text-green-400',
    badge: 'bg-green-600 text-white',
    dot: 'bg-green-500',
    ring: 'ring-green-600',
    mapColor: '#22c55e',
    pulse: '',
  },
} as const;

export function getTierConfig(tier: Zone['priority_tier']) {
  return TIER_CONFIG[tier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.Low;
}

interface SeverityBadgeProps {
  tier: Zone['priority_tier'];
  score?: number;
  size?: 'sm' | 'md';
}

export function SeverityBadge({ tier, score, size = 'md' }: SeverityBadgeProps) {
  const config = getTierConfig(tier);
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide',
      config.badge,
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}>
      {tier === 'Critical' && (
        <span className="inline-block w-2 h-2 rounded-full bg-white/80 animate-pulse" />
      )}
      {tier}
      {score !== undefined && <span className="opacity-75">({score})</span>}
    </span>
  );
}

interface NeedTagProps {
  type: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

const URGENCY_COLORS = {
  critical: 'border-red-500 text-red-300 bg-red-950/50',
  high: 'border-orange-500 text-orange-300 bg-orange-950/50',
  medium: 'border-yellow-500 text-yellow-300 bg-yellow-950/50',
  low: 'border-green-600 text-green-400 bg-green-950/30',
};

export function NeedTag({ type, urgency }: NeedTagProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium',
      URGENCY_COLORS[urgency]
    )}>
      <span className="capitalize">{type}</span>
      <span className="opacity-60 text-[10px]">· {urgency}</span>
    </span>
  );
}

interface ConfidenceBarProps {
  value: number; // 0–1
  refs?: string[];
}

export function ConfidenceBar({ value, refs }: ConfidenceBarProps) {
  const pct = Math.round(value * 100);
  const color = value >= 0.85 ? 'bg-green-500' : value >= 0.65 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="group relative flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 font-mono">{pct}%</span>
      {refs && refs.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 bg-slate-800 border border-slate-600 rounded p-2 shadow-xl min-w-48">
          <p className="text-xs font-semibold text-slate-300 mb-1">Source Refs:</p>
          {refs.map((r, i) => (
            <p key={i} className="text-xs text-slate-400 font-mono break-all">{r}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export function DisasterTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    flood: '🌊', earthquake: '⚡', fire: '🔥', landslide: '⛰️', hurricane: '🌀', default: '⚠️'
  };
  return <span title={type}>{icons[type] ?? icons.default}</span>;
}
