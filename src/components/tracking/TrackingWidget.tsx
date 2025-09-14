'use client';

import { useState } from 'react';
import { Users, User, Building2 } from 'lucide-react';
import { WidgetShell } from '@/components/WidgetShell';
import IndividualTrackingWidget from './IndividualTrackingWidget';
import FleetTrackingWidget from './FleetTrackingWidget';
import CommercialTrackingWidget from './CommercialTrackingWidget';

type TrackingMode = 'individual' | 'fleet' | 'commercial';

export default function TrackingWidget() {
  const [mode, setMode] = useState<TrackingMode>('individual');

  return (
    <WidgetShell title="🚢 LIVE VESSEL TRACKING - UPDATED!">
      {/* Mode Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('individual')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'individual'
              ? 'bg-cyan-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <User className="w-4 h-4" />
          Individual
        </button>
        
        <button
          onClick={() => setMode('fleet')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'fleet'
              ? 'bg-cyan-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Fleet
        </button>
        
        <button
          onClick={() => setMode('commercial')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'commercial'
              ? 'bg-cyan-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Commercial
        </button>
      </div>

      {/* Widget Content */}
      <div className="min-h-[300px]">
        {mode === 'individual' && <IndividualTrackingWidget />}
        {mode === 'fleet' && <FleetTrackingWidget />}
        {mode === 'commercial' && <CommercialTrackingWidget />}
      </div>
    </WidgetShell>
  );
}
