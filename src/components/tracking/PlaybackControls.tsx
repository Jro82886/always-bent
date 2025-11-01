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

  // Load test vessel data
  const handleLoadTestData = async () => {
    // Load historical data for our two test vessels
    // test-1 (Montauk) and test-2 (Ocean City)
    await loadVesselHistory('test-1', 'ny-montauk', 48);
    await loadVesselHistory('test-2', 'md-ocean-city', 48);
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
        <div className="space-y-4">
          {/* Vessel Selection */}
          <div className="space-y-2">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Vessels</div>
            <div className="flex flex-wrap gap-2">
              {vessels.map(vessel => (
                <button
                  key={vessel.vessel_id}
                  onClick={() => toggleVesselSelection(vessel.vessel_id)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    selectedVesselIds.includes(vessel.vessel_id)
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {vessel.vessel_id.slice(0, 8)}...
                  <span className="ml-1 text-xs opacity-60">
                    ({vessel.positions.length} pts)
                  </span>
                </button>
              ))}
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
