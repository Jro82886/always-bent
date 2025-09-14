"use client";
import ReportCatchButton from '@/components/ReportCatchButton';
import SnipController from '@/components/SnipController';

interface RightZoneProps {
  map: mapboxgl.Map | null;
}

export default function RightZone({ map }: RightZoneProps) {
  return (
    <>
      {/* ABFI Button - Let ReportCatchButton handle its own positioning */}
      <ReportCatchButton map={map} />
      
      {/* Snip Controller - Handles the analyze area functionality */}
      <SnipController map={map} />
    </>
  );
}
