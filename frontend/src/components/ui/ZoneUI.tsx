import { type Zone } from '../../api/mockData';
import { cn } from '../../lib/utils';

export const SEVERITY_COLORS: Record<Zone['priority_tier'], string> = {
  Critical: '#C4432E',
  High:     '#C97A2E',
  Medium:   '#B8A13A',
  Low:      '#4C7A5E',
};

export const SEVERITY_BG_TINTS: Record<Zone['priority_tier'], string> = {
  Critical: 'rgba(196, 67, 46, 0.15)',
  High:     'rgba(201, 122, 46, 0.15)',
  Medium:   'rgba(184, 161, 58, 0.15)',
  Low:      'rgba(76, 122, 94, 0.15)',
};

export function getTierColor(tier: Zone['priority_tier']): string {
  return SEVERITY_COLORS[tier] ?? '#9BA1A8';
}

export function getTierBgTint(tier: Zone['priority_tier']): string {
  return SEVERITY_BG_TINTS[tier] ?? 'transparent';
}

/**
 * Left-edge 3px severity bar (reads as instrument/rank, not a rounded SaaS badge)
 */
export function SeverityEdgeBar({ tier, className }: { tier: Zone['priority_tier']; className?: string }) {
  const color = getTierColor(tier);
  return (
    <div
      className={cn('w-[3px] shrink-0 self-stretch', className)}
      style={{ backgroundColor: color }}
      title={`Severity tier: ${tier}`}
    />
  );
}

/**
 * Text-based status indicator with exact operational triage color (no rounded SaaS pills)
 */
export function SeverityBadge({ tier, score, size = 'sm' }: { tier: Zone['priority_tier']; score?: number; size?: 'sm' | 'md' }) {
  const color = getTierColor(tier);
  return (
    <div className="flex items-center gap-1.5" style={{ color }}>
      <span
        className="w-2 h-2 shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className={cn('font-semibold uppercase tracking-tight', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {tier}
      </span>
      {score !== undefined && (
        <span className="font-mono text-xs opacity-90">
          [{score}]
        </span>
      )}
    </div>
  );
}

/**
 * Need tag: flat, 1px border, non-decorative
 */
export function NeedTag({ type, urgency }: { type: string; urgency: 'critical' | 'high' | 'medium' | 'low' }) {
  const isCriticalOrHigh = urgency === 'critical' || urgency === 'high';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 text-xs border uppercase tracking-tight',
        isCriticalOrHigh ? 'border-[#C4432E] text-[#C4432E] bg-[#C4432E]/10' : 'border-[#2A2E33] text-[#9BA1A8] bg-[#171A1D]'
      )}
    >
      <span>{type}</span>
      <span className="opacity-70 font-mono text-[10px]">· {urgency}</span>
    </span>
  );
}

/**
 * Confidence bar: dense, rectangular meter
 */
export function ConfidenceBar({ value, refs }: { value: number; refs?: string[] }) {
  const pct = Math.round(value * 100);
  const barColor = value >= 0.8 ? '#4C7A5E' : value >= 0.6 ? '#B8A13A' : '#C4432E';

  return (
    <div className="flex items-center gap-1.5 text-xs text-[#9BA1A8]" title={refs ? `Sources: ${refs.join(', ')}` : undefined}>
      <div className="w-16 h-1.5 bg-[#0E0F11] border border-[#2A2E33] overflow-hidden">
        <div
          className="h-full"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <span className="font-mono text-[11px] text-[#E8EAED]">{pct}%</span>
    </div>
  );
}

export function DisasterTypeLabel({ type }: { type: string }) {
  return (
    <span className="text-xs uppercase tracking-tight text-[#9BA1A8] font-medium">
      {type}
    </span>
  );
}
