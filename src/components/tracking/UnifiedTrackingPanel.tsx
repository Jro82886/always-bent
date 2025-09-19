'use client';

import { useState } from 'react';
import { MapPin, Anchor, Users, Activity, Navigation, ChevronDown, Settings } from 'lucide-react';
import { getInletById, INLETS } from '@/lib/inlets';

interface UnifiedTrackingPanelProps {
  map: mapboxgl.Map | null;
  boatName?: string;
  selectedInletId: string;
  setSelectedInletId: (id: string) => void;
  showYou: boolean;
  setShowYou: (show: boolean) => void;
  showFleet: boolean;
  setShowFleet: (show: boolean) => void;
  showCommercial: boolean;
  setShowCommercial: (show: boolean) => void;
  showABFINetwork: boolean;
  setShowABFINetwork: (show: boolean) => void;
  showTracks: boolean;
  setShowTracks: (show: boolean) => void;
  trackingActive: boolean;
  userSpeed: number;
  fleetCount?: number;
}

export default function UnifiedTrackingPanel({
  map,
  boatName,
  selectedInletId,
  setSelectedInletId,
  showYou,
  setShowYou,
  showFleet,
  setShowFleet,
  showCommercial,
  setShowCommercial,
  showABFINetwork,
  setShowABFINetwork,
  showTracks,
  setShowTracks,
  trackingActive,
  userSpeed,
  fleetCount = 12
}: UnifiedTrackingPanelProps) {
  const [inletDropdownOpen, setInletDropdownOpen] = useState(false);
  const inlet = getInletById(selectedInletId);
  
  const handleInletSelect = (inletId: string) => {
    setSelectedInletId(inletId);
    setInletDropdownOpen(false);
    
    // Fly to inlet if map is available
    // Inlet Contract vFinal: never move camera on inlet changes (data scope only)
  };

  return (
    <div className="absolute right-4 top-24 bottom-24 z-10 w-80 pointer-events-auto">
      <div className="h-full bg-slate-900/95 backdrop-blur-xl rounded-lg border border-cyan-500/20 shadow-2xl flex flex-col">
        {/* Header with Inlet Selector */}
        <div className="p-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Navigation size={18} className="text-cyan-400" />
            <h2 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">Vessel Tracking</h2>
          </div>
          
          {/* Inlet Selector */}
          <div className="relative">
            <button
              onClick={() => setInletDropdownOpen(!inletDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 bg-slate-800/50 border border-cyan-500/30 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-800/70 transition-all"
            >
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-cyan-400/70" />
                <div 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: inlet?.color || '#00DDEB',
                    boxShadow: `0 0 8px ${inlet?.color || '#00DDEB'}80`
                  }}
                />
                <span className="text-cyan-100 font-medium">
                  {inlet?.name || 'Select Inlet'}
                </span>
              </div>
              <ChevronDown size={14} className={`text-cyan-400/70 transition-transform ${inletDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown */}
            {inletDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 right-0 max-h-64 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-lg shadow-2xl">
                {INLETS.map((inletOption) => (
                  <button
                    key={inletOption.id}
                    onClick={() => handleInletSelect(inletOption.id)}
                    className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-cyan-500/10 transition-colors text-left"
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: inletOption.color,
                        boxShadow: `0 0 6px ${inletOption.color}80`
                      }}
                    />
                    <span className="text-sm text-cyan-100">{inletOption.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Scrollable Controls Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Location Sharing Notice */}
          {!trackingActive && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="text-xs text-red-400 font-medium mb-1">Location Sharing Required</div>
              <div className="text-xs text-red-300/80">
                Enable location services to see other vessels. ABFI operates on reciprocal sharing - share your location to see the fleet.
              </div>
            </div>
          )}
          {/* Your Vessel Section */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-cyan-400/70 uppercase tracking-wider">Your Vessel</div>
            
            <div className="bg-slate-800/30 rounded-lg p-3 space-y-3">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(0,221,235,0.8)]" />
                  <span className="text-sm text-cyan-100">{boatName || 'Your Position'}</span>
                </div>
                <button 
                  onClick={() => setShowYou(!showYou)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    showYou ? 'bg-cyan-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    showYou ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* Status */}
              {showYou && (
                <div className="text-xs space-y-1 pl-5">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400/70">GPS Status</span>
                    <span className={trackingActive ? 'text-green-400' : 'text-yellow-400'}>
                      {trackingActive ? 'Active' : 'Waiting'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400/70">Speed</span>
                    <span className="text-cyan-300">{userSpeed.toFixed(1)} kts</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Fleet Section */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-cyan-400/70 uppercase tracking-wider">Fleet Display</div>
            
            <div className="bg-slate-800/30 rounded-lg p-3 space-y-3">
              {/* Inlet Fleet Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: inlet?.color || '#00DDEB',
                      boxShadow: `0 0 6px ${inlet?.color || '#00DDEB'}80`
                    }}
                  />
                  <span className="text-sm text-cyan-100">Inlet Fleet</span>
                </div>
                <button 
                  onClick={() => setShowFleet(!showFleet)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    showFleet ? 'bg-cyan-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    showFleet ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* ABFI Network Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400" />
                  <span className="text-sm text-cyan-100">ABFI Network</span>
                </div>
                <button 
                  onClick={() => setShowABFINetwork(!showABFINetwork)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    showABFINetwork ? 'bg-cyan-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    showABFINetwork ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* Fleet Status */}
              {(showFleet || showABFINetwork) && (
                <div className="text-xs pl-5">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400/70">Vessels Active</span>
                    <span className="text-cyan-300">{fleetCount}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Public Data Section - Always Available */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-green-400/70 uppercase tracking-wider">Public Data</div>
            
            <div className="bg-slate-800/30 rounded-lg p-3">
              {/* Commercial Vessels Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-orange-500" />
                  <span className="text-sm text-cyan-100">GFW Commercial</span>
                </div>
                <button 
                  onClick={() => setShowCommercial(!showCommercial)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    showCommercial ? 'bg-cyan-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    showCommercial ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="text-xs text-cyan-400/60 mt-2 pl-5">
                Global Fishing Watch data (always available)
              </div>
            </div>
          </div>
          
          {/* Tracking Options */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-cyan-400/70 uppercase tracking-wider">Display Options</div>
            
            <div className="bg-slate-800/30 rounded-lg p-3">
              {/* Vessel Tracks Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-cyan-400/70" />
                  <span className="text-sm text-cyan-100">Vessel Tracks (4hr)</span>
                </div>
                <button 
                  onClick={() => setShowTracks(!showTracks)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    showTracks ? 'bg-cyan-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    showTracks ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Status */}
        <div className="p-3 border-t border-cyan-500/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${showABFINetwork ? 'bg-blue-400' : 'bg-green-400'} animate-pulse`} />
              <span className="text-cyan-400/70">
                {showABFINetwork ? 'Network Mode' : 'Inlet Mode'}
              </span>
            </div>
            <span className="text-cyan-400/70">Privacy: Fleet Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
