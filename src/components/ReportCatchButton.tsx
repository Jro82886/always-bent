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
      alert('Enable location services to report catches and contribute to community intelligence!');
      return;
    }
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setShowForm(true);
        },
        (error) => {
          console.error('Location error:', error);
          // Use map center as fallback
          if (map) {
            const center = map.getCenter();
            setCurrentLocation({
              lat: center.lat,
              lng: center.lng
            });
          }
          setShowForm(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      // Use map center as fallback
      if (map) {
        const center = map.getCenter();
        setCurrentLocation({
          lat: center.lat,
          lng: center.lng
        });
      }
      setShowForm(true);
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
      {/* Report Activity Button */}
      <button
        onClick={handleReportCatch}
        className="fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold shadow-2xl transition-all hover:scale-105 z-30 bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-400 hover:to-orange-400"
        style={{
          boxShadow: '0 10px 40px rgba(255, 193, 7, 0.4)'
        }}
      >
        <span className="flex items-center gap-2">
          <span className="text-2xl">🎣</span> FISH ACTIVITY!
        </span>
      </button>
    </>
  );
}