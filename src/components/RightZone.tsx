"use client";
import { useState, useCallback } from 'react';
import SnipController from '@/components/SnipController';
import UnifiedCommandCenter from '@/components/UnifiedCommandCenter';

interface RightZoneProps {
  map: mapboxgl.Map | null;
  onModalStateChange?: (isOpen: boolean) => void;
  onStartTutorial?: () => void;
}

export default function RightZone({ map, onModalStateChange, onStartTutorial }: RightZoneProps) {
  const [snipControllerRef, setSnipControllerRef] = useState<any>(null);
  
  const handleModalStateChange = (isOpen: boolean) => {
    onModalStateChange?.(isOpen);
  };
  
  const handleAnalyze = useCallback(() => {
    // Trigger the snip tool to start drawing
    
    const button = document.querySelector('[data-snip-button]') as HTMLButtonElement;
    if (button) {
      
      button.click();
    } else if ((window as any).startSnipping) {
      
      (window as any).startSnipping();
    } else {
      
    }
  }, []);
  
  return (
    <>
      {/* Hidden Snip Controller - Handles the actual analysis */}
      <div className="hidden">
        <SnipController map={map} onModalStateChange={handleModalStateChange} />
      </div>
      
      {/* Unified Command Center - Weather + Snip Tool */}
      <UnifiedCommandCenter 
        onAnalyze={handleAnalyze}
        currentMode="analysis"
        onStartTutorial={onStartTutorial}
      />
    </>
  );
}
