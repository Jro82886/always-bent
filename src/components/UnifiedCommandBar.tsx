'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Anchor, Navigation, Users, TrendingUp, LogOut } from 'lucide-react';
import { Map } from 'mapbox-gl';
import { useAppState } from '@/store/appState';
import { findClosestInlet } from '@/lib/findClosestInlet';
import { INLETS as inlets } from '@/lib/inlets';
import { useAuth } from '@/lib/supabase/AuthProvider';

interface UnifiedCommandBarProps {
  map?: Map | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const TAB_MODES = {
  'Analysis': 'analysis',
  'Tracking': 'tracking',
  'Community': 'community',
  'Trends': 'trends'
};

export default function UnifiedCommandBar({ map, activeTab, onTabChange }: UnifiedCommandBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, signOut } = useAuth();
  const [inletDropdownOpen, setInletDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { selectedInletId, setSelectedInletId } = useAppState();
  const [locationEnabled, setLocationEnabled] = useState(true);
  
  // Get current mode from URL
  const currentMode = searchParams.get('mode') || 'analysis';
  
  // Find current tab based on mode
  const currentTab = Object.entries(TAB_MODES).find(([_, mode]) => mode === currentMode)?.[0] || 'Analysis';
  
  useEffect(() => {
    // Check location permission status from localStorage (set by welcome screen)
    const checkLocationPermission = () => {
      const permission = localStorage.getItem('abfi_location_permission');
      setLocationEnabled(permission === 'granted');
    };
    
    checkLocationPermission();
    
    // Listen for permission changes
    const handlePermissionChange = () => checkLocationPermission();
    window.addEventListener('storage', handlePermissionChange);
    
    return () => {
      window.removeEventListener('storage', handlePermissionChange);
    };
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setInletDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInletChange = (inletId: string) => {
    setSelectedInletId(inletId);
    setInletDropdownOpen(false);
    
    // Get the selected inlet
    const inlet = inlets.find(i => i.id === inletId);
    if (inlet && map) {
      // Zoom to inlet
      map.flyTo({
        center: inlet.center,
        zoom: inlet.zoom,
        duration: 2000
      });
    }
  };

  const handleTabClick = (tab: string) => {
    const mode = TAB_MODES[tab as keyof typeof TAB_MODES];
    if (mode) {
      // Use router.push to change the mode
      router.push(`/legendary?mode=${mode}`);
      
      // Also call the callback if provided
      if (onTabChange) {
        onTabChange(tab);
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const selectedInlet = inlets.find(i => i.id === selectedInletId);

  return (
    <>
      {/* Main Command Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-gray-950 via-gray-900/95 to-gray-900/90 backdrop-blur-lg border-b border-cyan-500/20">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo & Navigation */}
            <div className="flex items-center h-full">
              {/* Logo */}
              <div className="px-6 flex items-center gap-2 border-r border-cyan-500/10 h-full">
                <Anchor className="w-5 h-5 text-cyan-400" />
                <div className="flex flex-col">
                  <div className="text-xs font-bold text-cyan-100"
                       style={{ 
                         textShadow: '0 0 20px rgba(0, 200, 255, 0.5)',
                         letterSpacing: '0.15em'
                       }}>
                    ALWAYS BENT
                  </div>
                  <div className="text-[10px] text-cyan-400/70 tracking-widest uppercase">
                    Command Bridge
                  </div>
                </div>
              </div>
              
              {/* Mode Tabs */}
              <div className="flex h-full">
                {Object.keys(TAB_MODES).map((tab) => {
                  const isActive = tab === currentTab;
                  const Icon = tab === 'Analysis' ? MapPin : 
                              tab === 'Tracking' ? Navigation : 
                              tab === 'Community' ? Users : 
                              TrendingUp;
                  
                  return (
                    <button
                      key={tab}
                      onClick={() => handleTabClick(tab)}
                      className={`
                        px-6 h-full flex items-center gap-2 transition-all relative
                        ${isActive 
                          ? 'bg-cyan-500/10 text-cyan-300 border-b-2 border-cyan-400' 
                          : 'text-cyan-100/70 hover:bg-cyan-500/5 hover:text-cyan-300'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab}</span>
                      {isActive && (
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Section - Info & User */}
            <div className="flex items-center h-full">
              {/* Boat & Inlet Info */}
              <div className="flex items-center gap-4 px-4 border-r border-cyan-500/10">
                {/* Captain & Vessel Info - Using Supabase profile */}
                {profile && (
                  <div className="flex flex-col">
                    <div className="text-xs text-cyan-100/80">
                      Captain: <span className="text-cyan-300 font-semibold">{profile.captain_name || 'Unknown'}</span>
                    </div>
                    <div className="text-xs text-cyan-100/80">
                      F/V <span className="text-cyan-300 font-semibold">{profile.boat_name || 'Unnamed'}</span>
                    </div>
                  </div>
                )}
                
                {/* Inlet Selector */}
                {currentMode === 'analysis' && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setInletDropdownOpen(!inletDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-all"
                    >
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs text-cyan-300 font-medium">
                        {selectedInlet?.name || 'Select Inlet'}
                      </span>
                    </button>
                    
                    {/* Inlet Dropdown */}
                    {inletDropdownOpen && (
                      <div className="absolute top-full mt-2 right-0 w-64 bg-gray-900/95 backdrop-blur-lg border border-cyan-500/30 rounded-lg shadow-xl overflow-hidden">
                        <div className="p-2 border-b border-cyan-500/20">
                          <div className="text-xs text-cyan-400 font-medium uppercase tracking-wider">Select Fishing Area</div>
                        </div>
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                          {inlets.map(inlet => (
                            <button
                              key={inlet.id}
                              onClick={() => handleInletChange(inlet.id)}
                              className={`
                                w-full px-3 py-2 text-left hover:bg-cyan-500/10 transition-colors
                                ${selectedInletId === inlet.id ? 'bg-cyan-500/20' : ''}
                              `}
                            >
                              <div className="text-sm text-cyan-100">{inlet.name}</div>
                              <div className="text-xs text-cyan-100/50">{inlet.state}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Location Status */}
              {currentMode === 'tracking' && (
                <div className="px-4 border-r border-cyan-500/10">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    locationEnabled ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      locationEnabled ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    }`} />
                    <span className={`text-xs font-medium ${
                      locationEnabled ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {locationEnabled ? 'GPS Active' : 'GPS Off'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* User Info & Logout */}
              <div className="flex items-center gap-3 px-4 border-l border-cyan-500/10">
                <div className="text-xs text-cyan-100/70">
                  {profile?.captain_name || user?.email?.split('@')[0]}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Spacer to push content below command bar */}
      <div className="h-16" />
    </>
  );
}
