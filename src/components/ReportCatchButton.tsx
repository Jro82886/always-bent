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
      {/* ONE TAP BITE BUTTON */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-30 group">
        <button
          onClick={handleReportCatch}
          className="px-8 py-4 rounded-full font-bold shadow-2xl transition-all hover:scale-110 active:scale-95 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 text-white hover:from-cyan-400 hover:via-blue-400 hover:to-cyan-400"
          style={{
            boxShadow: '0 10px 40px rgba(0, 200, 255, 0.4)',
            animation: 'subtle-pulse 3s infinite'
          }}
        >
          <span className="flex items-center gap-2">
            <span className="text-3xl">🎣</span> 
            <span className="text-xl">BITE!</span>
          </span>
        </button>
        
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64">
          <div className="bg-black/90 text-white text-sm rounded-lg px-4 py-3">
            <div className="font-bold mb-1 text-yellow-300">Quick Log Fish Activity!</div>
            <div className="text-xs leading-relaxed">
              Got a bite? Fish on? Even a nibble? Tap this to instantly log the activity at your current location. 
              Every data point helps our AI predict future hotspots. No forms, just fishing! 🎣
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-black/90"></div>
          </div>
        </div>
      </div>
      
      {/* Add subtle pulse animation */}
      <style jsx>{`
        @keyframes subtle-pulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
        }
      `}</style>
    </>
  );
}