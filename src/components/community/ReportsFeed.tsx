/**
 * ABFI Reports Feed - TEXT ONLY
 * Live feed of written analysis reports (no map data)
 * Shows digested, written summaries from SnipTool analysis
 * READ-ONLY viewing - no interaction with maps
 */

"use client";
import { useState, useEffect } from 'react';
import { Fish, MapPin, Thermometer, Waves, Users, Clock, TrendingUp, AlertCircle, Zap, Activity, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useAppState } from '@/store/appState';
import CompactReportCard from './CompactReportCard';

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

type ViewMode = 'my' | 'inlet' | 'network';

export default function ReportsFeed() {
  // Ensure this is text-only - no map interactions
  useEffect(() => {
    // Safety flag to prevent any map code from running
    if (typeof window !== 'undefined') {
      (window as any).__reportsTextOnlyMode = true;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__reportsTextOnlyMode;
      }
    };
  }, []);
  
  const [reports, setReports] = useState<BiteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('network');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const { selectedInletId } = useAppState();
  const supabase = createClient();
  
  // Get filter params from URL
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const activeTab = searchParams?.get('tab') || 'all';
  const speciesFilter = searchParams?.get('species') || 'all';
  const dateFilter = searchParams?.get('date') || 'week';
  
  useEffect(() => {
    loadReports();
    
    // Subscribe to new reports for real-time updates
    const subscription = supabase
      .channel('bite_reports')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bite_reports'
      }, (payload) => {
        
        // Add new report to the top without full reload
        setReports(prev => {
          const newReport = payload.new as BiteReport;
          // Check if it matches current filters
          if (shouldShowReport(newReport, viewMode, selectedInletId)) {
            return [newReport, ...prev].slice(0, 100); // Keep max 100 reports
          }
          return prev;
        });
        setLastUpdate(Date.now());
      })
      .subscribe();
    
    // Auto-refresh every 30 seconds if enabled
    let refreshInterval: NodeJS.Timeout;
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        loadReports();
        setLastUpdate(Date.now());
      }, 30000);
    }
    
    return () => {
      subscription.unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [viewMode, selectedInletId, autoRefresh]);
  
  // Helper to check if report matches current filters
  const shouldShowReport = (report: BiteReport, mode: ViewMode, inletId?: string) => {
    const currentUser = localStorage.getItem('abfi_username');
    
    if (mode === 'my' && currentUser) {
      return report.user_id === currentUser || report.user_name === currentUser;
    } else if (mode === 'inlet' && inletId) {
      return report.inlet_id === inletId;
    } else if (mode === 'network') {
      return report.is_hotspot || report.is_abfi_highlight || 
             (report.analysis?.confidence_score && report.analysis.confidence_score > 70);
    }
    return true;
  };
  
  const loadReports = async () => {
    setLoading(true);
    
    try {
      // Try to load from Supabase first
      let supabaseReports: BiteReport[] = [];
      let hasSupabase = false;
      
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
        
        if (!error && data) {
          supabaseReports = data;
          hasSupabase = true;
        }
      } catch (e) {
        
      }
      
      // Also load from localStorage for testing
      const localReports = JSON.parse(localStorage.getItem('abfi_community_reports') || '[]');
      
      // Combine and deduplicate reports
      const allReports = [...supabaseReports];
      const seenIds = new Set(supabaseReports.map(r => r.bite_id));
      
      // Add local reports that aren't already in Supabase
      localReports.forEach((report: BiteReport) => {
        if (!seenIds.has(report.bite_id)) {
          allReports.push(report);
        }
      });
      
      // Filter by view mode for local reports
      let filteredReports = allReports;
      const currentUser = localStorage.getItem('abfi_username');
      
      if (viewMode === 'my' && currentUser) {
        filteredReports = allReports.filter(r => 
          r.user_id === currentUser || r.user_name === currentUser
        );
      } else if (viewMode === 'inlet' && selectedInletId) {
        filteredReports = allReports.filter(r => r.inlet_id === selectedInletId);
      } else if (viewMode === 'network') {
        // Show ABFI highlights for network view
        filteredReports = allReports.filter(r => 
          r.is_hotspot || r.is_abfi_highlight || 
          (r.analysis?.confidence_score && r.analysis.confidence_score > 70)
        );
      }
      
      // Process and group nearby bites into hotspots
      const processed = processReportsForHotspots(filteredReports);
      setReports(processed);
      
    } catch (error) {
      
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
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-1.5 rounded transition-all ${
              autoRefresh 
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
            }`}
            title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Auto-refresh OFF'}
          >
            <RefreshCw size={14} className={autoRefresh ? 'animate-spin-slow' : ''} />
          </button>
          
          {/* Report count */}
          <div className="text-xs text-slate-400">
            {reports.length} reports • Last 72hr
          </div>
          
          {/* Last update indicator */}
          <div className="text-xs text-cyan-400/60">
            Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
          </div>
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
      
      {/* Reports List - Compact View */}
      <div className="max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
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
          <div className="space-y-0">
            {reports.map((report) => (
              <CompactReportCard key={report.bite_id || report.id} report={report} />
            ))}
          </div>
        )}
      </div>
      
      {/* Add custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

