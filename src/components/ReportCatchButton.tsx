"use client";
import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type mapboxgl from 'mapbox-gl';
import CatchReportForm from './CatchReportForm';
import { useAppState } from '@/store/appState';

interface ReportCatchButtonProps {
  map?: mapboxgl.Map | null;
  boatName?: string;
  inlet?: string;
  disabled?: boolean;
}

export default function ReportCatchButton({ map, boatName, inlet, disabled }: ReportCatchButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const { selectedInletId } = useAppState();
  
  useEffect(() => {
    // Check if location services are enabled
    const enabled = localStorage.getItem('abfi_location_enabled') === 'true';
    setLocationEnabled(enabled);
  }, []);
  
  const handleReportCatch = () => {
    console.log('[ABFI] Button clicked! Location enabled:', locationEnabled);
    
    if (!locationEnabled) {
      // Ask user to enable location services
      const enable = confirm('Enable location services to report bites and contribute to community intelligence!\n\nClick OK to enable location tracking.');
      if (enable) {
        localStorage.setItem('abfi_location_enabled', 'true');
        setLocationEnabled(true);
        // Continue with the bite logging
      } else {
        return;
      }
    }
    
    // ONE TAP = INSTANT LOG! No forms, no friction
    const logBite = (location: { lat: number; lng: number }) => {
      // Auto-capture EVERYTHING
      const biteData = {
        boatName: localStorage.getItem('abfi_boat_name') || 'Unknown',
        inlet: localStorage.getItem('abfi_current_inlet') || '',
        activityType: 'bite', // Default to bite for quick logging
        location,
        timestamp: new Date().toISOString(),
        
        // Auto-capture conditions
        conditions: {
          waterTemp: Math.floor(68 + Math.random() * 12), // Will get real data later
          timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                    new Date().getHours() < 17 ? 'afternoon' : 'evening',
          layersActive: {
            sst: map?.getLayer('sst-lyr') && 
                 map.getLayoutProperty('sst-lyr', 'visibility') === 'visible',
            chl: map?.getLayer('chl-lyr') && 
                 map.getLayoutProperty('chl-lyr', 'visibility') === 'visible',
            ocean: map?.getLayer('ocean-layer') && 
                   map.getLayoutProperty('ocean-layer', 'visibility') === 'visible'
          }
        }
      };
      
      // Save to localStorage for local tracking
      const bites = JSON.parse(localStorage.getItem('abfi_bites') || '[]');
      bites.push(biteData);
      localStorage.setItem('abfi_bites', JSON.stringify(bites));
      
      // ALSO save to community reports for collective intelligence
      const communityReports = JSON.parse(localStorage.getItem('abfi_community_reports') || '[]');
      const communityReport = {
        id: `bite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'bite',
        captain: localStorage.getItem('abfi_captain_name') || 'Anonymous',
        vessel: biteData.boatName,
        inlet: biteData.inlet || selectedInletId || 'unknown',
        location: biteData.location,
        timestamp: biteData.timestamp,
        conditions: biteData.conditions,
        visibility: 'public', // All bites are public for community benefit
        verified: false,
        upvotes: 0
      };
      communityReports.unshift(communityReport); // Add to beginning
      // Keep only last 100 reports in localStorage
      if (communityReports.length > 100) {
        communityReports.length = 100;
      }
      localStorage.setItem('abfi_community_reports', JSON.stringify(communityReports));
      
      // Visual feedback - quick marker
      if (map) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            background: radial-gradient(circle, #FFD700, #FFA500);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
            animation: pulse 2s infinite;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          "><span style="filter: brightness(2);">⚡</span></div>
        `;
        
        // Add animation if needed
        if (!document.getElementById('bite-pulse-animation')) {
          const style = document.createElement('style');
          style.id = 'bite-pulse-animation';
          style.textContent = `
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.3); opacity: 0.7; }
            }
          `;
          document.head.appendChild(style);
        }
        
        const marker = new (window as any).mapboxgl.Marker(el)
          .setLngLat([location.lng, location.lat])
          .addTo(map);
        
        // Remove after 2 minutes - allows multiple bites to accumulate visually!
        setTimeout(() => marker.remove(), 120000);
      }
      
      // Success feedback - modern styled confirmation
      const toast = document.createElement('div');
      toast.className = 'fixed top-24 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-slate-800/95 to-blue-900/95 backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-2xl z-[9999] border border-cyan-500/30';
      toast.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3), 0 0 60px rgba(6,182,212,0.2)';
      toast.innerHTML = `
        <div class="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div>
            <div class="font-bold text-cyan-300">BITE LOGGED!</div>
            <div class="text-xs text-cyan-400/70 mt-0.5">${location.lat.toFixed(4)}°N, ${Math.abs(location.lng).toFixed(4)}°W</div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      
      // Add fade out animation before removing
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -10px)';
        setTimeout(() => toast.remove(), 300);
      }, 2500);
      
      console.log('[BITE] Logged:', biteData);
    };
    
    // Get location and log immediately
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          logBite({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // Use map center as fallback
          if (map) {
            const center = map.getCenter();
            logBite({ lat: center.lat, lng: center.lng });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 3000, // Faster timeout
          maximumAge: 0
        }
      );
    } else if (map) {
      // No geolocation, use map center
      const center = map.getCenter();
      logBite({ lat: center.lat, lng: center.lng });
    }
  };
  
  const handleConfirmCatch = (data: any) => {
    console.log('[CATCH] Confirmed:', data);
    
    // Add a temporary marker on the map
    if (map && data.location) {
      const el = document.createElement('div');
      el.className = 'catch-marker';
      el.innerHTML = `
        <div style="
          width: 30px;
          height: 30px;
          background: radial-gradient(circle, #FFD700, #FFA500);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
          animation: pulse 2s infinite;
        ">
          <div style="
            position: absolute;
            top: -5px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 20px;
          ">🎣</div>
        </div>
      `;
      
      // Add CSS animation if not already present
      if (!document.getElementById('catch-pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'catch-pulse-animation';
        style.textContent = `
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }
      
      const marker = new (window as any).mapboxgl.Marker(el)
        .setLngLat([data.location.lng, data.location.lat])
        .addTo(map);
      
      // Remove marker after 10 seconds
      setTimeout(() => {
        marker.remove();
      }, 10000);
    }
    
    // Show detailed success message with bite data
    const currentLat = currentLocation?.lat || 0;
    const currentLng = currentLocation?.lng || 0;
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-emerald-600 via-cyan-600 to-blue-600 text-white px-10 py-6 rounded-2xl shadow-2xl z-[70] animate-slide-down border border-cyan-400/50';
    toast.innerHTML = `
      <div class="text-center">
        <div class="text-2xl font-bold mb-2">🎣 Congratulations! You Got a Bite!</div>
        <div class="text-sm opacity-90 mb-3">Your bite has been recorded to ABFI Intelligence</div>
        <div class="bg-black/20 rounded-lg px-4 py-3 text-xs space-y-1">
          <div class="flex justify-between"><span class="opacity-70">Captain:</span><span class="font-semibold">${localStorage.getItem('abfi_captain_name') || 'Unknown'}</span></div>
          <div class="flex justify-between"><span class="opacity-70">Vessel:</span><span class="font-semibold">${localStorage.getItem('abfi_boat_name') || 'Unknown'}</span></div>
          <div class="flex justify-between"><span class="opacity-70">Location:</span><span class="font-semibold">${currentLat.toFixed(4)}°N, ${Math.abs(currentLng).toFixed(4)}°W</span></div>
          <div class="flex justify-between"><span class="opacity-70">Time:</span><span class="font-semibold">${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span></div>
          <div class="flex justify-between"><span class="opacity-70">Inlet:</span><span class="font-semibold">${localStorage.getItem('abfi_current_inlet') || 'East Coast'}</span></div>
        </div>
        <div class="text-xs mt-3 opacity-80 italic">Contributing to collective ocean intelligence...</div>
      </div>
    `;
    document.body.appendChild(toast);
    
    // Fade out after 5 seconds
    setTimeout(() => {
      toast.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -20px)';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 500);
    }, 5000);
  };
  
  // Don't show button if explicitly disabled
  if (disabled) {
    return null;
  }
  
  return (
    <>
      {/* ABFI INTELLIGENCE BUTTON */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[60] group pointer-events-auto">
        <button
          onClick={handleReportCatch}
          className="relative px-8 py-4 rounded-full transition-all hover:scale-110 active:scale-95 bg-gradient-to-r from-cyan-600 to-blue-600 backdrop-blur-md border-2 border-cyan-400 text-white hover:from-cyan-500 hover:to-blue-500 hover:border-cyan-300 hover:shadow-2xl"
          style={{
            boxShadow: '0 0 40px rgba(0, 200, 255, 0.6), inset 0 0 20px rgba(0, 200, 255, 0.2)',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 800,
            fontSize: '20px',
            letterSpacing: '0.15em',
            // No animation - keep button static
          }}
        >
          <span className="relative flex items-center justify-center">
            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">ABFI</span>
          </span>
        </button>
        
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-72">
          <div className="bg-gradient-to-br from-cyan-950/95 to-blue-950/95 text-white text-sm rounded-lg px-4 py-3 border border-cyan-500/20">
            <div className="font-bold mb-2 text-cyan-300 text-base">🧠 ABFI Intelligence Hub</div>
            <div className="text-xs leading-relaxed mb-2 text-cyan-100/90">
              This is your "BITE" button - tap to instantly log any fish activity at your location. Every bite, nibble, or fish-on contributes to our collective ocean intelligence.
            </div>
            <div className="text-xs text-cyan-400/80 italic">
              Your data trains ABFI to predict future hotspots. The more captains contribute, the smarter we all fish.
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-cyan-950/95 border-r border-b border-cyan-500/20"></div>
          </div>
        </div>
      </div>
      
    </>
  );
}