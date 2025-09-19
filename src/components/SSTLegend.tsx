"use client";

interface SSTLegendProps {
  visible: boolean;
}

export default function SSTLegend({ visible }: SSTLegendProps) {
  if (!visible) return null;

  // Temperature range in Fahrenheit for US East Coast waters
  // Typical range: 32°F (winter) to 86°F (summer Gulf Stream)
  const minTemp = 32;  // 32°F (freezing)
  const maxTemp = 86;  // 86°F (warm Gulf Stream)

  return (
    <div className="bg-black/80 backdrop-blur-md rounded-lg border border-cyan-500/20 p-3">
      <div className="text-cyan-300 text-sm font-medium mb-2">
        SST Temperature (°F)
      </div>
      
      {/* Gradient bar */}
      <div className="relative w-full h-5 rounded overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, 
              #00008B 0%,      /* Dark Blue - 32°F */
              #0000FF 12%,     /* Blue */
              #00BFFF 24%,     /* Deep Sky Blue */
              #00FFFF 36%,     /* Cyan */
              #00FF00 48%,     /* Green - ~59°F */
              #ADFF2F 56%,     /* Green Yellow */
              #FFFF00 64%,     /* Yellow */
              #FFA500 72%,     /* Orange */
              #FF4500 80%,     /* Orange Red */
              #FF0000 88%,     /* Red */
              #DC143C 94%,     /* Crimson */
              #8B0000 100%     /* Dark Red - 86°F */
            )`
          }}
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
