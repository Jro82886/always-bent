import { toVM } from '@/types/analyze';

export async function runAnalyze(polygon: GeoJSON.Polygon, dateISO: string) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ polygon, date: dateISO, want: { sst: true, chl: true } })
  });
  
  if (!res.ok) throw new Error(`analyze ${res.status}`);
  
  const api = await res.json();
  return toVM(api); // your converter (°C→°F, gradient per mile, etc.)
}
