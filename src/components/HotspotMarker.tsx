"use client";
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface HotspotMarkerProps {
  map: mapboxgl.Map | null;
  position: [number, number] | null;
  visible: boolean;
  onClick?: () => void;
}

export default function HotspotMarker({ map, position, visible, onClick }: HotspotMarkerProps) {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!map || !position || !visible) {
      // Remove marker if conditions not met
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    // Create the pulsing indigo dot element
    const el = document.createElement('div');
    el.className = 'hotspot-marker';
    el.title = 'Click to see analysis';
    el.innerHTML = `
      <div class="pulse-ring"></div>
      <div class="pulse-ring delay-1"></div>
      <div class="pulse-ring delay-2"></div>
      <div class="pulse-dot"></div>
      <div class="hotspot-tooltip">Click for analysis</div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .hotspot-marker {
        position: relative;
        width: 40px;
        height: 40px;
        cursor: pointer;
      }
      
      .hotspot-tooltip {
        position: absolute;
        bottom: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: #3b82f6;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .hotspot-marker:hover .hotspot-tooltip {
        opacity: 1;
      }
      
      .pulse-dot {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        background: radial-gradient(circle, #64748b, #94a3b8);
        border-radius: 50%;
        box-shadow: 
          0 0 20px rgba(100, 116, 139, 0.8),
          0 0 40px rgba(148, 163, 184, 0.5),
          inset 0 0 10px rgba(255, 255, 255, 0.3);
        animation: pulse-glow 2s ease-in-out infinite;
        z-index: 4;
      }
      
      .pulse-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        border: 2px solid rgba(100, 116, 139, 0.8);
        border-radius: 50%;
        animation: pulse-expand 3s ease-out infinite;
        opacity: 0;
      }
      
      .pulse-ring.delay-1 {
        animation-delay: 1s;
      }
      
      .pulse-ring.delay-2 {
        animation-delay: 2s;
      }
      
      @keyframes pulse-glow {
        0%, 100% {
          transform: translate(-50%, -50%) scale(1);
          box-shadow: 
            0 0 20px rgba(100, 116, 139, 0.8),
            0 0 40px rgba(148, 163, 184, 0.5),
            inset 0 0 10px rgba(255, 255, 255, 0.3);
        }
        50% {
          transform: translate(-50%, -50%) scale(1.2);
          box-shadow: 
            0 0 30px rgba(100, 116, 139, 1),
            0 0 60px rgba(148, 163, 184, 0.7),
            inset 0 0 15px rgba(255, 255, 255, 0.5);
        }
      }
      
      @keyframes pulse-expand {
        0% {
          width: 20px;
          height: 20px;
          opacity: 0.8;
        }
        100% {
          width: 60px;
          height: 60px;
          opacity: 0;
        }
      }
    `;
    
    // Only add style once
    if (!document.querySelector('#hotspot-styles')) {
      style.id = 'hotspot-styles';
      document.head.appendChild(style);
    }

    // Create and add the marker
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat(position)
      .addTo(map);

    markerRef.current = marker;

    // Add click handler for the hotspot
    el.addEventListener('click', () => {
      console.log('🎯 Hotspot clicked at:', position);
      // Add extra pulse on click
      el.classList.add('hotspot-clicked');
      setTimeout(() => el.classList.remove('hotspot-clicked'), 500);
      
      // Call the onClick callback if provided
      if (onClick) {
        onClick();
      }
    });

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map, position, visible, onClick]);

  return null;
}
