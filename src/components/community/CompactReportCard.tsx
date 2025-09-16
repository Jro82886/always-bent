/**
 * Compact Report Card with Expand/Collapse
 * Modern, sleek design that shows many reports at once
 */

import { useState } from 'react';
import { ChevronDown, Zap, Fish, MapPin, Thermometer, TrendingUp, Clock, Users, Waves, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BiteReport {
  id: string;
  bite_id: string;
  user_id: string;
  user_name: string;
  created_at: string;
  lat: number;
  lon: number;
  inlet_id?: string;
  inlet_name?: string;
  notes?: string;
  fish_on?: boolean;
  species?: string;
  analysis?: {
    ocean_conditions?: {
      sst?: number;
      sst_gradient?: number;
      chl?: number;
      current_speed?: number;
      distance_to_edge?: number;
    };
    vessel_activity?: {
      nearby_count?: number;
      activity_level?: string;
    };
    confidence_score?: number;
    recommendations?: string[];
  };
  is_hotspot?: boolean;
  hotspot_count?: number;
  is_abfi_highlight?: boolean;
  highlight_reason?: string;
}

export default function CompactReportCard({ report }: { report: BiteReport }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isHighlight = report.is_hotspot || report.is_abfi_highlight;
  const confidence = report.analysis?.confidence_score || 0;
  const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true });
  
  // Confidence color
  const confidenceColor = confidence > 70 ? 'text-green-400' : 
                          confidence > 40 ? 'text-yellow-400' : 
                          'text-gray-400';
  
  return (
    <div className={`
      group relative transition-all duration-200
      ${isExpanded ? 'mb-3' : 'mb-1'}
    `}>
      {/* Compact View - Always Visible */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          cursor-pointer rounded-lg border backdrop-blur-sm transition-all
          ${isHighlight 
            ? 'bg-gradient-to-r from-orange-500/5 to-red-500/5 border-orange-500/20 hover:border-orange-500/40' 
            : 'bg-slate-800/20 border-slate-700/20 hover:border-cyan-500/30'
          }
          ${isExpanded ? 'rounded-b-none' : ''}
        `}
      >
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            {/* Priority Indicator */}
            {isHighlight && (
              <div className="flex-shrink-0">
                <Zap size={14} className="text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]" />
              </div>
            )}
            
            {/* User & Time */}
            <div className="flex-shrink-0 min-w-[100px]">
              <div className="text-xs font-medium text-white truncate">
                {report.user_name || 'Anonymous'}
              </div>
              <div className="text-[10px] text-gray-400">
                {timeAgo}
              </div>
            </div>
            
            {/* Location */}
            <div className="flex-1 flex items-center gap-1 min-w-0">
              <MapPin size={10} className="text-cyan-400 flex-shrink-0" />
              <span className="text-xs text-gray-300 truncate">
                {report.inlet_name || `${report.lat.toFixed(2)}°, ${report.lon.toFixed(2)}°`}
              </span>
            </div>
            
            {/* Key Metrics */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* SST */}
              {report.analysis?.ocean_conditions?.sst && (
                <div className="flex items-center gap-1">
                  <Thermometer size={10} className="text-orange-400" />
                  <span className="text-[10px] text-white">
                    {report.analysis.ocean_conditions.sst.toFixed(0)}°
                  </span>
                </div>
              )}
              
              {/* Gradient */}
              {report.analysis?.ocean_conditions?.sst_gradient && report.analysis.ocean_conditions.sst_gradient > 1 && (
                <div className="flex items-center gap-1">
                  <TrendingUp size={10} className="text-red-400" />
                  <span className="text-[10px] text-white">
                    {report.analysis.ocean_conditions.sst_gradient.toFixed(1)}°/nm
                  </span>
                </div>
              )}
              
              {/* Confidence */}
              <div className="flex items-center gap-1">
                <div className={`w-6 h-1.5 rounded-full bg-gray-700 overflow-hidden`}>
                  <div 
                    className={`h-full transition-all ${
                      confidence > 70 ? 'bg-green-400' :
                      confidence > 40 ? 'bg-yellow-400' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className={`text-[10px] ${confidenceColor}`}>
                  {confidence.toFixed(0)}%
                </span>
              </div>
              
              {/* Fish On Badge */}
              {report.fish_on && (
                <div className="px-1.5 py-0.5 bg-green-500/20 rounded text-[10px] text-green-400 font-medium">
                  FISH ON
                </div>
              )}
            </div>
            
            {/* Expand Icon */}
            <ChevronDown 
              size={14} 
              className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
          
          {/* ABFI Highlight Reason - Inline */}
          {isHighlight && report.highlight_reason && (
            <div className="mt-1 text-[10px] text-orange-300/80 pl-5">
              ⚡ {report.highlight_reason}
            </div>
          )}
        </div>
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className={`
          rounded-b-lg border border-t-0 backdrop-blur-sm animate-expand
          ${isHighlight 
            ? 'bg-gradient-to-b from-orange-500/5 to-transparent border-orange-500/20' 
            : 'bg-slate-800/20 border-slate-700/20'
          }
        `}>
          <div className="p-3 space-y-2">
            {/* Ocean Conditions Grid */}
            {report.analysis?.ocean_conditions && (
              <div className="grid grid-cols-4 gap-2 p-2 bg-black/20 rounded">
                <div className="text-center">
                  <div className="text-[10px] text-gray-400">SST</div>
                  <div className="text-xs text-cyan-400 font-medium">
                    {report.analysis.ocean_conditions.sst?.toFixed(1)}°F
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-gray-400">Gradient</div>
                  <div className="text-xs text-orange-400 font-medium">
                    {report.analysis.ocean_conditions.sst_gradient?.toFixed(1)}°/nm
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-gray-400">CHL</div>
                  <div className="text-xs text-green-400 font-medium">
                    {report.analysis.ocean_conditions.chl?.toFixed(2) || 'N/A'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-gray-400">Boats</div>
                  <div className="text-xs text-purple-400 font-medium">
                    {report.analysis.vessel_activity?.nearby_count || 0}
                  </div>
                </div>
              </div>
            )}
            
            {/* Notes */}
            {report.notes && (
              <div className="p-2 bg-black/20 rounded">
                <div className="text-[10px] text-gray-400 mb-1">Captain's Notes</div>
                <div className="text-xs text-gray-300 italic">"{report.notes}"</div>
              </div>
            )}
            
            {/* Species */}
            {report.species && (
              <div className="flex items-center gap-2">
                <Fish size={12} className="text-cyan-400" />
                <span className="text-xs text-white">Species: {report.species}</span>
              </div>
            )}
            
            {/* Recommendations */}
            {report.analysis?.recommendations && report.analysis.recommendations.length > 0 && (
              <div className="p-2 bg-cyan-500/10 rounded border border-cyan-500/20">
                <div className="text-[10px] text-cyan-400 font-medium mb-1">Intel</div>
                {report.analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="text-xs text-cyan-300/80">
                    • {rec}
                  </div>
                ))}
              </div>
            )}
            
            {/* Exact Coordinates */}
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>📍 {report.lat.toFixed(4)}°N, {report.lon.toFixed(4)}°W</span>
              <span>{new Date(report.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes expand {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-expand {
          animation: expand 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
