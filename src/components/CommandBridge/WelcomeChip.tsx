'use client';

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';

export default function WelcomeChip() {
  const [captainName, setCaptainName] = useState('');
  const [boatName, setBoatName] = useState('');

  useEffect(() => {
    // Get captain and boat names from localStorage
    const captain = localStorage.getItem('abfi_captain_name') || 'Captain';
    const boat = localStorage.getItem('abfi_boat_name') || 'Vessel';
    setCaptainName(captain);
    setBoatName(boat);
  }, []);

  if (!captainName) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <User className="w-3 h-3 text-cyan-400" />
      <div className="flex items-center gap-1 text-xs text-cyan-100/80">
        <span>Captain:</span>
        <span className="text-cyan-300 font-semibold">{captainName}</span>
        <span className="text-gray-600">·</span>
        <span>F/V</span>
        <span className="text-cyan-300 font-semibold">{boatName}</span>
      </div>
    </div>
  );
}
