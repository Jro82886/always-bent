'use client';

import mapboxgl from 'mapbox-gl';
import { useState } from 'react';
import { MapPin, Anchor, Users, Activity, Navigation, ChevronUp, ChevronDown, Ship, Globe, Shield } from 'lucide-react';
import { getInletById } from '@/lib/inlets';

interface UnifiedTrackingPanelLeftProps {
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
  locationPermissionGranted?: boolean;
}

export default function UnifiedTrackingPanelLeft({
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
  fleetCount = 12,
  locationPermissionGranted = false
}: UnifiedTrackingPanelLeftProps) {
  // Multiple sections can be expanded - cupboard style
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['vessel']) // Start with vessel section open by default
  );
  const [showPrivacyMessage, setShowPrivacyMessage] = useState(false);
  const inlet = getInletById(selectedInletId);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="absolute top-32 left-4 z-40 w-80">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl overflow-hidden">
        {/* Header with Navigation Icon */}
        <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 px-5 py-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <Navigation className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-cyan-100 tracking-wider">VESSEL TRACKING</h2>
          </div>
        </div>
        
        {/* Current Inlet Display (Read-only - controlled by Command Bridge) */}
        <div className="px-5 py-3 bg-slate-800/30 border-b border-cyan-500/10">
          <div className="flex items-center justify-between">
            <div className="text-xs text-cyan-400/60 uppercase tracking-wider mb-1">Selected Inlet</div>
            <MapPin className="w-4 h-4 text-cyan-400/30" />
          </div>
          <div className="flex items-center gap-2">
            {inlet && (
              <div 
                className="w-3 h-3 rounded-full shadow-lg" 
                style={{ 
                  backgroundColor: inlet.color || '#06B6D4',
                  boxShadow: `0 0 8px ${inlet.color || '#06B6D4'}50`
                }}
              />
            )}
            <span className="text-sm font-medium text-cyan-100">{inlet?.name || 'No Inlet Selected'}</span>
          </div>
          <div className="text-xs text-cyan-400/40 mt-1">Change inlet in Command Bridge</div>
        </div>
        
        {/* Location Sharing Notice */}
        {!locationPermissionGranted && (
          <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="text-xs text-red-400 font-medium">Location Required</div>
            <div className="text-xs text-red-300/80 mt-1">
              Enable location in Welcome to access tracking features
            </div>
          </div>
        )}
        
        {/* Your Vessel Section */}
        <div className="border-b border-cyan-500/10">
          <button 
            onClick={() => toggleSection('vessel')}
            className="w-full px-5 py-3 flex items-center justify-between hover:bg-cyan-500/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium text-cyan-400/70 uppercase tracking-wider">Your Vessel</div>
            </div>
            {expandedSections.has('vessel') ? 
              <ChevronUp className="w-4 h-4 text-cyan-400/50" /> : 
              <ChevronDown className="w-4 h-4 text-cyan-400/50" />
            }
          </button>
          
          {expandedSections.has('vessel') && (
            <div className="px-5 pb-4 space-y-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-white shadow-lg shadow-white/50" />
                    <div>
                      <div className="text-sm font-medium text-cyan-100">{boatName || 'Set Your Boat Name'}</div>
                      {trackingActive && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-xs text-green-400">GPS Active</span>
                        </div>
                      )}
                      {trackingActive && (
                        <div className="text-xs text-green-400/80 mt-1">
                          TESTING: Location visible everywhere
                        </div>
                      )}
                    </div>
                  </div>
                  <Anchor className="w-4 h-4 text-cyan-400/50" />
                </div>
                
                {/* Two-Step Display Control */}
                {locationPermissionGranted ? (
                  <div className="pt-2 border-t border-slate-700/50">
                    {!showYou ? (
                      <>
                        <button
                          onClick={() => {
                            setShowYou(true);
                            // In production, this will trigger privacy message if outside inlet
                            // For now in testing, location works everywhere
                            setShowPrivacyMessage(true);
                            setTimeout(() => setShowPrivacyMessage(false), 5000);
                          }}
                          className="w-full py-2 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg transition-all duration-300 group"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-xs font-medium text-cyan-300 group-hover:text-cyan-200">
                              Display My Location on Map
                            </span>
                          </div>
                        </button>
                        
                        {/* Privacy Protection Message - Only shows in production when outside inlet */}
                        {showPrivacyMessage && (
                          <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg animate-fade-in">
                            <div className="flex items-start gap-2">
                              <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-blue-300">
                                <div className="font-medium mb-1">Privacy Protection Active</div>
                                <div className="text-blue-300/80">
                                  When live: Your location only displays within 10 miles of your inlet. 
                                  Just head out for your next trip!
                                </div>
                                <div className="text-yellow-400/80 mt-1">
                                  (Testing mode: Location visible everywhere)
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-cyan-300/70">Location Visible</span>
                        <button 
                          onClick={() => {
                            setShowYou(false);
                            setShowPrivacyMessage(false);
                          }}
                          className="relative w-11 h-6 rounded-full bg-cyan-500 transition-colors"
                        >
                          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-700/50">
                    <div className="text-xs text-slate-500 text-center">Location not enabled</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Inlet Fleet Section */}
        <div className="border-b border-cyan-500/10">
          <button 
            onClick={() => toggleSection('fleet')}
            className="w-full px-5 py-3 flex items-center justify-between hover:bg-cyan-500/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium text-cyan-400/70 uppercase tracking-wider">Inlet Fleet</div>
            </div>
            {expandedSections.has('fleet') ? 
              <ChevronUp className="w-4 h-4 text-cyan-400/50" /> : 
              <ChevronDown className="w-4 h-4 text-cyan-400/50" />
            }
          </button>
          
          {expandedSections.has('fleet') && (
            <div className="px-5 pb-4">
              {/* Fleet Status */}
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full shadow-lg" 
                      style={{ 
                        backgroundColor: inlet?.color || '#06B6D4',
                        boxShadow: `0 0 8px ${inlet?.color || '#06B6D4'}50`
                      }}
                    />
                    <div>
                      <div className="text-sm font-medium text-cyan-100">ABFI Fleet</div>
                      <div className="text-xs text-cyan-400/60">{fleetCount} vessels active</div>
                    </div>
                  </div>
                  <Users className="w-4 h-4 text-cyan-400/50" />
                </div>
                
                {/* Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <span className="text-xs text-cyan-300/70">Show Fleet</span>
                  <button 
                    onClick={() => setShowFleet(!showFleet)}
                    disabled={!trackingActive}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      showFleet && trackingActive ? 'bg-cyan-600' : 'bg-slate-700'
                    } ${!trackingActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      showFleet && trackingActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Public Data Section */}
        <div className="border-b border-cyan-500/10">
          <button 
            onClick={() => toggleSection('public')}
            className="w-full px-5 py-3 flex items-center justify-between hover:bg-cyan-500/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium text-green-400/70 uppercase tracking-wider">Public Data</div>
            </div>
            {expandedSections.has('public') ? 
              <ChevronUp className="w-4 h-4 text-green-400/50" /> : 
              <ChevronDown className="w-4 h-4 text-green-400/50" />
            }
          </button>
          
          {expandedSections.has('public') && (
            <div className="px-5 pb-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-orange-500" />
                    <div>
                      <div className="text-sm font-medium text-cyan-100">GFW Commercial</div>
                      <div className="text-xs text-green-400/60">Always available</div>
                    </div>
                  </div>
                  <Ship className="w-4 h-4 text-orange-400/50" />
                </div>
                
                {/* Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <span className="text-xs text-cyan-300/70">Show Commercial</span>
                  <button 
                    onClick={() => setShowCommercial(!showCommercial)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      showCommercial ? 'bg-green-600' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      showCommercial ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Display Options Section */}
        <div className="border-b border-cyan-500/10">
          <button 
            onClick={() => toggleSection('display')}
            className="w-full px-5 py-3 flex items-center justify-between hover:bg-cyan-500/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium text-cyan-400/70 uppercase tracking-wider">Display Options</div>
            </div>
            {expandedSections.has('display') ? 
              <ChevronUp className="w-4 h-4 text-cyan-400/50" /> : 
              <ChevronDown className="w-4 h-4 text-cyan-400/50" />
            }
          </button>
          
          {expandedSections.has('display') && (
            <div className="px-5 pb-4 space-y-3">
              {/* ABFI Network Toggle */}
              <div className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400/50" />
                  <span className="text-sm text-cyan-100">ABFI Network</span>
                </div>
                <button 
                  onClick={() => setShowABFINetwork(!showABFINetwork)}
                  disabled={!trackingActive}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    showABFINetwork && trackingActive ? 'bg-cyan-600' : 'bg-slate-700'
                  } ${!trackingActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    showABFINetwork && trackingActive ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* Vessel Tracks Toggle */}
              <div className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400/50" />
                  <span className="text-sm text-cyan-100">Vessel Tracks</span>
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
          )}
        </div>
        
        {/* Status Bar */}
        <div className="px-5 py-3 bg-slate-800/30 border-t border-cyan-500/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-cyan-400/60">Status</span>
            <span className={trackingActive ? 'text-green-400' : 'text-yellow-400'}>
              {trackingActive ? 'TRACKING' : 'OFFLINE'}
            </span>
          </div>
          {trackingActive && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-400/60">Speed</span>
              <span className="text-cyan-300">{userSpeed.toFixed(1)} kts</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
