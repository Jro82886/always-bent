import { create } from 'zustand';

interface UserLocation {
  lat: number;
  lon: number;
  accuracy?: number;
  updatedAt: number;
}

interface AppState {
  // Existing state
  selectedInletId: string | null;
  isoDate: string | null;
  user: { id: string } | null;
  
  // Legacy state (for compatibility)
  activeRaster: 'sst' | 'chl' | 'abfi' | null;
  username: string | null;
  communityBadge: number;
  hydrateOnce: () => void;
  
  // Setters for existing state
  setSelectedInletId: (id: string | null) => void;
  setIsoDate: (date: string | null) => void;
  setUser: (user: { id: string } | null) => void;
  
  // Legacy setters
  setActiveRaster: (raster: 'sst' | 'chl' | 'abfi' | null) => void;
  setUsername: (username: string | null) => void;
  setCommunityBadge: (badge: number) => void;
  
  // User vessel location state
  userLoc?: UserLocation;
  userLocStatus: 'idle' | 'requesting' | 'active' | 'denied' | 'error';
  setUserLoc: (loc?: UserLocation) => void;
  setUserLocStatus: (status: 'idle' | 'requesting' | 'active' | 'denied' | 'error') => void;
  
  // Inlet restriction flags
  restrictToInlet: boolean;
  restrictOverride?: boolean | null;
  setRestrictOverride: (v: boolean | null) => void;
  
  // Vessel tracks state
  myTracksEnabled: boolean;
  myTrackCoords: Array<[number, number, number]>; // [lon, lat, timestamp]
  fleetTracksEnabled: boolean;
  gfwTracksEnabled: boolean;
  
  // Track setters
  setMyTracksEnabled: (v: boolean) => void;
  setFleetTracksEnabled: (v: boolean) => void;
  setGfwTracksEnabled: (v: boolean) => void;
  appendMyTrack: (lon: number, lat: number) => void;
  clearMyTrack: () => void;
  
  // Analysis state
  analysis: {
    preZoomCamera: null | { center:[number,number]; zoom:number; bearing:number; pitch:number };
    lastSnipPolygon: GeoJSON.Polygon | null;
    lastSnipBBox: [number, number, number, number] | null;
    lastSnipCenter: null | { lat:number; lon:number };
    pendingAnalysis: import('@/lib/analysis/types').SnipAnalysis | null;
    isZoomingToSnip: boolean;
    showReviewCta: boolean;
  };
}

// Initialize restriction from env or localStorage
const initialRestrict = process.env.NEXT_PUBLIC_FLAG_USER_LOCATION_RESTRICT_TO_INLET === 'true';
const storedOverride = typeof window !== 'undefined' 
  ? JSON.parse(localStorage.getItem('restrictOverride') ?? 'null')
  : null;

export const useAppState = create<AppState>((set, get) => ({
  // Existing state
  selectedInletId: null,
  isoDate: new Date().toISOString().split('T')[0],
  user: typeof window !== 'undefined' ? (() => {
    // Get or create anonymous user for chat
    const LOCAL_UID_KEY = 'abfi_anon_uid';
    let id = localStorage.getItem(LOCAL_UID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(LOCAL_UID_KEY, id);
    }
    return { id, name: 'Guest' };
  })() : null,
  
  // Legacy state (temporary for compatibility)
  activeRaster: null,
  username: null,
  communityBadge: 0,
  hydrateOnce: () => {},  // no-op function for legacy compatibility
  
  // Setters for existing state
  setSelectedInletId: (id) => set({ selectedInletId: id }),
  setIsoDate: (date) => set({ isoDate: date }),
  setUser: (user) => set({ user }),
  
  // Legacy setters
  setActiveRaster: (raster) => set({ activeRaster: raster }),
  setUsername: (username) => set({ username }),
  setCommunityBadge: (badge) => set({ communityBadge: badge }),
  
  // User vessel location
  userLoc: undefined,
  userLocStatus: 'idle',
  setUserLoc: (loc) => set({ userLoc: loc }),
  setUserLocStatus: (status) => set({ userLocStatus: status }),
  
  // Inlet restriction
  restrictToInlet: storedOverride ?? initialRestrict,
  restrictOverride: storedOverride,
  setRestrictOverride: (v) => {
    if (typeof window === 'undefined') return;
    
    if (v === null) {
      localStorage.removeItem('restrictOverride');
      set({ restrictOverride: null, restrictToInlet: initialRestrict });
    } else {
      localStorage.setItem('restrictOverride', JSON.stringify(v));
      set({ restrictOverride: v, restrictToInlet: v });
    }
  },
  
  // Vessel tracks
  myTracksEnabled: false,
  myTrackCoords: [],
  fleetTracksEnabled: false,
  gfwTracksEnabled: false,
  
  setMyTracksEnabled: (v) => set({ myTracksEnabled: v }),
  setFleetTracksEnabled: (v) => set({ fleetTracksEnabled: v }),
  setGfwTracksEnabled: (v) => set({ gfwTracksEnabled: v }),
  
  appendMyTrack: (lon, lat) => set((state) => {
    const ts = Date.now();
    const newCoords = [...state.myTrackCoords, [lon, lat, ts] as [number, number, number]];
    // Keep only last 24h @ 30s intervals ≈ 2880 points
    return { myTrackCoords: newCoords.slice(-2880) };
  }),
  
  clearMyTrack: () => set({ myTrackCoords: [] }),
  
  // Analysis state
  analysis: {
    preZoomCamera: null as null | { center:[number,number]; zoom:number; bearing:number; pitch:number },
    lastSnipPolygon: null as GeoJSON.Polygon | null,
    lastSnipBBox: null as [number, number, number, number] | null,
    lastSnipCenter: null as null | { lat:number; lon:number },
    pendingAnalysis: null as import('@/lib/analysis/types').SnipAnalysis | null,
    isZoomingToSnip: false,
    showReviewCta: false,
  },
}));