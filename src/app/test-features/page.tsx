'use client';

import React, { useState } from 'react';
import { getTemperatureFromColor, COPERNICUS_THERMAL_COLORMAP } from '@/lib/analysis/sst-color-mapping';
import EastCoastSSTScale from '@/components/EastCoastSSTScale';

export default function TestFeaturesPage() {
  const [selectedColor, setSelectedColor] = useState({ r: 200, g: 200, b: 0 });
  const [tempResult, setTempResult] = useState<any>(null);

  const testColorConversion = () => {
    const result = getTemperatureFromColor(selectedColor.r, selectedColor.g, selectedColor.b);
    setTempResult(result);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-8">
          Always Bent - Features Test Page
        </h1>

        {/* Test 1: SST Color-to-Temperature Conversion */}
        <section className="mb-12 bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-4">
            Test 1: SST Color-to-Temperature Conversion
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-slate-300 mb-4">
                This test verifies the custom SST color-to-temperature lookup table.
                Adjust the RGB sliders to simulate different SST map colors.
              </p>

              {/* Color pickers */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Red: {selectedColor.r}</label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={selectedColor.r}
                    onChange={(e) => setSelectedColor({ ...selectedColor, r: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Green: {selectedColor.g}</label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={selectedColor.g}
                    onChange={(e) => setSelectedColor({ ...selectedColor, g: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Blue: {selectedColor.b}</label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={selectedColor.b}
                    onChange={(e) => setSelectedColor({ ...selectedColor, b: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Color preview */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-32 h-32 rounded-lg border-2 border-slate-600"
                  style={{
                    backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`
                  }}
                />
                <div>
                  <p className="text-slate-300">
                    RGB: ({selectedColor.r}, {selectedColor.g}, {selectedColor.b})
                  </p>
                </div>
              </div>

              <button
                onClick={testColorConversion}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                Convert to Temperature
              </button>

              {/* Results */}
              {tempResult && (
                <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-2">Results:</h3>
                  <div className="space-y-1 text-slate-300">
                    <p>Temperature (F): <span className="text-cyan-400 font-bold">{tempResult.tempF}°F</span></p>
                    <p>Temperature (C): <span className="text-cyan-400 font-bold">{tempResult.tempC}°C</span></p>
                    <p>Confidence: <span className="text-cyan-400 font-bold">{(tempResult.confidence * 100).toFixed(0)}%</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick test buttons */}
            <div>
              <p className="text-sm text-slate-400 mb-2">Quick Tests:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedColor({ r: 0, g: 0, b: 200 })}
                  className="px-3 py-1 bg-blue-700 text-white rounded text-sm"
                >
                  Cold (Blue)
                </button>
                <button
                  onClick={() => setSelectedColor({ r: 0, g: 200, b: 200 })}
                  className="px-3 py-1 bg-cyan-500 text-white rounded text-sm"
                >
                  Cool (Cyan)
                </button>
                <button
                  onClick={() => setSelectedColor({ r: 0, g: 200, b: 100 })}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                >
                  Moderate (Green)
                </button>
                <button
                  onClick={() => setSelectedColor({ r: 200, g: 200, b: 0 })}
                  className="px-3 py-1 bg-yellow-500 text-black rounded text-sm"
                >
                  Warm (Yellow)
                </button>
                <button
                  onClick={() => setSelectedColor({ r: 255, g: 0, b: 0 })}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                >
                  Hot (Red)
                </button>
              </div>
            </div>

            {/* Reference colormap */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-cyan-300 mb-2">Reference Colormap:</h3>
              <div className="space-y-1">
                {COPERNICUS_THERMAL_COLORMAP.slice(0, 8).map((point, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <div
                      className="w-8 h-8 rounded border border-slate-600"
                      style={{ backgroundColor: `rgb(${point.rgb[0]}, ${point.rgb[1]}, ${point.rgb[2]})` }}
                    />
                    <span className="text-slate-400 w-16">{point.tempF}°F</span>
                    <span className="text-slate-500">{point.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Test 2: East Coast Temperature Scale */}
        <section className="mb-12 bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-4">
            Test 2: East Coast Temperature Scale
          </h2>

          <div className="space-y-4">
            <p className="text-slate-300 mb-4">
              This displays the visual temperature scale for East Coast waters with seasonal ranges.
            </p>

            <EastCoastSSTScale
              currentTemp={tempResult?.tempF || 72}
              unit="F"
              orientation="horizontal"
            />
          </div>
        </section>

        {/* Instructions for remaining tests */}
        <section className="bg-slate-900 border border-cyan-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-4">
            Next Tests (To be tested on main map):
          </h2>
          <div className="space-y-2 text-slate-300">
            <p>✓ Test 1 & 2: Temperature conversion and scale (testable above)</p>
            <p>⏭ Test 3: Oceanographic feature detection (requires map with SST layer)</p>
            <p>⏭ Test 4: Enhanced snip report (requires drawing polygons on map)</p>
            <p>⏭ Test 5: Snip score system (part of snip report)</p>
            <p>⏭ Test 6: 3-Day water movement visualization (requires map toggle)</p>
          </div>
        </section>
      </div>
    </div>
  );
}