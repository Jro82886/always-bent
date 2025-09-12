export type DaySel = 'latest' | 'today' | '-1d' | '-2d' | '-3d';
export type TimeMode = 'default' | 'isoDate' | 'none';

export function resolveTime(selection: DaySel, mode: TimeMode): string | null {
  if (mode === 'none') return null;
  if (mode === 'default') return 'default';

  const offset = selection === 'latest' || selection === 'today' ? 0 :
    selection === '-1d' ? 1 : selection === '-2d' ? 2 : 3;
  const d = new Date();
  d.setUTCHours(0,0,0,0);
  d.setUTCDate(d.getUTCDate() - offset);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ODYSSEA daily product publishes at ~12:00 UTC; safest is yesterday 12:00Z
export function dailyAtNoonUTCISO(offsetDays = 1): string {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString().replace('.000Z', 'Z');
}

// ODYSSEA daily product: use midnight (00:00Z) per Capabilities for GetTile
// Default to yesterday (1 day offset) as it's usually available
export function dailyAtMidnightUTCISO(offsetDays = 1): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return `${d.toISOString().slice(0, 10)}T00:00:00.000Z`;
}
