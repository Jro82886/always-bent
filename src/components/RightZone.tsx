"use client";
import { useCallback } from 'react';
import UnifiedCommandCenter from '@/components/UnifiedCommandCenter';

interface RightZoneProps {
  map: mapboxgl.Map | null;
  onModalStateChange?: (isOpen: boolean) => void;
}

export default function RightZone({ map, onModalStateChange }: RightZoneProps) {
  const handleAnalyze = useCallback(() => {
    // Trigger the snip tool to start drawing
    const button = document.querySelector('[data-snip-button]') as HTMLButtonElement;
    if (button) {
      button.click();
    } else if ((window as any).startSnipping) {
      (window as any).startSnipping();
    }
  }, []);
  
  return (
    <>
      {/* Unified Command Center - Weather + Snip Tool */}
      <UnifiedCommandCenter 
        onAnalyze={handleAnalyze}
        currentMode="analysis"
      />
    </>
  );
}
