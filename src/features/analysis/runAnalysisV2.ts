import type { AnalyzeAPI } from '@/types/analyze';
import { useAppState } from '@/lib/store';
import { toVM } from '@/types/analyze';

export async function runAnalyzeV2(polygon: GeoJSON.Polygon) {
  // Use today's date for ocean data
  const today = new Date();
  const dateISO = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

  console.log('[runAnalyzeV2] Fetching ocean data for date:', dateISO);

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ polygon, date: dateISO, want: { sst:true, chl:true } })
  })
  if (!res.ok) {
    const errorText = await res.text();
    console.error('[runAnalyzeV2] API error:', res.status, errorText);
    throw new Error(`analyze ${res.status}: ${errorText}`);
  }

  const api = await res.json();
  console.log('[runAnalyzeV2] API response:', api);

  const vm = toVM(api);
  console.log('[runAnalyzeV2] Converted to VM:', vm);

  const s = useAppState.getState();
  s.setAnalysisVM(vm);
  s.openDynamicModal();
}
