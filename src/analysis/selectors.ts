import { useAppState } from '@/lib/store';

export const useLayerFlags = () => {
  const activeRaster = useAppState(s => s.activeRaster);
  return {
    sstOn: activeRaster === 'sst',
    chlOn: activeRaster === 'chl'
  };
};

export const useSelectedDateISO = () => {
  const isoDate = useAppState(s => s.isoDate);
  return isoDate ?? new Date().toISOString().slice(0, 10);
};
