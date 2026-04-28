import { uiState, resolveTimezone } from "./state/ui.svelte";

export function formatTokens(count: number | null | undefined): string {
    if (count == null) return "0";
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return count.toString();
}

export function formatCost(cost: number | null | undefined): string {
    if (cost == null || cost === 0) return "$0.00";
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
}

/**
 * Format a date string or timestamp respecting the global UI timezone.
 */
export function formatDate(date: string | number | Date, options: Intl.DateTimeFormatOptions = {}): string {
    if (!date) return "--";
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: resolveTimezone(uiState.timezone),
        ...options
    };

    return new Intl.DateTimeFormat(undefined, defaultOptions).format(d);
}

/**
 * Format relative time (e.g. "5m ago")
 */
export function formatRelativeTime(date: string | number | Date): string {
    if (!date) return "--";
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 30) return `${diffDay}d ago`;
    
    return formatDate(d, { month: 'short', day: 'numeric' });
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return "0ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const min = sec / 60;
  if (min < 60) return `${min.toFixed(1)}m`;
  return `${(min / 60).toFixed(1)}h`;
}

export function computeDurationMs(start?: string, end?: string): number {
  if (!start || !end) return 0;
  return new Date(end).getTime() - new Date(start).getTime();
}

