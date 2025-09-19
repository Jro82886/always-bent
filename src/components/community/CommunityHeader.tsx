'use client';
import { useAppState } from '@/store/appState';
import { getInletById, INLETS } from '@/lib/inlets';
import { useEffect, useState } from 'react';
import { MapPin, Wind, Waves, Thermometer } from 'lucide-react';

interface BuoyData {
  temp: string;
  wind: { speed: string; dir: string };
  swell: { ht: string; period: string };
}

export default function CommunityHeader() {
  const { selectedInletId } = useAppState();
  const inlet = getInletById(selectedInletId) || INLETS[0];
  const [buoyData, setBuoyData] = useState<BuoyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch buoy data for the inlet
    const fetchBuoyData = async () => {
      try {
        const response = await fetch(`/api/stormio?lat=${inlet.center[1]}&lng=${inlet.center[0]}`);
        const data = await response.json();
        
        if (data.weather) {
          setBuoyData({
            temp: Math.round(data.weather.sstC * 9/5 + 32).toString(), // C to F
            wind: {
              speed: Math.round(data.weather.windKt).toString(),
              dir: data.weather.windDir
            },
            swell: {
              ht: data.weather.swellFt.toFixed(1),
              period: Math.round(data.weather.swellPeriodS).toString()
            }
          });
        }
      } catch (error) {
        console.error('Error fetching buoy data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuoyData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchBuoyData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [inlet.id]);

  return (
    <div className="bg-black/60 backdrop-blur-md border-b border-cyan-500/20 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Inlet chip and title */}
        <div className="flex items-center gap-4">
          <div 
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-cyan-500/30"
            style={{ 
              boxShadow: `0 0 20px ${inlet.color}40`,
              borderColor: `${inlet.color}60`
            }}
          >
            <span 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: inlet.color }}
            />
            <MapPin className="w-3.5 h-3.5" style={{ color: inlet.color }} />
            <span className="text-sm font-medium text-white">{inlet.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Community Reports</h1>
        </div>

        {/* Right side - Buoy snapshot */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700 animate-pulse">
              <div className="h-4 w-16 bg-gray-700 rounded" />
              <div className="h-4 w-16 bg-gray-700 rounded" />
              <div className="h-4 w-16 bg-gray-700 rounded" />
            </div>
          ) : buoyData ? (
            <div className="flex items-center gap-4 px-4 py-2 bg-gray-800/50 rounded-lg border border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-400" />
                <span className="text-sm">
                  <strong className="text-orange-400">{buoyData.temp}°</strong>
                  <span className="text-gray-400 ml-1">SST</span>
                </span>
              </div>
              <div className="w-px h-4 bg-gray-600" />
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">
                  <strong className="text-cyan-400">{buoyData.wind.speed}kt</strong>
                  <span className="text-gray-400 ml-1">{buoyData.wind.dir}</span>
                </span>
              </div>
              <div className="w-px h-4 bg-gray-600" />
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-blue-400" />
                <span className="text-sm">
                  <strong className="text-blue-400">{buoyData.swell.ht}ft</strong>
                  <span className="text-gray-400 ml-1">{buoyData.swell.period}s</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No buoy data</div>
          )}
        </div>
      </div>
    </div>
  );
}
