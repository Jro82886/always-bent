"use client";
import ReportCatchButton from '@/components/ReportCatchButton';
import SnipController from '@/components/SnipController';

interface RightZoneProps {
  map: mapboxgl.Map | null;
}

export default function RightZone({ map }: RightZoneProps) {
  return (
    <>
      {/* ABFI Button - Bottom Right over ocean */}
      <div className="absolute bottom-8 right-8 z-40">
        <ReportCatchButton map={map} />
      </div>
      
      {/* Snip Controller - Handles the analyze area functionality */}
      <SnipController map={map} />
    </>
  );
}
