'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Anchor, Activity, Navigation, Users, MapPin } from 'lucide-react';
import { getInletById } from '@/lib/inlets';

interface TrackingLegendProps {
  boatName?: string;
  selectedInletId: string;
  showYou: boolean;
  showFleet: boolean;
  showABFINetwork: boolean;
  showTracks: boolean;
  trackingActive: boolean;
  fleetCount?: number;
}

export default function TrackingLegend({
  boatName,
  selectedInletId,
  showYou,
  showFleet,
  showABFINetwork,
  showTracks,
  trackingActive,
  fleetCount = 0
}: TrackingLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const inlet = getInletById(selectedInletId);

  return (
    <>
      {/* Top Inlet Display - Always visible */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-slate-900/95 backdrop-blur-xl px-6 py-2 rounded-full border border-cyan-500/20 shadow-2xl">
          <div className="flex items-center gap-3">
            <MapPin size={14} className="text-cyan-400" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyan-400/70">Current Zone:</span>
              <div className="flex items-center gap-2">
                {inlet && (
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: inlet.color,
                      boxShadow: `0 0 8px ${inlet.color}80`
                    }}
                  />
                )}
                <span className="text-sm font-semibold text-cyan-300">
                  {showABFINetwork ? 'ABFI East Coast Network' : (inlet?.name || 'Select Inlet')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Legend - Right side over land */}
      <div className="absolute right-4 top-40 z-10 w-72">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-lg border border-cyan-500/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <div 
            className="px-4 py-3 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-b border-cyan-500/20 cursor-pointer flex items-center justify-between"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-300">VESSEL TRACKING</span>
            </div>
            {isCollapsed ? (
              <ChevronDown size={16} className="text-cyan-400/70" />
            ) : (
              <ChevronUp size={16} className="text-cyan-400/70" />
            )}
          </div>

          {!isCollapsed && (
            <div className="p-4 space-y-4">
              {/* Your Vessel Section */}
              {showYou && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-cyan-400/70 uppercase tracking-wider">Your Vessel</div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-cyan-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-4 h-4 rounded-full bg-white shadow-[0_0_15px_rgba(0,221,235,0.8)]" />
                          {trackingActive && (
                            <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full border-2 border-cyan-400/50 animate-ping" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {boatName || 'Your Position'}
                          </div>
                          <div className="text-xs text-cyan-400/70 flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${trackingActive ? 'bg-green-400' : 'bg-yellow-400'}`} />
                            {trackingActive ? 'GPS Active' : 'GPS Waiting'}
                          </div>
                        </div>
                      </div>
                      <Anchor size={14} className="text-cyan-400/50" />
                    </div>
                  </div>
                </div>
              )}

              {/* Fleet Section */}
              {(showFleet || showABFINetwork) && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-cyan-400/70 uppercase tracking-wider">
                    {showABFINetwork ? 'ABFI Network' : 'Inlet Fleet'}
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-cyan-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {showABFINetwork ? (
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 shadow-[0_0_10px_rgba(0,221,235,0.5)]" />
                          ) : (
                            <div 
                              className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(0,221,235,0.5)]"
                              style={{
                                backgroundColor: inlet?.color || '#00DDEB',
                                boxShadow: `0 0 10px ${inlet?.color || '#00DDEB'}80`
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {showABFINetwork ? 'All ABFI Vessels' : `${inlet?.name || 'Fleet'} Vessels`}
                          </div>
                          <div className="text-xs text-cyan-400/70">
                            {fleetCount} vessels active
                          </div>
                        </div>
                      </div>
                      <Users size={14} className="text-cyan-400/50" />
                    </div>
                  </div>
                </div>
              )}

              {/* Vessel Tracks Section */}
              {showTracks && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-cyan-400/70 uppercase tracking-wider">Movement Tracks</div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-cyan-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-0">
                          <div className="w-2 h-0.5 bg-cyan-400/40" />
                          <div className="w-1 h-0.5 bg-transparent" />
                          <div className="w-2 h-0.5 bg-cyan-400/40" />
                          <div className="w-1 h-0.5 bg-transparent" />
                          <div className="w-2 h-0.5 bg-cyan-400/40" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">4-Hour History</div>
                          <div className="text-xs text-cyan-400/70">Vessel movement paths</div>
                        </div>
                      </div>
                      <Activity size={14} className="text-cyan-400/50" />
                    </div>
                  </div>
                </div>
              )}

              {/* Legend Key */}
              <div className="pt-3 border-t border-cyan-500/10">
                <div className="text-xs font-medium text-cyan-400/70 uppercase tracking-wider mb-2">Visual Key</div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(0,221,235,0.8)]" />
                    <span className="text-cyan-300/80">Your Position (GPS)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,221,235,0.5)]" />
                    <span className="text-cyan-300/80">Fleet Vessels</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0">
                      <div className="w-2 h-0.5 bg-cyan-400/40" />
                      <div className="w-1 h-0.5 bg-transparent" />
                      <div className="w-2 h-0.5 bg-cyan-400/40" />
                    </div>
                    <span className="text-cyan-300/80">Movement Tracks</span>
                  </div>
                </div>
              </div>

              {/* Status Summary */}
              <div className="pt-3 border-t border-cyan-500/10">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/30 rounded px-2 py-1">
                    <span className="text-cyan-400/70">Mode:</span>
                    <span className="ml-1 text-cyan-300 font-medium">
                      {showABFINetwork ? 'Network' : 'Inlet'}
                    </span>
                  </div>
                  <div className="bg-slate-800/30 rounded px-2 py-1">
                    <span className="text-cyan-400/70">Privacy:</span>
                    <span className="ml-1 text-cyan-300 font-medium">Fleet Only</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
