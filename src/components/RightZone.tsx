"use client";
import { useState, useCallback } from 'react';
import SnipController from '@/components/SnipController';
import UnifiedRightPanel from '@/components/UnifiedRightPanel';

interface RightZoneProps {
  map: mapboxgl.Map | null;
  onModalStateChange?: (isOpen: boolean) => void;
  onModeSwitch?: () => void;
}

export default function RightZone({ map, onModalStateChange, onModeSwitch }: RightZoneProps) {
  const [snipControllerRef, setSnipControllerRef] = useState<any>(null);
  
  const handleModalStateChange = (isOpen: boolean) => {
    onModalStateChange?.(isOpen);
  };
  
  const handleAnalyze = useCallback(() => {
    // Trigger the snip tool to start drawing
    const button = document.querySelector('[data-snip-button]') as HTMLButtonElement;
    if (button) {
      button.click();
    }
  }, []);
  
  return (
    <>
      {/* Hidden Snip Controller - Handles the actual analysis */}
      <div className="hidden">
        <SnipController map={map} onModalStateChange={handleModalStateChange} />
      </div>
      
      {/* Unified Right Panel - Visible UI */}
      {onModeSwitch && (
        <UnifiedRightPanel 
          onAnalyze={handleAnalyze}
          onModeSwitch={onModeSwitch}
          currentMode="analysis"
        />
      )}
    </>
  );
}
