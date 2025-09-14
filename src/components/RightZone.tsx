"use client";
import { useState } from 'react';
import ReportCatchButton from '@/components/ReportCatchButton';
import SnipController from '@/components/SnipController';

interface RightZoneProps {
  map: mapboxgl.Map | null;
}

export default function RightZone({ map }: RightZoneProps) {
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  
  return (
    <>
      {/* ABFI Button - Hide when analysis modal is open */}
      {!isAnalysisModalOpen && <ReportCatchButton map={map} />}
      
      {/* Snip Controller - Handles the analyze area functionality */}
      <SnipController map={map} onModalStateChange={setIsAnalysisModalOpen} />
    </>
  );
}
