'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Waves,
  Wind,
  Thermometer,
  Moon,
  Navigation,
  TrendingUp,
  MapPin,
  Clock,
  Activity,
  Droplets
} from 'lucide-react';

interface BiteReport {
  id: string;
  timestamp: string;
  location: { lat: number; lng: number };
  conditions?: {
    sst: number;
    chlorophyll: number;
    windSpeed: number;
    windDirection: string;
    waveHeight: number;
    tidePhase: string;
    moonPhase: string;
    moonIllumination: number;
    pressure: number;
    depth?: number;
    sstBreakNearby?: boolean;
  };
  analysis?: {
    confidence: number;
    patterns?: string[];
    recommendations?: string[];
  };
  species?: string;
  notes?: string;
}

interface Props {
  report: BiteReport;
  onClose?: () => void;
  onShare?: () => void;
  onAddCatch?: () => void;
}

export default function BiteReportCard({ report, onClose, onShare, onAddCatch }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(!report.conditions);
  const [patternMatch, setPatternMatch] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!report.conditions) {
      // Fetch ocean conditions if not already present
      fetchOceanConditions();
    } else {
      // Calculate pattern match
      calculatePatternMatch();
    }
  }, [report]);

  const fetchOceanConditions = async () => {
    try {
      const response = await fetch(
        `/api/ocean-conditions?lat=${report.location.lat}&lng=${report.location.lng}`
      );
      if (response.ok) {
        const conditions = await response.json();
        // Update report with conditions
        report.conditions = conditions;
        setIsAnalyzing(false);
        calculatePatternMatch();
      }
    } catch (error) {
      console.error('Failed to fetch ocean conditions:', error);
      setIsAnalyzing(false);
    }
  };

  const calculatePatternMatch = () => {
    if (!report.conditions) return;

    // Calculate pattern confidence based on conditions
    let score = 50;

    // SST break nearby is highly significant
    if (report.conditions.sstBreakNearby) score += 25;

    // Good chlorophyll levels
    if (report.conditions.chlorophyll > 0.5 && report.conditions.chlorophyll < 2) {
      score += 15;
    }

    // Favorable tide phase
    if (report.conditions.tidePhase === 'rising' || report.conditions.tidePhase === 'falling') {
      score += 10;
    }

    setPatternMatch(Math.min(100, score));
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getWindArrow = (direction: string) => {
    const angles: Record<string, number> = {
      'N': 180, 'NNE': 202.5, 'NE': 225, 'ENE': 247.5,
      'E': 270, 'ESE': 292.5, 'SE': 315, 'SSE': 337.5,
      'S': 0, 'SSW': 22.5, 'SW': 45, 'WSW': 67.5,
      'W': 90, 'WNW': 112.5, 'NW': 135, 'NNW': 157.5
    };
    return angles[direction] || 0;
  };

  const getTideIcon = (phase: string) => {
    switch(phase) {
      case 'high': return '🌊';
      case 'low': return '💧';
      case 'rising': return '📈';
      case 'falling': return '📉';
      default: return '🌊';
    }
  };

  const getMoonIcon = (phase: string) => {
    const phases: Record<string, string> = {
      'New Moon': '🌑',
      'Waxing Crescent': '🌒',
      'First Quarter': '🌓',
      'Waxing Gibbous': '🌔',
      'Full Moon': '🌕',
      'Waning Gibbous': '🌖',
      'Last Quarter': '🌗',
      'Waning Crescent': '🌘'
    };
    return phases[phase] || '🌓';
  };

  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-900 via-cyan-950 to-teal-950 rounded-2xl max-w-md w-full my-8 overflow-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        {/* Header */}
        <div className="p-6 border-b border-cyan-800/30">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
              🎣 BITE RECORDED!
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 text-cyan-400 text-sm">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {formatTime(report.timestamp)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Pattern Match Score */}
        {!isAnalyzing && (
          <div className="p-4 bg-cyan-500/10 border-b border-cyan-800/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyan-300 font-semibold">Pattern Match</span>
              <span className="text-2xl font-bold text-cyan-100">{patternMatch}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-1000"
                style={{ width: `${patternMatch}%` }}
              />
            </div>
            {patternMatch > 70 && (
              <p className="text-sm text-cyan-400 mt-2">
                ⚡ Excellent conditions! Similar to your best catches.
              </p>
            )}
          </div>
        )}

        {/* Conditions Grid */}
        {isAnalyzing ? (
          <div className="p-8 text-center">
            <div className="animate-pulse">
              <Activity className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <p className="text-cyan-300">Analyzing ocean conditions...</p>
            </div>
          </div>
        ) : report.conditions ? (
          <div className="p-4 space-y-4">
            {/* Water Conditions */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2">
                <Thermometer size={16} />
                Water Conditions
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-cyan-400/70">SST</span>
                  <div className="text-cyan-100 font-semibold text-lg">
                    {report.conditions.sst.toFixed(1)}°F
                    {report.conditions.sstBreakNearby && (
                      <span className="text-xs ml-2 text-yellow-400">🔥 Break nearby!</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-cyan-400/70">Chlorophyll</span>
                  <div className="text-cyan-100 font-semibold text-lg">
                    {report.conditions.chlorophyll.toFixed(2)} mg/m³
                  </div>
                </div>
                {report.conditions.depth && (
                  <div>
                    <span className="text-cyan-400/70">Depth</span>
                    <div className="text-cyan-100 font-semibold text-lg">
                      {Math.round(report.conditions.depth * 3.28)}ft
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Wind & Waves */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2">
                <Wind size={16} />
                Wind & Waves
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-cyan-400/70">Wind</span>
                  <div className="text-cyan-100 font-semibold text-lg flex items-center gap-2">
                    {report.conditions.windSpeed.toFixed(0)}kt
                    <span
                      className="inline-block"
                      style={{ transform: `rotate(${getWindArrow(report.conditions.windDirection)}deg)` }}
                    >
                      ↓
                    </span>
                    {report.conditions.windDirection}
                  </div>
                </div>
                <div>
                  <span className="text-cyan-400/70">Waves</span>
                  <div className="text-cyan-100 font-semibold text-lg">
                    {report.conditions.waveHeight.toFixed(1)}ft
                  </div>
                </div>
              </div>
            </div>

            {/* Tide & Moon */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2">
                <Moon size={16} />
                Tide & Moon
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-cyan-400/70">Tide</span>
                  <div className="text-cyan-100 font-semibold text-lg">
                    {getTideIcon(report.conditions.tidePhase)} {report.conditions.tidePhase}
                  </div>
                </div>
                <div>
                  <span className="text-cyan-400/70">Moon</span>
                  <div className="text-cyan-100 font-semibold text-lg">
                    {getMoonIcon(report.conditions.moonPhase)} {report.conditions.moonIllumination}%
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Insights */}
            {report.analysis?.recommendations && (
              <div className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-lg p-4 border border-cyan-500/30">
                <h3 className="text-cyan-300 font-semibold mb-2 flex items-center gap-2">
                  💡 Insights
                </h3>
                <ul className="space-y-1">
                  {report.analysis.recommendations.map((rec, i) => (
                    <li key={i} className="text-cyan-100 text-sm flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* Actions */}
        <div className="p-4 border-t border-cyan-800/30 flex gap-2">
          {onAddCatch && (
            <button
              onClick={onAddCatch}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              🐟 Log Catch
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              📤 Share Report
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}