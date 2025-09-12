"use client";
import { useEffect, useState } from 'react';
import type mapboxgl from 'mapbox-gl';

interface CommunityHotspotsProps {
  map: mapboxgl.Map | null;
  visible: boolean;
}

interface CatchReport {
  boat_name: string;
  inlet: string;
  location: { lat: number; lng: number };
  timestamp: string;
  conditions: {
    sst_temp: number;
    chl_level: number;
    time_of_day: string;
  };
}

export default function CommunityHotspots({ map, visible }: CommunityHotspotsProps) {
  const [catches, setCatches] = useState<CatchReport[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  
  useEffect(() => {
    // Load catches from localStorage (will be Supabase later)
    const loadCatches = () => {
      const stored = localStorage.getItem('abfi_catches');
      if (stored) {
        const catchData = JSON.parse(stored);
        // Only show catches from last 5 days
        const fiveDaysAgo = Date.now() - (5 * 24 * 60 * 60 * 1000);
        const recentCatches = catchData.filter((c: CatchReport) => 
          new Date(c.timestamp).getTime() > fiveDaysAgo
        );
        setCatches(recentCatches);
      }
    };
    
    loadCatches();
    // Refresh every 30 seconds
    const interval = setInterval(loadCatches, 30000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (!map || !visible) {
      // Clear all markers when hidden
      markers.forEach(marker => marker.remove());
      setMarkers([]);
      return;
    }
    
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    
    // Add new markers for each catch
    const newMarkers = catches.map((catchReport, index) => {
      const el = document.createElement('div');
      el.className = 'community-catch-marker';
      
      // Calculate hours ago
      const hoursAgo = Math.floor((Date.now() - new Date(catchReport.timestamp).getTime()) / (1000 * 60 * 60));
      const timeText = hoursAgo < 1 ? 'Just now' : 
                      hoursAgo < 24 ? `${hoursAgo}h ago` : 
                      `${Math.floor(hoursAgo / 24)}d ago`;
      
      el.innerHTML = `
        <div style="
          position: relative;
          width: 40px;
          height: 40px;
        ">
          <div style="
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255, 215, 0, 0.8), rgba(255, 140, 0, 0.6));
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            animation: communityPulse 3s infinite;
          ">
            🎣
          </div>
          <div style="
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: black;
            color: #FFD700;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
            border: 1px solid #FFD700;
          ">
            ${timeText}
          </div>
        </div>
      `;
      
      const popup = new (window as any).mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 10px;">
            <h4 style="margin: 0 0 5px 0; color: #FFD700;">🎣 Community Catch</h4>
            <p style="margin: 5px 0; font-size: 12px;">
              <strong>Time:</strong> ${timeText}<br/>
              <strong>Water Temp:</strong> ${catchReport.conditions.sst_temp}°F<br/>
              <strong>Conditions:</strong> ${catchReport.conditions.time_of_day}
            </p>
            <p style="margin: 5px 0; font-size: 11px; color: #888;">
              Anonymous report from ${catchReport.inlet || 'Unknown'} inlet
            </p>
          </div>
        `);
      
      const marker = new (window as any).mapboxgl.Marker(el)
        .setLngLat([catchReport.location.lng, catchReport.location.lat])
        .setPopup(popup)
        .addTo(map);
      
      return marker;
    });
    
    setMarkers(newMarkers);
    
    // Add animation styles if not already added
    if (!document.getElementById('community-hotspot-styles')) {
      const style = document.createElement('style');
      style.id = 'community-hotspot-styles';
      style.textContent = `
        @keyframes communityPulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.9;
          }
          50% { 
            transform: scale(1.1); 
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Cleanup markers on unmount
      newMarkers.forEach(marker => marker.remove());
    };
  }, [map, visible, catches]);
  
  return null; // This component only manages markers, no UI
}
