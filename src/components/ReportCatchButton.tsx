"use client";
import { useState, useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';
import CatchReportForm from './CatchReportForm';

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
  
  useEffect(() => {
    // Check if location services are enabled
    const enabled = localStorage.getItem('abfi_location_enabled') === 'true';
    setLocationEnabled(enabled);
  }, []);
  
  const handleReportCatch = () => {
    if (!locationEnabled) {
      alert('Enable location services to report bites and contribute to community intelligence!');
      return;
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
      
      // Save to localStorage (later Supabase)
      const bites = JSON.parse(localStorage.getItem('abfi_bites') || '[]');
      bites.push(biteData);
      localStorage.setItem('abfi_bites', JSON.stringify(bites));
      
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
          ">🎣</div>
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
      
      // Success feedback - quick toast, no modal!
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-full shadow-2xl z-50 animate-slide-down';
      toast.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-2xl">🎣</span>
          <div>
            <div class="font-bold">BITE LOGGED!</div>
            <div class="text-xs opacity-90">${location.lat.toFixed(4)}°N, ${Math.abs(location.lng).toFixed(4)}°W</div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => toast.remove(), 3000);
      
      console.log('🎣 Bite logged:', biteData);
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
    console.log('📊 Catch confirmed:', data);
    
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
    
    // Show success toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-600 to-cyan-600 text-white px-8 py-4 rounded-full shadow-2xl z-50 animate-slide-down';
    toast.innerHTML = '✅ Catch logged successfully! Your data helps predict future hotspots 🧠';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 4000);
  };
  
  // Don't show button if disabled or location is disabled
  if (disabled || !locationEnabled) {
    return null;
  }
  
  return (
    <>
      {/* ABFI INTELLIGENCE BUTTON */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-30 group">
        <button
          onClick={handleReportCatch}
          className="relative px-6 py-3 rounded-full transition-all hover:scale-105 active:scale-95 bg-gradient-to-r from-cyan-900/80 to-blue-900/80 backdrop-blur-md border border-cyan-400/50 text-cyan-100 hover:from-cyan-800/90 hover:to-blue-800/90 hover:border-cyan-300/70"
          style={{
            boxShadow: '0 0 25px rgba(0, 200, 255, 0.4), inset 0 0 20px rgba(0, 200, 255, 0.1)',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 700,
            fontSize: '16px',
            letterSpacing: '0.12em'
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