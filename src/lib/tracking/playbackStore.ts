import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface PlaybackPosition {
  timestamp: string;
  lat: number;
  lon: number;
}

export interface VesselPlaybackData {
  vessel_id: string;
  inlet_id?: string;
  positions: PlaybackPosition[];
  startTime: Date;
  endTime: Date;
}

export interface PlaybackState {
  // Vessel data
  vessels: VesselPlaybackData[];
  selectedVesselIds: string[];

  // Playback state
  isPlaying: boolean;
  playbackSpeed: number; // 1x, 2x, 4x, 8x
  currentTime: Date | null;

  // Time range
  startTime: Date | null;
  endTime: Date | null;

  // Actions
  loadVesselHistory: (vesselId: string, inletId: string | undefined, hours: number) => Promise<void>;
  clearVesselHistory: (vesselId: string) => void;
  clearAllHistory: () => void;
  toggleVesselSelection: (vesselId: string) => void;
  selectVessel: (vesselId: string) => void;
  deselectVessel: (vesselId: string) => void;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setCurrentTime: (time: Date) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;

  // Computed
  getCurrentPositions: () => Map<string, PlaybackPosition>;
}

const initialState = {
  vessels: [] as VesselPlaybackData[],
  selectedVesselIds: [] as string[],
  isPlaying: false,
  playbackSpeed: 1,
  currentTime: null,
  startTime: null,
  endTime: null,
};

export const usePlaybackStore = create<PlaybackState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    loadVesselHistory: async (vesselId: string, inletId: string | undefined, hours: number) => {
      try {
        const response = await fetch(`/api/fleet/trail?vessel_id=${vesselId}&hours=${hours}`);
        if (!response.ok) {
          console.error('Failed to fetch vessel trail:', response.statusText);
          return;
        }

        const data = await response.json();

        if (!data.points || data.points.length === 0) {
          console.warn(`No position data for vessel ${vesselId}`);
          return;
        }

        const positions: PlaybackPosition[] = data.points.map((p: any) => ({
          timestamp: p.t,
          lat: p.lat,
          lon: p.lon,
        }));

        const vesselData: VesselPlaybackData = {
          vessel_id: vesselId,
          inlet_id: inletId,
          positions,
          startTime: new Date(positions[0].timestamp),
          endTime: new Date(positions[positions.length - 1].timestamp),
        };

        set(state => {
          // Remove existing vessel data if present
          const filtered = state.vessels.filter(v => v.vessel_id !== vesselId);
          const newVessels = [...filtered, vesselData];

          // Update global time range
          const allStarts = newVessels.map(v => v.startTime);
          const allEnds = newVessels.map(v => v.endTime);
          const globalStart = new Date(Math.min(...allStarts.map(d => d.getTime())));
          const globalEnd = new Date(Math.max(...allEnds.map(d => d.getTime())));

          return {
            vessels: newVessels,
            startTime: globalStart,
            endTime: globalEnd,
            currentTime: state.currentTime || globalStart,
          };
        });
      } catch (error) {
        console.error('Error loading vessel history:', error);
      }
    },

    clearVesselHistory: (vesselId: string) => {
      set(state => {
        const filtered = state.vessels.filter(v => v.vessel_id !== vesselId);
        const filteredSelected = state.selectedVesselIds.filter(id => id !== vesselId);

        // Recalculate time range
        if (filtered.length > 0) {
          const allStarts = filtered.map(v => v.startTime);
          const allEnds = filtered.map(v => v.endTime);
          const globalStart = new Date(Math.min(...allStarts.map(d => d.getTime())));
          const globalEnd = new Date(Math.max(...allEnds.map(d => d.getTime())));

          return {
            vessels: filtered,
            selectedVesselIds: filteredSelected,
            startTime: globalStart,
            endTime: globalEnd,
          };
        } else {
          return {
            vessels: [],
            selectedVesselIds: [],
            startTime: null,
            endTime: null,
            currentTime: null,
            isPlaying: false,
          };
        }
      });
    },

    clearAllHistory: () => {
      set({
        vessels: [],
        selectedVesselIds: [],
        startTime: null,
        endTime: null,
        currentTime: null,
        isPlaying: false,
      });
    },

    toggleVesselSelection: (vesselId: string) => {
      set(state => {
        const isSelected = state.selectedVesselIds.includes(vesselId);
        return {
          selectedVesselIds: isSelected
            ? state.selectedVesselIds.filter(id => id !== vesselId)
            : [...state.selectedVesselIds, vesselId],
        };
      });
    },

    selectVessel: (vesselId: string) => {
      set(state => {
        if (!state.selectedVesselIds.includes(vesselId)) {
          return { selectedVesselIds: [...state.selectedVesselIds, vesselId] };
        }
        return state;
      });
    },

    deselectVessel: (vesselId: string) => {
      set(state => ({
        selectedVesselIds: state.selectedVesselIds.filter(id => id !== vesselId),
      }));
    },

    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    togglePlay: () => set(state => ({ isPlaying: !state.isPlaying })),

    setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),

    setCurrentTime: (time: Date) => {
      const { startTime, endTime } = get();
      if (!startTime || !endTime) return;

      // Clamp time to valid range
      const clampedTime = new Date(Math.max(
        startTime.getTime(),
        Math.min(endTime.getTime(), time.getTime())
      ));

      set({ currentTime: clampedTime });
    },

    jumpToStart: () => {
      const { startTime } = get();
      if (startTime) {
        set({ currentTime: startTime, isPlaying: false });
      }
    },

    jumpToEnd: () => {
      const { endTime } = get();
      if (endTime) {
        set({ currentTime: endTime, isPlaying: false });
      }
    },

    getCurrentPositions: () => {
      const { vessels, selectedVesselIds, currentTime } = get();
      const positions = new Map<string, PlaybackPosition>();

      if (!currentTime) return positions;

      const targetTime = currentTime.getTime();

      // For each selected vessel, find the position at current time
      selectedVesselIds.forEach(vesselId => {
        const vessel = vessels.find(v => v.vessel_id === vesselId);
        if (!vessel || vessel.positions.length === 0) return;

        // Binary search for the position closest to current time (but not after)
        let closestIndex = 0;
        let closestDiff = Infinity;

        for (let i = 0; i < vessel.positions.length; i++) {
          const posTime = new Date(vessel.positions[i].timestamp).getTime();
          const diff = targetTime - posTime;

          if (diff >= 0 && diff < closestDiff) {
            closestDiff = diff;
            closestIndex = i;
          }

          // Stop searching if we've gone past the target time
          if (posTime > targetTime) break;
        }

        positions.set(vesselId, vessel.positions[closestIndex]);
      });

      return positions;
    },
  }))
);

// Playback animation loop
let playbackInterval: NodeJS.Timeout | null = null;

// Subscribe to isPlaying changes to start/stop animation
usePlaybackStore.subscribe(
  state => state.isPlaying,
  (isPlaying) => {
    if (isPlaying) {
      // Start playback loop
      playbackInterval = setInterval(() => {
        const { currentTime, endTime, playbackSpeed, setCurrentTime, pause } = usePlaybackStore.getState();

        if (!currentTime || !endTime) {
          pause();
          return;
        }

        // Advance time by 1 second * playback speed
        const newTime = new Date(currentTime.getTime() + (1000 * playbackSpeed));

        // Check if we've reached the end
        if (newTime >= endTime) {
          setCurrentTime(endTime);
          pause();
        } else {
          setCurrentTime(newTime);
        }
      }, 1000); // Update every second
    } else {
      // Stop playback loop
      if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
      }
    }
  }
);
