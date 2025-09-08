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


