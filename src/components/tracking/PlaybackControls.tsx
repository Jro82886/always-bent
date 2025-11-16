'use client';

import { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Gauge } from 'lucide-react';
import { usePlaybackStore } from '@/lib/tracking/playbackStore';

export default function PlaybackControls() {
  const {
    vessels,
    selectedVesselIds,
    isPlaying,
    playbackSpeed,
    currentTime,
    startTime,
    endTime,
    togglePlay,
    setPlaybackSpeed,
    setCurrentTime,
    jumpToStart,
    jumpToEnd,
    toggleVesselSelection,
    loadVesselHistory,
    loadTestData,
  } = usePlaybackStore();

  const [sliderValue, setSliderValue] = useState(0);

  // Update slider when currentTime changes
  useEffect(() => {
    if (!currentTime || !startTime || !endTime) {
      setSliderValue(0);
      return;
    }

    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = currentTime.getTime() - startTime.getTime();
    const percentage = (elapsed / totalDuration) * 100;
    setSliderValue(percentage);
  }, [currentTime, startTime, endTime]);

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!startTime || !endTime) return;

    const percentage = parseFloat(e.target.value);
    setSliderValue(percentage);

    const totalDuration = endTime.getTime() - startTime.getTime();
    const newTime = new Date(startTime.getTime() + (totalDuration * percentage / 100));
    setCurrentTime(newTime);
  };

  // Format time for display
  const formatTime = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '--/--/----';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const speedOptions = [1, 2, 4, 8, 16];

  const hasData = vessels.length > 0;

  // Load test vessel data with diverse vessel types
  const handleLoadTestData = () => {
    const now = new Date();
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

    // Helper to generate positions along a path
    // Offshore direction: east means positive longitude change (toward 0 from negative)
    const generatePath = (
      startLat: number,
      startLon: number,
      pattern: 'transit' | 'fishing' | 'drift',
      points: number,
      offsetDirection: { lat: number; lon: number } // Direction to move (offshore)
    ) => {
      const positions = [];
      const startTime = hoursAgo(48);
      const intervalMs = (48 * 60 * 60 * 1000) / points;

      for (let i = 0; i < points; i++) {
        const t = new Date(startTime.getTime() + i * intervalMs);
        const progress = i / points; // 0 to 1

        let lat = startLat;
        let lon = startLon;

        if (pattern === 'transit') {
          // Linear movement offshore
          lat += offsetDirection.lat * progress * 1.0;
          lon += offsetDirection.lon * progress * 1.0;
        } else if (pattern === 'fishing') {
          // Zig-zag pattern (trawling) - move offshore while zig-zagging
          lat += offsetDirection.lat * progress * 0.5 + Math.sin(i * 0.3) * 0.03;
          lon += offsetDirection.lon * progress * 0.5 + Math.cos(i * 0.3) * 0.05;
        } else {
          // Drift pattern (longlining) - slower offshore drift with randomness
          lat += offsetDirection.lat * progress * 0.3 + (Math.random() - 0.5) * 0.01;
          lon += offsetDirection.lon * progress * 0.3 + (Math.random() - 0.5) * 0.02;
        }

        positions.push({
          timestamp: t.toISOString(),
          lat: Number(lat.toFixed(6)),
          lon: Number(lon.toFixed(6)),
        });
      }

      return positions;
    };

    // 1. Charter Boat - Montauk (Transit pattern heading SE offshore)
    const charterBoat = generatePath(
      40.95, -71.85, // Start just offshore of Montauk
      'transit',
      96,
      { lat: -0.3, lon: 0.8 } // Move southeast offshore
    );
    loadTestData({
      vessel_id: 'charter-montauk-1',
      inlet_id: 'ny-montauk',
      positions: charterBoat,
      startTime: new Date(charterBoat[0].timestamp),
      endTime: new Date(charterBoat[charterBoat.length - 1].timestamp),
    });

    // 2. Fleet Boat - Ocean City (Transit pattern heading E offshore)
    const fleetBoat = generatePath(
      38.25, -74.85, // Start offshore of Ocean City
      'transit',
      80,
      { lat: 0.1, lon: 0.9 } // Move east offshore
    );
    loadTestData({
      vessel_id: 'fleet-ocean-city-1',
      inlet_id: 'md-ocean-city',
      positions: fleetBoat,
      startTime: new Date(fleetBoat[0].timestamp),
      endTime: new Date(fleetBoat[fleetBoat.length - 1].timestamp),
    });

    // 3. Commercial Trawler - Shinnecock (Fishing pattern SE offshore)
    const trawler = generatePath(
      40.75, -72.30, // Start offshore of Shinnecock
      'fishing',
      120,
      { lat: -0.4, lon: 0.7 } // Move southeast while fishing
    );
    loadTestData({
      vessel_id: 'gfw-trawler-atlantic-1',
      inlet_id: 'ny-shinnecock',
      positions: trawler,
      startTime: new Date(trawler[0].timestamp),
      endTime: new Date(trawler[trawler.length - 1].timestamp),
    });

    // 4. Commercial Longliner - Manasquan (Drift pattern E offshore)
    const longliner = generatePath(
      40.00, -73.80, // Start offshore of Manasquan
      'drift',
      100,
      { lat: -0.1, lon: 0.8 } // Drift east offshore
    );
    loadTestData({
      vessel_id: 'gfw-longliner-atlantic-2',
      inlet_id: 'nj-manasquan',
      positions: longliner,
      startTime: new Date(longliner[0].timestamp),
      endTime: new Date(longliner[longliner.length - 1].timestamp),
    });

    // 5. Commercial Trawler - Cape Cod (Fishing pattern E offshore)
    const capeCodTrawler = generatePath(
      41.30, -70.00, // Start offshore east of Cape Cod
      'fishing',
      110,
      { lat: 0.2, lon: 0.6 } // Move northeast offshore
    );
    loadTestData({
      vessel_id: 'gfw-trawler-capecod-3',
      positions: capeCodTrawler,
      startTime: new Date(capeCodTrawler[0].timestamp),
      endTime: new Date(capeCodTrawler[capeCodTrawler.length - 1].timestamp),
    });

    // 6. Commercial Longliner - Hatteras (Drift pattern E offshore)
    const hatterasLongliner = generatePath(
      35.10, -75.30, // Start offshore of Hatteras
      'drift',
      90,
      { lat: 0.0, lon: 0.9 } // Drift east offshore
    );
    loadTestData({
      vessel_id: 'gfw-longliner-hatteras-4',
      inlet_id: 'nc-hatteras',
      positions: hatterasLongliner,
      startTime: new Date(hatterasLongliner[0].timestamp),
      endTime: new Date(hatterasLongliner[hatterasLongliner.length - 1].timestamp),
    });
  };

  return (
    <div className="ab-card w-full max-w-2xl">
      <div className="ab-head">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <h3 className="ab-head__title">Historical Playback</h3>
        </div>
      </div>
      <div className="ab-head__underline" />

      {!hasData ? (
        <div className="p-4 space-y-3">
          <div className="text-sm text-slate-400">
            No historical data loaded. Load vessel tracks to enable playback.
          </div>
          <button
            onClick={handleLoadTestData}
            className="w-full px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors"
          >
            Load Test Data (48 hours)
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Vessel Selection */}
          <div className="space-y-2">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Vessels</div>
            <div className="flex flex-wrap gap-2">
              {vessels.map(vessel => {
                // Generate friendly label
                let label = vessel.vessel_id;
                if (vessel.vessel_id.startsWith('charter-')) {
                  label = 'Charter ' + vessel.vessel_id.split('-')[1];
                } else if (vessel.vessel_id.startsWith('fleet-')) {
                  label = 'Fleet ' + vessel.vessel_id.split('-')[1];
                } else if (vessel.vessel_id.startsWith('gfw-trawler-')) {
                  label = 'Trawler ' + vessel.vessel_id.split('-')[2];
                } else if (vessel.vessel_id.startsWith('gfw-longliner-')) {
                  label = 'Longliner ' + vessel.vessel_id.split('-')[2];
                }

                return (
                  <button
                    key={vessel.vessel_id}
                    onClick={() => toggleVesselSelection(vessel.vessel_id)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      selectedVesselIds.includes(vessel.vessel_id)
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {label}
                    <span className="ml-1 text-xs opacity-60">
                      ({vessel.positions.length})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Display */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="text-xs text-slate-400">
                {formatDate(currentTime)}
              </div>
              <div className="text-lg font-mono text-cyan-400">
                {formatTime(currentTime)}
              </div>
            </div>
          </div>

          {/* Time Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={sliderValue}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${sliderValue}%, #334155 ${sliderValue}%, #334155 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>{formatTime(startTime)}</span>
              <span>{formatTime(endTime)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between gap-4">
            {/* Play/Pause Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={jumpToStart}
                className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Jump to start"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="p-3 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={jumpToEnd}
                className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Jump to end"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Speed:</span>
              <div className="flex gap-1">
                {speedOptions.map(speed => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-700">
            <span>
              {selectedVesselIds.length} vessel{selectedVesselIds.length !== 1 ? 's' : ''} selected
            </span>
            <span>
              {startTime && endTime && (
                <>
                  Duration: {Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60))}h
                </>
              )}
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </div>
  );
}
