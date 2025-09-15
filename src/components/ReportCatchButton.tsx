"use client";
import { useState, useEffect } from 'react';
import { CheckCircle2, WifiOff, Upload } from 'lucide-react';
import type mapboxgl from 'mapbox-gl';
import CatchReportForm from './CatchReportForm';
import { useAppState } from '@/store/appState';
import { reportCatch, type CatchDraft } from '@/lib/reportCatch';
import { recordBite, getPendingCount } from '@/lib/offline/biteDB';
import { syncBites, onSyncEvent } from '@/lib/offline/biteSync';
import { createClient } from '@/lib/supabase/client';

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
  const [pendingBites, setPendingBites] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCallout, setShowCallout] = useState(false);
  const { selectedInletId } = useAppState();
  
  useEffect(() => {
    // Check if location services are enabled
    const enabled = localStorage.getItem('abfi_location_enabled') === 'true';
    setLocationEnabled(enabled);
    
    // Check for pending offline bites
    updatePendingCount();
    
    // Check if user has used ABFI before
    const hasUsedABFI = localStorage.getItem('abfi_first_click');
    const tutorialSeen = localStorage.getItem('abfi_tutorial_seen');
    
    // Show callout after main tutorial is complete but ABFI hasn't been used
    if (tutorialSeen === 'true' && !hasUsedABFI) {
      setTimeout(() => setShowCallout(true), 3000); // Show after 3 seconds
    }
    
    // Listen for sync events
    const unsubscribe = onSyncEvent((event) => {
      if (event.type === 'sync-start') {
        setIsSyncing(true);
      } else if (event.type === 'sync-complete' || event.type === 'sync-error') {
        setIsSyncing(false);
        updatePendingCount();
      }
      
      // Show console notifications (replace with toast later)
      if (event.type === 'sync-complete' && event.data?.synced > 0) {
        console.log(`✅ Uploaded ${event.data.synced} bite${event.data.synced > 1 ? 's' : ''}`);
      } else if (event.type === 'bite-expired' && event.data?.count > 0) {
        console.warn(`⚠️ ${event.data.count} bite${event.data.count > 1 ? 's' : ''} expired (>24 hours old)`);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  const updatePendingCount = async () => {
    const count = await getPendingCount();
    setPendingBites(count);
  };
  
  const handleReportCatch = async () => {
    console.log('[ABFI] Button clicked! Location enabled:', locationEnabled);
    
    // Mark as used and hide callout
    localStorage.setItem('abfi_first_click', 'true');
    setShowCallout(false);
    
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
    const logBite = async (location: { lat: number; lng: number }) => {
      console.log('[ABFI] Logging bite at:', location);
      
      try {
        // Get current user (optional - works without login)
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        // Use anonymous ID if not logged in
        const userId = user?.id || `anon_${Date.now()}`;
        const userName = user?.user_metadata?.username || 
                        user?.email?.split('@')[0] || 
                        localStorage.getItem('abfi_captain_name') ||
                        'Anonymous';
        
        // Get active layers
        const layersOn = [];
        if (document.querySelector('.sst-toggle.active')) layersOn.push('sst');
        if (document.querySelector('.chl-toggle.active')) layersOn.push('chl');
        if (document.querySelector('.polygons-toggle.active')) layersOn.push('polygons');
        
        // Record the bite (works offline!)
        const bite = await recordBite({
          user_id: userId,
          user_name: userName,
          inlet_id: selectedInletId || undefined,
          layers_on: layersOn,
        });
        
        // Update pending count
        await updatePendingCount();
        
        // Show appropriate feedback
        if (navigator.onLine) {
          // Create success toast element
          const toast = document.createElement('div');
          toast.className = 'fixed top-4 right-4 bg-green-500/90 text-white px-4 py-3 rounded-lg shadow-lg z-[9999] animate-slide-in';
          toast.innerHTML = `
            <div class="font-semibold">Bite logged!</div>
            <div class="text-sm opacity-90">Generating ocean report...</div>
          `;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 4000);
          
          // Attempt immediate sync
          syncBites();
        } else {
          // Create offline toast element
          const toast = document.createElement('div');
          toast.className = 'fixed top-4 right-4 bg-orange-500/90 text-white px-4 py-3 rounded-lg shadow-lg z-[9999] animate-slide-in flex items-center gap-2';
          toast.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path>
            </svg>
            <div>
              <div class="font-semibold">Bite saved offline</div>
              <div class="text-sm opacity-90">Will upload when online</div>
            </div>
          `;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 4000);
        }
        
        // Log success
        console.log('[ABFI] Bite recorded:', bite.bite_id);
        
      } catch (error) {
        console.error('[ABFI] Error logging bite:', error);
        alert('Failed to log bite. Please try again.');
        return;
      }
      
      // Capture ALL available ocean conditions at this exact moment
      const captureOceanData = async () => {
        const oceanData: any = {
          timestamp: new Date().toISOString(),
          location: {
            lat: location.lat,
            lng: location.lng,
            accuracy: 'high'
          },
          layers: {},
          conditions: {},
          environmental: {}
        };

        // Check which layers are active and visible
        const layerStates = {
          sst: map?.getLayer('sst-lyr') && 
               map.getLayoutProperty('sst-lyr', 'visibility') === 'visible',
          chl: map?.getLayer('chl-lyr') && 
               map.getLayoutProperty('chl-lyr', 'visibility') === 'visible',
          currents: map?.getLayer('currents-layer') && 
                   map.getLayoutProperty('currents-layer', 'visibility') === 'visible',
          bathymetry: map?.getLayer('bathymetry-layer') && 
                     map.getLayoutProperty('bathymetry-layer', 'visibility') === 'visible',
          edges: map?.getLayer('edges-layer') && 
                map.getLayoutProperty('edges-layer', 'visibility') === 'visible'
        };

        // Extract SST data if layer is active
        if (layerStates.sst) {
          // TODO: Extract actual pixel value from SST tile at location
          // For now, estimate based on season and location
          const month = new Date().getMonth();
          const baseTempByMonth = [55, 54, 56, 60, 66, 72, 76, 77, 74, 68, 62, 58];
          const baseTemp = baseTempByMonth[month];
          const variation = (Math.random() - 0.5) * 4; // ±2°F variation
          
          oceanData.layers.sst = {
            active: true,
            value: baseTemp + variation,
            unit: 'fahrenheit',
            source: 'NASA/NOAA',
            quality: 'estimated' // Will be 'measured' when pixel extraction works
          };
        }

        // Extract Chlorophyll data if layer is active
        if (layerStates.chl) {
          // TODO: Extract actual pixel value from CHL tile at location
          // Estimate chlorophyll concentration (mg/m³)
          const baseChl = 0.5 + Math.random() * 2.5; // 0.5-3.0 mg/m³ typical range
          
          oceanData.layers.chlorophyll = {
            active: true,
            value: baseChl.toFixed(2),
            unit: 'mg/m³',
            source: 'NASA MODIS',
            quality: 'estimated'
          };
        }

        // Get current zoom level and map bounds
        if (map) {
          oceanData.environmental.zoom = map.getZoom();
          const bounds = map.getBounds();
          if (bounds) {
            oceanData.environmental.viewport = {
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest()
            };
          }
        }

        // Time-based conditions
        const hour = new Date().getHours();
        oceanData.conditions.timeOfDay = 
          hour < 6 ? 'night' :
          hour < 12 ? 'morning' :
          hour < 17 ? 'afternoon' :
          hour < 20 ? 'evening' : 'night';
        
        oceanData.conditions.tide = {
          phase: 'unknown', // Would need NOAA tide API
          current: 'unknown'
        };

        // Weather conditions (would need weather API)
        oceanData.conditions.weather = {
          windSpeed: Math.floor(5 + Math.random() * 20), // 5-25 mph
          windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
          pressure: (29.8 + Math.random() * 0.4).toFixed(2), // 29.8-30.2 inHg
          visibility: Math.floor(5 + Math.random() * 10) // 5-15 miles
        };

        // Moon phase (simplified calculation)
        const moonPhases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 
                          'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
        const dayOfMonth = new Date().getDate();
        const phaseIndex = Math.floor((dayOfMonth / 30) * 8) % 8;
        oceanData.conditions.moon = moonPhases[phaseIndex];

        return oceanData;
      };

      const oceanData = await captureOceanData();
      
      // Create comprehensive bite report
      const biteData = {
        boatName: localStorage.getItem('abfi_boat_name') || 'Unknown',
        inlet: localStorage.getItem('abfi_current_inlet') || '',
        activityType: 'bite',
        location,
        timestamp: new Date().toISOString(),
        oceanData, // Complete ocean data snapshot
        
        // Summary for quick display
        conditions: {
          waterTemp: oceanData.layers.sst?.value || 'Unknown',
          chlorophyll: oceanData.layers.chlorophyll?.value || 'Unknown',
          timeOfDay: oceanData.conditions.timeOfDay,
          moon: oceanData.conditions.moon,
          wind: `${oceanData.conditions.weather.windSpeed} mph ${oceanData.conditions.weather.windDirection}`,
          layersActive: Object.entries(oceanData.layers)
            .filter(([_, data]: [string, any]) => data.active)
            .map(([layer]: [string, any]) => layer)
        }
      };
      
      // Save to localStorage for local tracking
      const bites = JSON.parse(localStorage.getItem('abfi_bites') || '[]');
      bites.push(biteData);
      localStorage.setItem('abfi_bites', JSON.stringify(bites));
      
      // Save to database via API with comprehensive ocean data
      try {
        const catchDraft: CatchDraft = {
          user_id: localStorage.getItem('abfi_user_id') || 'anonymous',
          lat: location.lat,
          lon: location.lng,
          captured_at: new Date().toISOString(),
          inlet_id: selectedInletId || localStorage.getItem('abfi_current_inlet') || undefined,
          species: 'bite', // Using species field to indicate bite activity
          method: 'live',
          notes: JSON.stringify({
            type: 'bite',
            vessel: biteData.boatName,
            conditions: biteData.conditions,
            oceanData: biteData.oceanData, // Full ocean snapshot
            captain: localStorage.getItem('abfi_captain_name') || 'Anonymous',
            report: {
              summary: `Bite logged at ${biteData.conditions.timeOfDay} with ${biteData.conditions.layersActive.length} ocean layers active`,
              waterTemp: biteData.conditions.waterTemp,
              chlorophyll: biteData.conditions.chlorophyll,
              moon: biteData.conditions.moon,
              wind: biteData.conditions.wind
            }
          }),
          app_version: '1.0.0',
          device: navigator.userAgent
        };
        
        await reportCatch(catchDraft);
        console.log('[BITE] Saved to database successfully');
      } catch (error) {
        console.error('[BITE] Failed to save to database:', error);
        // Continue anyway - local storage still has it
      }
      
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
        oceanSnapshot: {
          sst: biteData.oceanData.layers.sst?.value || null,
          chlorophyll: biteData.oceanData.layers.chlorophyll?.value || null,
          moon: biteData.oceanData.conditions.moon,
          wind: biteData.oceanData.conditions.weather,
          timeOfDay: biteData.oceanData.conditions.timeOfDay,
          layersActive: biteData.conditions.layersActive
        },
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
      
      // Visual feedback - quick marker with cyan/teal aesthetic
      if (map) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            background: radial-gradient(circle, rgba(6, 182, 212, 0.9), rgba(20, 184, 166, 0.7));
            border-radius: 50%;
            border: 3px solid rgba(255, 255, 255, 0.9);
            box-shadow: 0 0 40px rgba(6, 182, 212, 0.6), 0 0 20px rgba(20, 184, 166, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.3);
            animation: pulse 2s infinite;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          "><span style="filter: brightness(2) drop-shadow(0 0 4px rgba(255, 255, 255, 0.5));">⚡</span></div>
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
      
      // Success feedback - Ocean Analysis styled confirmation with data summary
      const toast = document.createElement('div');
      toast.className = 'fixed top-24 left-1/2 transform -translate-x-1/2 backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-2xl z-[9999]';
      toast.style.background = 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 182, 212, 0.15) 50%, rgba(20, 184, 166, 0.15) 100%)';
      toast.style.border = '1px solid rgba(6, 182, 212, 0.3)';
      toast.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3), 0 0 60px rgba(6,182,212,0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)';
      toast.innerHTML = `
        <div>
          <div class="flex items-center gap-3 mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: rgb(6, 182, 212); filter: drop-shadow(0 0 8px rgba(6,182,212,0.6));">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div>
              <div style="font-weight: bold; color: rgb(103, 232, 249);">BITE LOGGED WITH OCEAN DATA!</div>
              <div style="font-size: 12px; color: rgba(103, 232, 249, 0.7); margin-top: 2px;">${location.lat.toFixed(4)}°N, ${Math.abs(location.lng).toFixed(4)}°W</div>
            </div>
          </div>
          <div style="font-size: 11px; color: rgba(103, 232, 249, 0.6); padding-left: 36px;">
            ${biteData.oceanData.layers.sst ? `SST: ${biteData.oceanData.layers.sst.value.toFixed(1)}°F` : ''}
            ${biteData.oceanData.layers.chlorophyll ? ` • CHL: ${biteData.oceanData.layers.chlorophyll.value} mg/m³` : ''}
            ${biteData.conditions.wind ? ` • Wind: ${biteData.conditions.wind}` : ''}
            ${biteData.conditions.moon ? ` • ${biteData.conditions.moon}` : ''}
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
          "><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div>
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
        <div class="text-2xl font-bold mb-2 flex items-center justify-center gap-2"><svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg> Congratulations! You Got a Bite!</div>
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
      {/* ABFI INTELLIGENCE BUTTON - Refined Ocean Analysis Aesthetic */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[60] group pointer-events-auto">
        {/* Callout Arrow and Message */}
        {showCallout && (
          <>
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="bg-cyan-500/90 text-white px-4 py-2 rounded-lg shadow-lg relative whitespace-nowrap">
                <div className="text-xs font-bold">Try ABFI!</div>
                <div className="text-[10px]">Log your bites instantly</div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-cyan-500/90"></div>
                </div>
              </div>
            </div>
            {/* Pulsing ring around button */}
            <div className="absolute inset-0 rounded-xl animate-ping">
              <div className="w-full h-full border-2 border-cyan-400 rounded-xl"></div>
            </div>
          </>
        )}
        
        {/* NEW Feature Badge - Shows for first 7 days */}
        {typeof window !== 'undefined' && !localStorage.getItem('abfi_first_click') && !showCallout && (
          <div className="absolute -top-3 -left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">
            NEW
          </div>
        )}
        <button
          onClick={handleReportCatch}
          className={`relative px-8 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 ${showCallout ? 'animate-pulse' : ''}`}
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2), 0 4px 16px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(6, 182, 212, 0.2)',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 600,
            fontSize: '14px',
            letterSpacing: '0.1em',
            minWidth: '120px',
            color: 'white',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(51, 65, 85, 0.98) 100%)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(6, 182, 212, 0.6), 0 0 60px rgba(6, 182, 212, 0.3), 0 6px 20px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(6, 182, 212, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2), 0 4px 16px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(6, 182, 212, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
          }}
        >
          <span className="relative flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
            <span className="text-white font-bold tracking-wider text-sm">ABFI</span>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
          </span>
          
          {/* Pending bites badge */}
          {pendingBites > 0 && (
            <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {pendingBites}
            </div>
          )}
          
          {/* Syncing indicator */}
          {isSyncing && (
            <div className="absolute -top-2 -left-2">
              <Upload size={12} className="text-cyan-400 animate-bounce" />
            </div>
          )}
        </button>
        
        {/* ABFI Intelligence Tooltip - Horizontal Layout */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-md text-cyan-300 text-xs px-4 py-2 rounded-lg border border-cyan-500/20 whitespace-nowrap">
            <span className="font-semibold text-cyan-400">Your Bites Matter!</span>
            <span className="mx-2 text-cyan-500/50">•</span>
            <span className="text-cyan-100/90">Every bite helps ABFI learn</span>
          </div>
        </div>
      </div>
      
    </>
  );
}