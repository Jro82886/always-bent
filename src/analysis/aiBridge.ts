import type { AnalysisVM } from '@/types/analyze';

export async function kickAI(
  vm: AnalysisVM, 
  toggles: { sstOn: boolean; chlOn: boolean }, 
  inlet: any, 
  dateISO: string
) {
  try {
    await fetch('/api/ai/analysis-explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysisVM: vm, toggles, inlet, dateISO })
    });
  } catch (e) {
    console.error('[AI] Analysis explain failed:', e);
  }
}
