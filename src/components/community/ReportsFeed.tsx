/**
 * ABFI Reports Feed
 * Live feed of bite reports with 3-day rolling window
 * Shows My Reports, Inlet Reports, and ABFI Network
 */

"use client";
import { useState, useEffect } from 'react';
import { Fish, MapPin, Thermometer, Waves, Users, Clock, TrendingUp, AlertCircle, Zap, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useAppState } from '@/store/appState';

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
}

type ViewMode = 'my' | 'inlet' | 'network';

export default function ReportsFeed() {
  const [reports, setReports] = useState<BiteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('network');
  const { selectedInletId } = useAppState();
  const supabase = createClient();
  
  useEffect(() => {
    loadReports();
    
    // Subscribe to new reports
    const subscription = supabase
      .channel('bite_reports')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bite_reports'
      }, (payload) => {
        console.log('[REPORTS] New report:', payload);
        loadReports();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [viewMode, selectedInletId]);
  
  const loadReports = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      let query = supabase
        .from('bite_reports')
        .select('*')
        .gte('created_at', threeDaysAgo.toISOString())
        .eq('status', 'analyzed')
        .order('created_at', { ascending: false });
      
      // Apply filters based on view mode
      if (viewMode === 'my' && user) {
        query = query.eq('user_id', user.id);
      } else if (viewMode === 'inlet' && selectedInletId) {
        query = query.eq('inlet_id', selectedInletId);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) {
        console.error('[REPORTS] Error loading reports:', error);
        return;
      }
      
      // Process and group nearby bites into hotspots
      const processed = processReportsForHotspots(data || []);
      setReports(processed);
      
    } catch (error) {
      console.error('[REPORTS] Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Group bites into ABFI Highlights
   * ABFI Highlight = 4+ bites from same user within 1 hour
   */
  const processReportsForHotspots = (reports: any[]): BiteReport[] => {
    const processed: BiteReport[] = [];
    const userTimeGroups = new Map<string, BiteReport[]>();
    
    // Group reports by user
    reports.forEach(report => {
      const userKey = `${report.user_id}_${report.inlet_id || 'open'}`;
      if (!userTimeGroups.has(userKey)) {
        userTimeGroups.set(userKey, []);
      }
      userTimeGroups.get(userKey)!.push(report);
    });
    
    // Process each user's reports
    userTimeGroups.forEach((userReports) => {
      // Sort by time
      userReports.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Find groups of 4+ bites within 1-hour windows
      const hourGroups: BiteReport[][] = [];
      const used = new Set<string>();
      
      userReports.forEach(report => {
        if (used.has(report.bite_id)) return;
        
        // Find all reports within 1 hour of this one
        const group = userReports.filter(r => {
          const timeDiff = Math.abs(
            new Date(report.created_at).getTime() - 
            new Date(r.created_at).getTime()
          );
          return timeDiff <= 60 * 60 * 1000 && !used.has(r.bite_id);
        });
        
        if (group.length >= 4) {
          // Mark as ABFI Highlight
          group.forEach(r => used.add(r.bite_id));
          hourGroups.push(group);
        }
      });
      
      // Add highlights
      hourGroups.forEach(group => {
        const highlight = { ...group[0] };
        highlight.is_hotspot = true;
        highlight.hotspot_count = group.length;
        processed.push(highlight);
      });
      
      // Add remaining individual reports
      userReports.forEach(report => {
        if (!used.has(report.bite_id)) {
          report.is_hotspot = false;
          processed.push(report);
        }
      });
    });
    
    return processed.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };
  
  /**
   * Calculate distance between two points in meters
   */
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  };
  
  return (
    <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Fish className="text-cyan-400" size={20} />
          ABFI Intelligence Feed
        </h2>
        <div className="text-xs text-slate-400">
          Last 72 hours
        </div>
      </div>
      
      {/* View Mode Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-800/50 rounded-lg p-1">
        <button
          onClick={() => setViewMode('my')}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
            viewMode === 'my'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          My Reports
        </button>
        <button
          onClick={() => setViewMode('inlet')}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
            viewMode === 'inlet'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Inlet Reports
        </button>
        <button
          onClick={() => setViewMode('network')}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
            viewMode === 'network'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          ABFI Network
        </button>
      </div>
      
      {/* Reports List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
            <div className="text-sm text-slate-400">Loading reports...</div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Activity size={32} className="mx-auto mb-2 opacity-50" />
            <div className="text-sm">No reports yet</div>
            <div className="text-xs mt-1">Press ABFI to log your bites!</div>
          </div>
        ) : (
          reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Individual Report Card Component
 */
function ReportCard({ report }: { report: BiteReport }) {
  const isHotspot = report.is_hotspot;
  const confidence = report.analysis?.confidence_score || 0;
  
  return (
    <div className={`
      relative p-3 rounded-lg border transition-all hover:scale-[1.02] cursor-pointer
      ${isHotspot 
        ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 shadow-lg shadow-orange-500/10' 
        : 'bg-slate-800/30 border-slate-700/30 hover:border-cyan-500/30'
      }
    `}>
      {/* ABFI Highlight Badge */}
      {isHotspot && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-cyan-500/30">
          <Zap size={12} className="text-yellow-300" />
          ABFI Highlight • {report.hotspot_count} bites/hr
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {!isHotspot && (
            <Activity size={14} className="text-cyan-400 opacity-70" />
          )}
          <div className={`w-2 h-2 rounded-full ${
            confidence > 70 ? 'bg-green-400' :
            confidence > 40 ? 'bg-yellow-400' :
            'bg-slate-400'
          } animate-pulse`} />
          <span className="text-xs font-medium text-white">
            {report.user_name || 'Anonymous'}
          </span>
          {report.fish_on && (
            <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
              Fish On!
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400">
          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
        </span>
      </div>
      
      {/* Location */}
      <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
        <MapPin size={12} />
        <span>{report.inlet_name || `${report.lat.toFixed(4)}, ${report.lon.toFixed(4)}`}</span>
      </div>
      
      {/* Ocean Conditions */}
      {report.analysis?.ocean_conditions && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {report.analysis.ocean_conditions.sst && (
            <div className="flex items-center gap-1 text-xs text-cyan-400">
              <Thermometer size={12} />
              <span>{report.analysis.ocean_conditions.sst.toFixed(1)}°F</span>
            </div>
          )}
          {report.analysis.ocean_conditions.chl !== undefined && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <Waves size={12} />
              <span>{report.analysis.ocean_conditions.chl.toFixed(2)} CHL</span>
            </div>
          )}
          {report.analysis.vessel_activity?.nearby_count !== undefined && (
            <div className="flex items-center gap-1 text-xs text-orange-400">
              <Users size={12} />
              <span>{report.analysis.vessel_activity.nearby_count} boats</span>
            </div>
          )}
        </div>
      )}
      
      {/* Species if identified */}
      {report.species && (
        <div className="text-xs text-white font-medium mb-1">
          Species: {report.species}
        </div>
      )}
      
      {/* Notes */}
      {report.notes && (
        <div className="text-xs text-slate-400 italic mb-2">
          "{report.notes}"
        </div>
      )}
      
      {/* Recommendations */}
      {report.analysis?.recommendations && report.analysis.recommendations.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <div className="text-xs text-cyan-400 font-medium mb-1">Intel:</div>
          <div className="text-xs text-slate-300">
            {report.analysis.recommendations[0]}
          </div>
        </div>
      )}
      
      {/* Confidence Score */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-400">Confidence:</div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-1.5 h-3 rounded-sm ${
                  i <= Math.ceil(confidence / 20)
                    ? 'bg-cyan-400'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
        {isHotspot && (
          <TrendingUp size={14} className="text-orange-400" />
        )}
      </div>
    </div>
  );
}
