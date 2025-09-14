import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface VesselPosition {
  id: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: Date;
  type: 'user' | 'fleet' | 'commercial';
}

export interface TrackingState {
  // State
  mode: 'individual' | 'fleet' | 'commercial';
  isTracking: boolean;
  isPaused: boolean;
  
  // User vessel
  userVessel: VesselPosition | null;
  userTrail: VesselPosition[];
  
  // Nearby vessels
  nearbyVessels: VesselPosition[];
  
  // Metrics
  tripStartTime: Date | null;
  tripDistance: number;
  maxSpeed: number;
  avgSpeed: number;
  
  // Actions
  setMode: (mode: 'individual' | 'fleet' | 'commercial') => void;
  startTracking: () => void;
  stopTracking: () => void;
  pauseTracking: () => void;
  resumeTracking: () => void;
  updateUserPosition: (position: Partial<VesselPosition>) => void;
  addTrailPoint: (position: VesselPosition) => void;
  updateNearbyVessels: (vessels: VesselPosition[]) => void;
  updateMetrics: (metrics: Partial<TrackingState>) => void;
  reset: () => void;
}

const initialState = {
  mode: 'individual' as const,
  isTracking: false,
  isPaused: false,
  userVessel: null,
  userTrail: [],
  nearbyVessels: [],
  tripStartTime: null,
  tripDistance: 0,
  maxSpeed: 0,
  avgSpeed: 0,
};

export const useTrackingStore = create<TrackingState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    setMode: (mode) => set({ mode }),
    
    startTracking: () => {
      set({ 
        isTracking: true, 
        isPaused: false,
        tripStartTime: new Date(),
        userTrail: [],
        tripDistance: 0,
        maxSpeed: 0
      });
      
      // Start position tracking
      if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { updateUserPosition, addTrailPoint } = get();
            const newPosition: VesselPosition = {
              id: 'user',
              name: localStorage.getItem('abfi_boat_name') || 'My Vessel',
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              speed: position.coords.speed || 0,
              heading: position.coords.heading || 0,
              timestamp: new Date(),
              type: 'user'
            };
            
            updateUserPosition(newPosition);
            addTrailPoint(newPosition);
          },
          (error) => console.error('GPS Error:', error),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
        
        // Store watchId for cleanup
        (window as any).__trackingWatchId = watchId;
      }
    },
    
    stopTracking: () => {
      // Clear GPS watch
      if ((window as any).__trackingWatchId) {
        navigator.geolocation.clearWatch((window as any).__trackingWatchId);
        delete (window as any).__trackingWatchId;
      }
      
      set({ isTracking: false, isPaused: false });
    },
    
    pauseTracking: () => set({ isPaused: true }),
    resumeTracking: () => set({ isPaused: false }),
    
    updateUserPosition: (position) => {
      const currentVessel = get().userVessel;
      set({ 
        userVessel: currentVessel 
          ? { ...currentVessel, ...position }
          : position as VesselPosition
      });
    },
    
    addTrailPoint: (position) => {
      const trail = get().userTrail;
      const lastPoint = trail[trail.length - 1];
      
      // Calculate distance if we have a previous point
      if (lastPoint) {
        const distance = calculateDistance(
          lastPoint.lat, lastPoint.lng,
          position.lat, position.lng
        );
        
        const currentDistance = get().tripDistance;
        const currentMax = get().maxSpeed;
        
        set({ 
          userTrail: [...trail, position],
          tripDistance: currentDistance + distance,
          maxSpeed: Math.max(currentMax, position.speed)
        });
      } else {
        set({ userTrail: [position] });
      }
    },
    
    updateNearbyVessels: (vessels) => set({ nearbyVessels: vessels }),
    
    updateMetrics: (metrics) => set(metrics),
    
    reset: () => set(initialState),
  }))
);

// Helper function
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
