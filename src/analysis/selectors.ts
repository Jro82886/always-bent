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
  // Use a known recent date with available Copernicus data
  if (!isoDate) {
    // January 20, 2025 - a date we know should have data
    return '2025-01-20';
  }
  return isoDate;
};
