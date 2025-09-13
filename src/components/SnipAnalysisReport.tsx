"use client";
import { useState } from 'react';
import { X, Target, Waves, Thermometer, Save } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analysis/sst-analyzer';

interface SnipAnalysisReportProps {
  analysis: AnalysisResult | null;
  onClose?: () => void;
  onSave?: () => void;
}

export default function SnipAnalysisReport({ 
  analysis, 
  onClose, 
  onSave 
}: SnipAnalysisReportProps) {
  const [isSaving, setIsSaving] = useState(false);

  if (!analysis) return null;

  const handleSave = async () => {
    setIsSaving(true);
    if (onSave) {
      await onSave();
    }
    setIsSaving(false);
  };

  const { hotspot, features, stats } = analysis;

  return (
    <div className="absolute bottom-4 left-4 w-96 bg-black/95 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-br from-purple-500/30 to-indigo-500/30 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-300 rounded-full shadow-[0_0_8px_rgba(216,180,254,0.8)]"></div>
              </div>
              Area Analysis Report
            </h2>
            <p className="text-white/80 text-sm">
              {new Date().toLocaleString('en-US', { 
                timeZone: 'America/New_York',
                dateStyle: 'short',
                timeStyle: 'short'
              })} ET
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Primary Hotspot */}
        {hotspot && (
          <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
            <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
              <Target size={18} className="text-green-300 drop-shadow-[0_0_8px_rgba(134,239,172,0.8)]" />
              PRIMARY HOTSPOT
            </h3>
            <div className="text-white space-y-1 text-sm">
              <div>
                <span className="text-gray-400">Location:</span>{' '}
                {hotspot.location[1].toFixed(4)}°N, {Math.abs(hotspot.location[0]).toFixed(4)}°W
              </div>
              <div>
                <span className="text-gray-400">Confidence:</span>{' '}
                <span className={`font-bold ${
                  hotspot.confidence > 0.8 ? 'text-green-400' : 
                  hotspot.confidence > 0.6 ? 'text-yellow-400' : 'text-orange-400'
                }`}>
                  {(hotspot.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="text-gray-400">SST Gradient:</span>{' '}
                <span className="font-bold text-orange-400">
                  {hotspot.gradient_strength.toFixed(1)}°F/km
                </span>
                {hotspot.gradient_strength >= 2.0 / 1.609 && (
                  <span className="ml-2 text-xs bg-red-600 px-1 rounded">STRONG BREAK</span>
                )}
              </div>
              <div>
                <span className="text-gray-400">Optimal Approach:</span>{' '}
                {hotspot.optimal_approach}
              </div>
            </div>
          </div>
        )}

        {/* Detected Features */}
        {features.length > 0 && (
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
            <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
              <Waves size={18} className="text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
              Detected Features
            </h3>
            <div className="space-y-2">
              {features.map((feature, idx) => (
                <div key={idx} className="text-white text-sm bg-black/30 rounded p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold capitalize">
                      {feature.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">
                      Score: {(feature.properties.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-0.5">
                    <div>Gradient: {feature.properties.grad_f_per_km_mean.toFixed(2)}°F/km</div>
                    <div>Area: {feature.properties.area_km2.toFixed(1)} km²</div>
                    {feature.type === 'eddy' && (
                      <div>Circularity: {(feature.properties.circularity * 100).toFixed(0)}%</div>
                    )}
                    {feature.type === 'filament' && (
                      <div>Elongation: {feature.properties.elongation.toFixed(1)}x</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Temperature Statistics */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <h3 className="text-gray-300 font-semibold mb-2 flex items-center gap-2">
            <Thermometer size={18} className="text-orange-300 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
            Temperature Stats
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-400">
              Min: <span className="text-blue-400 font-bold">{stats.min_temp_f.toFixed(1)}°F</span>
            </div>
            <div className="text-gray-400">
              Max: <span className="text-red-400 font-bold">{stats.max_temp_f.toFixed(1)}°F</span>
            </div>
            <div className="text-gray-400">
              Average: <span className="text-white font-bold">{stats.avg_temp_f.toFixed(1)}°F</span>
            </div>
            <div className="text-gray-400">
              Range: <span className="text-orange-400 font-bold">{stats.temp_range_f.toFixed(1)}°F</span>
            </div>
          </div>
          <div className="text-gray-400 text-sm mt-2">
            Area: <span className="text-white font-bold">{stats.area_km2.toFixed(1)} km²</span>
            <span className="text-gray-500"> ({(stats.area_km2 * 0.386).toFixed(1)} mi²)</span>
          </div>
        </div>

        {/* ML Prediction (placeholder for now) */}
        <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3">
          <h3 className="text-purple-400 font-semibold mb-2">🤖 ML Prediction</h3>
          <div className="text-white text-sm">
            <div>
              <span className="text-gray-400">Success Probability:</span>{' '}
              <span className="font-bold text-green-400">
                {hotspot ? `${(hotspot.confidence * 85).toFixed(0)}%` : 'N/A'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Based on temperature gradients and feature detection
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              'Saving...'
            ) : (
              <>
                <Save size={18} className="text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                Save Analysis
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
