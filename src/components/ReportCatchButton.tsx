"use client";
import { useState, useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';

interface ReportCatchButtonProps {
  map?: mapboxgl.Map | null;
  boatName?: string;
  inlet?: string;
  disabled?: boolean;
}

export default function ReportCatchButton({ map, boatName, inlet, disabled }: ReportCatchButtonProps) {
  const [isReporting, setIsReporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  
  useEffect(() => {
    // Check if location services are enabled
    const enabled = localStorage.getItem('abfi_location_enabled') === 'true';
    setLocationEnabled(enabled);
  }, []);
  
  const handleReportCatch = async () => {
    if (!locationEnabled) {
      alert('Enable location services to report catches and contribute to community intelligence!');
      return;
    }
    
    if (!map) {
      console.error('Map not available');
      return;
    }
    
    setIsReporting(true);
    
    try {
      // Get current location
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('🎣 FISH ON! Location:', latitude, longitude);
          
          // Get current map center (in case GPS is off)
          const mapCenter = map.getCenter();
          const finalLat = latitude || mapCenter.lat;
          const finalLng = longitude || mapCenter.lng;
          
          // Get current conditions at this spot
          const catchData = {
            boat_name: boatName || localStorage.getItem('abfi_boat_name'),
            inlet: inlet || localStorage.getItem('abfi_current_inlet'),
            location: {
              lat: finalLat,
              lng: finalLng
            },
            timestamp: new Date().toISOString(),
            
            // Water conditions at catch location
            conditions: {
              // TODO: Extract real SST/CHL from map tiles at this location
              sst_temp: 74.5, // Mock for now
              chl_level: 0.3, // Mock for now
              time_of_day: new Date().getHours() < 12 ? 'morning' : 
                          new Date().getHours() < 17 ? 'afternoon' : 'evening',
              
              // Get current layer visibility
              layers_active: {
                sst: map.getLayer('sst-lyr') && 
                     map.getLayoutProperty('sst-lyr', 'visibility') === 'visible',
                chl: map.getLayer('chl-lyr') && 
                     map.getLayoutProperty('chl-lyr', 'visibility') === 'visible',
                ocean: map.getLayer('ocean-layer') && 
                       map.getLayoutProperty('ocean-layer', 'visibility') === 'visible'
              }
            }
          };
          
          console.log('📊 Catch report data:', catchData);
          
          // TODO: Save to Supabase
          // For now, just store locally
          const catches = JSON.parse(localStorage.getItem('abfi_catches') || '[]');
          catches.push(catchData);
          localStorage.setItem('abfi_catches', JSON.stringify(catches));
          
          // Add a temporary marker on the map
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
          
          // Add CSS animation
          const style = document.createElement('style');
          style.textContent = `
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.8; }
              100% { transform: scale(1); opacity: 1; }
            }
          `;
          document.head.appendChild(style);
          
          const marker = new (window as any).mapboxgl.Marker(el)
            .setLngLat([finalLng, finalLat])
            .addTo(map);
          
          // Remove marker after 10 seconds
          setTimeout(() => {
            marker.remove();
          }, 10000);
          
          // Show success message
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
          }, 3000);
          
          console.log('✅ Catch reported successfully!');
          console.log('🧠 This data will train the AI to predict future hotspots');
          
        },
        (error) => {
          console.error('📍 Location error:', error);
          alert('Could not get your location. Make sure GPS is enabled.');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('Error reporting catch:', error);
      alert('Failed to report catch. Please try again.');
    } finally {
      setIsReporting(false);
    }
  };
  
  // Don't show button if disabled or location is disabled
  if (disabled || !locationEnabled) {
    return null;
  }
  
  return (
    <>
      {/* Report Catch Button */}
      <button
        onClick={handleReportCatch}
        disabled={isReporting}
        className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold shadow-2xl transition-all hover:scale-105 z-30 ${
          isReporting 
            ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
            : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-400 hover:to-orange-400'
        }`}
        style={{
          boxShadow: '0 10px 40px rgba(255, 193, 7, 0.4)'
        }}
      >
        {isReporting ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span> Reporting...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="text-2xl">🎣</span> REPORT CATCH!
          </span>
        )}
      </button>
      
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-green-500/90 to-cyan-500/90 text-white px-8 py-6 rounded-2xl shadow-2xl z-50 animate-bounce">
          <div className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-xl font-bold">FISH ON!</div>
            <div className="text-sm mt-2">Catch reported to ABFI Intelligence</div>
            <div className="text-xs mt-1 opacity-80">Your data helps predict future hotspots</div>
          </div>
        </div>
      )}
    </>
  );
}