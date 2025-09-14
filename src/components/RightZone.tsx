"use client";
import { useState } from 'react';
import SnipController from '@/components/SnipController';

interface RightZoneProps {
  map: mapboxgl.Map | null;
  onModalStateChange?: (isOpen: boolean) => void;
}

export default function RightZone({ map, onModalStateChange }: RightZoneProps) {
  const handleModalStateChange = (isOpen: boolean) => {
    onModalStateChange?.(isOpen);
  };
  
  return (
    <>
      {/* Snip Controller - Handles the analyze area functionality */}
      <SnipController map={map} onModalStateChange={handleModalStateChange} />
    </>
  );
}
