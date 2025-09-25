import { useAppState } from '@/lib/store';
import type { AnalysisVM } from '@/types/analyze';

export function openWithVM(vm: AnalysisVM) {
  const s = useAppState.getState();
  s.setAnalysisVM(vm);
  s.openDynamicModal();
}
