"use client";

interface SSTLegendProps {
  visible: boolean;
}

export default function SSTLegend({ visible }: SSTLegendProps) {
  if (!visible) return null;

  // Temperature range in Celsius (approximate for typical SST range)
  // Copernicus data is in Kelvin, but we'll show Celsius for users
  const minTemp = 0;  // 0°C (cold)
  const maxTemp = 30; // 30°C (warm)

  return (
    <div className="absolute bottom-20 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      <div className="text-white text-sm font-semibold mb-2">
        Sea Surface Temperature
      </div>
      
      {/* Gradient bar */}
      <div className="relative w-48 h-6 rounded overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, 
              #00008B 0%,      /* Dark Blue - coldest */
              #0000FF 10%,     /* Blue */
              #00BFFF 20%,     /* Deep Sky Blue */
              #00FFFF 30%,     /* Cyan */
              #00FF00 40%,     /* Green */
              #ADFF2F 50%,     /* Green Yellow */
              #FFFF00 60%,     /* Yellow */
              #FFA500 70%,     /* Orange */
              #FF4500 80%,     /* Orange Red */
              #FF0000 90%,     /* Red */
              #8B0000 100%     /* Dark Red - warmest */
            )`
          }}
        />
      </div>

      {/* Temperature labels */}
      <div className="flex justify-between mt-1 text-xs text-white/90">
        <span>{minTemp}°C</span>
        <span>{Math.round((minTemp + maxTemp) / 2)}°C</span>
        <span>{maxTemp}°C</span>
      </div>

      {/* Additional info */}
      <div className="text-xs text-white/60 mt-2">
        ODYSSEA L4 NRT • Daily
      </div>
    </div>
  );
}
