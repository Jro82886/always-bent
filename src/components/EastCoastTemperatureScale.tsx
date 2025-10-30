'use client';

import React from 'react';
import { Thermometer } from 'lucide-react';

/**
 * East Coast Temperature Scale
 * Custom temperature legend for East Coast fishing zones
 * Based on typical seasonal temperature ranges from Maine to Florida Keys
 */

interface TemperatureRange {
  tempF: number;
  tempC: number;
  color: string;
  label: string;
  fishingNote: string;
}

const EAST_COAST_RANGES: TemperatureRange[] = [
  {
    tempF: 38,
    tempC: 3,
    color: '#0D1B4C', // Deep blue
    label: 'Frigid',
    fishingNote: 'Winter cod, pollock (ME-MA)'
  },
  {
    tempF: 45,
    tempC: 7,
    color: '#1E3A8A', // Dark blue
    label: 'Very Cold',
    fishingNote: 'Early season stripers (MA-NY)'
  },
  {
    tempF: 52,
    tempC: 11,
    color: '#2563EB', // Blue
    label: 'Cold',
    fishingNote: 'Spring migration begins'
  },
  {
    tempF: 60,
    tempC: 16,
    color: '#3B82F6', // Lighter blue
    label: 'Cool',
    fishingNote: 'Active striper season'
  },
  {
    tempF: 68,
    tempC: 20,
    color: '#10B981', // Green
    label: 'Ideal',
    fishingNote: 'Peak fishing (all species)'
  },
  {
    tempF: 75,
    tempC: 24,
    color: '#F59E0B', // Amber/yellow
    label: 'Warm',
    fishingNote: 'Summer pelagics active'
  },
  {
    tempF: 82,
    tempC: 28,
    color: '#F97316', // Orange
    label: 'Hot',
    fishingNote: 'Offshore species (FL-SC)'
  },
  {
    tempF: 88,
    tempC: 31,
    color: '#DC2626', // Red
    label: 'Very Hot',
    fishingNote: 'Tropical species (FL Keys)'
  }
];

export default function EastCoastTemperatureScale() {
  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-cyan-300">East Coast SST Scale</h3>
        </div>
        <p className="text-xs text-slate-400 mt-1">ME to FL Keys</p>
      </div>

      {/* Temperature Scale */}
      <div className="p-3 space-y-1.5">
        {EAST_COAST_RANGES.map((range, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-xs group hover:bg-slate-800/50 rounded px-2 py-1 transition-colors"
          >
            {/* Color swatch */}
            <div
              className="w-6 h-6 rounded border border-slate-600 flex-shrink-0"
              style={{ backgroundColor: range.color }}
            />

            {/* Temperature */}
            <div className="flex-shrink-0 w-16">
              <div className="font-semibold text-slate-200">
                {range.tempF}°F
              </div>
              <div className="text-slate-500">
                {range.tempC}°C
              </div>
            </div>

            {/* Label */}
            <div className="flex-shrink-0 w-20 text-slate-300 font-medium">
              {range.label}
            </div>

            {/* Fishing note */}
            <div className="flex-1 text-slate-400 text-xs opacity-70 group-hover:opacity-100 transition-opacity">
              {range.fishingNote}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="px-4 py-2 bg-slate-800/50 border-t border-slate-700">
        <p className="text-xs text-slate-500 italic">
          Temperature ranges are approximate and vary by season
        </p>
      </div>
    </div>
  );
}

/**
 * Helper function to get the East Coast color for a given temperature
 */
export function getEastCoastColor(tempF: number): string {
  // Find the appropriate range
  for (let i = EAST_COAST_RANGES.length - 1; i >= 0; i--) {
    if (tempF >= EAST_COAST_RANGES[i].tempF) {
      return EAST_COAST_RANGES[i].color;
    }
  }

  // Default to coldest color if below all ranges
  return EAST_COAST_RANGES[0].color;
}

/**
 * Helper function to get the East Coast label for a given temperature
 */
export function getEastCoastLabel(tempF: number): string {
  for (let i = EAST_COAST_RANGES.length - 1; i >= 0; i--) {
    if (tempF >= EAST_COAST_RANGES[i].tempF) {
      return EAST_COAST_RANGES[i].label;
    }
  }

  return EAST_COAST_RANGES[0].label;
}

/**
 * Helper function to get fishing notes for a given temperature
 */
export function getEastCoastFishingNote(tempF: number): string {
  for (let i = EAST_COAST_RANGES.length - 1; i >= 0; i--) {
    if (tempF >= EAST_COAST_RANGES[i].tempF) {
      return EAST_COAST_RANGES[i].fishingNote;
    }
  }

  return EAST_COAST_RANGES[0].fishingNote;
}
