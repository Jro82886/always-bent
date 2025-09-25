import type { AnalyzeAPI } from '@/types/analyze';
import { useAppState } from '@/lib/store';
import { toVM } from '@/types/analyze';

export async function runAnalyzeV2(polygon: GeoJSON.Polygon) {
  const dateISO = new Date().toISOString().slice(0,10)
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ polygon, date: dateISO, want: { sst:true, chl:true } })
  })
  if (!res.ok) throw new Error(`analyze ${res.status}`)
  const api = await res.json()
  const vm = toVM(api)

  const s = useAppState.getState()
  s.setAnalysisVM(vm)
  s.openDynamicModal()
}
