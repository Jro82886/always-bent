"use client";

import { useMVPState, Day } from "@/lib/mvpState";

export default function AnalysisBar() {
  const {
    sstOn, setSstOn,
    polygonsOn, setPolygonsOn,
    sstOpacity, setSstOpacity,
    polygonOpacity, setPolygonOpacity,
    day, setDay,
    snipOn, setSnipOn,
    snipBox
  } = useMVPState();

  return (
    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white pointer-events-auto z-20">
      <div className="flex flex-col gap-3">
        
        {/* Layer Toggles */}
        <div className="flex gap-2">
          <ToggleButton
            active={sstOn}
            onClick={() => setSstOn(!sstOn)}
            label="SST"
          />
          <ToggleButton
            active={polygonsOn}
            onClick={() => setPolygonsOn(!polygonsOn)}
            label="Polygons"
          />
        </div>

        {/* Opacity Sliders */}
        {sstOn && (
          <div className="flex items-center gap-2">
            <label className="text-xs">SST Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={sstOpacity}
              onChange={(e) => setSstOpacity(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-xs w-8">{Math.round(sstOpacity * 100)}%</span>
          </div>
        )}
        
        {polygonsOn && (
          <div className="flex items-center gap-2">
            <label className="text-xs">Polygon Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={polygonOpacity}
              onChange={(e) => setPolygonOpacity(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-xs w-8">{Math.round(polygonOpacity * 100)}%</span>
          </div>
        )}

        {/* Date Picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs">Date</label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value as Day)}
            className="bg-black/60 border border-white/20 rounded px-2 py-1 text-xs"
          >
            <option value="latest">Latest</option>
            <option value="today">Today</option>
            <option value="-1d">-1d</option>
            <option value="-2d">-2d</option>
            <option value="-3d">-3d</option>
          </select>
        </div>

        {/* Snip Tool */}
        <div className="flex items-center gap-2">
          <ToggleButton
            active={snipOn}
            onClick={() => setSnipOn(!snipOn)}
            label="Snip Area"
          />
        </div>

        {/* Snip Info Panel */}
        {snipBox && (
          <div className="mt-2 p-2 bg-white/10 rounded text-xs">
            <div className="font-medium mb-1">Selected Area</div>
            <div>W: {snipBox.west.toFixed(3)}°</div>
            <div>S: {snipBox.south.toFixed(3)}°</div>
            <div>E: {snipBox.east.toFixed(3)}°</div>
            <div>N: {snipBox.north.toFixed(3)}°</div>
            <div className="mt-1">Date: {day}</div>
            <div className="mt-2 text-white/70">
              Analysis placeholder - ready for backend integration
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded text-sm font-medium transition-all
        ${active 
          ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/25' 
          : 'bg-white/10 text-white hover:bg-white/20'
        }
      `}
    >
      {label}
    </button>
  );
}
