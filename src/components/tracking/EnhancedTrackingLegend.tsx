'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Anchor, Users, Navigation, AlertCircle } from 'lucide-react';
import { getInletById, INLETS } from '@/lib/inlets';

interface EnhancedTrackingLegendProps {
  selectedInletId: string | null;
  showYou: boolean;
  showFleet: boolean;
  userPosition: { lat: number; lng: number; speed: number } | null;
  fleetVessels?: Array<{ id: string; inlet?: string; inletColor?: string; hasReport?: boolean }>;
}

export default function EnhancedTrackingLegend({ 
  selectedInletId, 
  showYou,
  showFleet,
  userPosition,
  fleetVessels = []
}: EnhancedTrackingLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const isOverview = !selectedInletId || selectedInletId === 'overview';
  const currentInlet = selectedInletId ? getInletById(selectedInletId) : null;
  
  // Group fleet vessels by inlet
  const vesselsByInlet = fleetVessels.reduce((acc, vessel) => {
    const inletId = vessel.inlet || 'unknown';
    if (!acc[inletId]) acc[inletId] = [];
    acc[inletId].push(vessel);
    return acc;
  }, {} as Record<string, typeof fleetVessels>);

  return (
    <div className={`absolute right-4 top-24 z-10 transition-all duration-300 ${
      isCollapsed ? 'w-12' : 'w-72'
    }`}>
      <div className="bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-cyan-500/20">
          {!isCollapsed && (
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Anchor className="w-4 h-4 text-cyan-400" />
              Vessel Tracking
            </h3>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-slate-800/50 rounded transition-colors"
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4 text-cyan-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>

        {/* Legend Content */}
        {!isCollapsed && (
          <div className="p-4 space-y-4">
            {/* Your Vessel Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-white">Your Vessel</span>
                </div>
                {showYou && userPosition ? (
                  <span className="text-xs text-emerald-400">Active</span>
                ) : (
                  <span className="text-xs text-gray-500">
                    {showYou ? 'No GPS' : 'Hidden'}
                  </span>
                )}
              </div>
              
              {showYou && userPosition && (
                <div className="ml-6 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                    <span className="text-xs text-slate-300">Position marker</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-emerald-400" />
                    <span className="text-xs text-slate-300">Track history</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {userPosition.speed.toFixed(1)} kts
                  </div>
                </div>
              )}
            </div>

            {/* Fleet Vessels Section */}
            <div className="space-y-2 pt-3 border-t border-cyan-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-white">Fleet Vessels</span>
                </div>
                <span className="text-xs text-gray-400">
                  {showFleet ? `${fleetVessels.length} total` : 'Hidden'}
                </span>
              </div>
              
              {showFleet && (
                <div className="ml-6 space-y-2">
                  {isOverview ? (
                    // Overview mode - show all inlets with colors
                    <>
                      <div className="text-[10px] text-cyan-400 mb-1">All Inlets</div>
                      {Object.entries(vesselsByInlet).map(([inletId, vessels]) => {
                        const inlet = INLETS.find(i => i.id === inletId);
                        if (!inlet || vessels.length === 0) return null;
                        
                        return (
                          <div key={inletId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ 
                                  backgroundColor: inlet.color,
                                  boxShadow: `0 0 8px ${inlet.color}`
                                }}
                              />
                              <span className="text-xs text-slate-300">{inlet.name}</span>
                            </div>
                            <span className="text-xs text-slate-400">
                              {vessels.length}
                              {vessels.some(v => v.hasReport) && (
                                <span className="text-yellow-400 ml-1">●</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    // Specific inlet mode - show only that inlet's vessels
                    <>
                      {currentInlet && (
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: currentInlet.color,
                              boxShadow: `0 0 8px ${currentInlet.color}`
                            }}
                          />
                          <span className="text-xs text-slate-300">{currentInlet.name}</span>
                        </div>
                      )}
                      <div className="space-y-1">
                        {vesselsByInlet[selectedInletId || '']?.map(vessel => (
                          <div key={vessel.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">• Vessel</span>
                            {vessel.hasReport && (
                              <span className="text-yellow-400">Has report</span>
                            )}
                          </div>
                        )) || (
                          <span className="text-xs text-slate-500">No vessels from this inlet</span>
                        )}
                      </div>
                    </>
                  )}
                  
                  {/* Legend items */}
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-blue-400" />
                      <span className="text-[10px] text-slate-400">Vessel track</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">●</span>
                      <span className="text-[10px] text-slate-400">Has catch report</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="pt-3 border-t border-cyan-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3 h-3 text-cyan-400 mt-0.5" />
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  {isOverview ? (
                    <>Fleet vessels shown with inlet colors. Select an inlet to filter.</>
                  ) : (
                    <>Showing vessels from {currentInlet?.name} only.</>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
