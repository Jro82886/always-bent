"use client";

import { COPERNICUS_THERMAL_COLORMAP } from '@/lib/analysis/sst-color-mapping';

interface SSTLegendProps {
  visible: boolean;
}

export default function SSTLegend({ visible }: SSTLegendProps) {
  if (!visible) return null;

  // Temperature range in Fahrenheit for US East Coast waters
  // Using Copernicus colormap range
  const minTemp = 35;  // 35°F (very cold)
  const maxTemp = 89;  // 89°F (very hot Gulf Stream)

  // Build gradient from Copernicus colormap
  const buildGradient = () => {
    const stops = COPERNICUS_THERMAL_COLORMAP.map(point => {
      const position = ((point.tempF - minTemp) / (maxTemp - minTemp)) * 100;
      const color = `rgb(${point.rgb[0]}, ${point.rgb[1]}, ${point.rgb[2]})`;
      return `${color} ${position.toFixed(1)}%`;
    }).join(', ');

    return `linear-gradient(to right, ${stops})`;
  };

  return (
    <div className="bg-black/80 backdrop-blur-md rounded-lg border border-cyan-500/20 p-3">
      <div className="text-cyan-300 text-sm font-medium mb-2">
        SST Temperature (°F)
      </div>

      {/* Gradient bar */}
      <div className="relative w-full h-5 rounded overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: buildGradient() }}
        />
      </div>

      {/* Temperature labels */}
      <div className="flex justify-between mt-1.5 text-xs text-gray-300">
        <span>{minTemp}</span>
        <span>{Math.round((minTemp + maxTemp) / 2)}</span>
        <span>{maxTemp}</span>
      </div>

      {/* Additional info */}
      <div className="text-[10px] text-cyan-400/60 mt-2 uppercase tracking-wider">
        ODYSSEA L4
      </div>
    </div>
  );
}
