export function getFourTimes() {
  const out: string[] = ['current'];
  const now = new Date();
  for (let k = 1; k <= 3; k++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - k);
    out.push(d.toISOString());
  }
  return out;
}

export function timeLabel(t: string) {
  if (t === 'current') return 'Today';
  const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  const d = new Date(t);
  const dd = Math.floor((+today - Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())) / 86400000);
  return dd === 1 ? '−1d' : dd === 2 ? '−2d' : '−3d';
}

export function toUTCDateString(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Enforce present/past-only (today, -1d, -2d, -3d, or explicit within 3 days)
export function guardSstTime(input: string): 'today' | '-1d' | '-2d' | '-3d' | `${number}-${string}-${string}` {
  if (input === 'today' || input === '-1d' || input === '-2d' || input === '-3d') return input;
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return 'today';
  const now = new Date();
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const req = Date.UTC(y, mo - 1, da);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diffDays = Math.floor((today - req) / (24 * 3600 * 1000));
  if (diffDays < 0) return 'today';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '-1d';
  if (diffDays === 2) return '-2d';
  if (diffDays === 3) return '-3d';
  // older than 3 days → clamp to -3d per rule
  return '-3d';
}


