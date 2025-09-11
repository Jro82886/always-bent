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
