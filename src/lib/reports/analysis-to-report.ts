/**
 * Convert saved analysis to community report format
 * Implements Jeff's ABFI highlight logic
 */

import { createClient } from '@/lib/supabase/client';

interface AnalysisData {
  geometry: GeoJSON.Polygon;
  conditions: {
    sst_min: number;
    sst_max: number;
    sst_gradient_max: number;
    time_of_day: string;
  };
  detected_features: Array<{
    type: string;
    strength: number;
    confidence: number;
  }>;
  report_text: string;
  primary_hotspot?: GeoJSON.Point;
  hotspot_confidence: number;
  success_prediction: number;
  layers_active: string[];
  timestamp: string;
  user_id: string;
  inlet_id?: string;
  is_test_data?: boolean;
}

interface CommunityReport {
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
  is_abfi_highlight?: boolean;
  highlight_reason?: string;
}

/**
 * Jeff's ABFI Highlight Logic
 * Report gets featured on ABFI Network if:
 * 1. Multiple bites (4+ in an hour)
 * 2. Strong SST gradient (> 2°F/nm)
 * 3. High confidence score (> 80%)
 * 4. Convergence of multiple features
 */
export function checkABFIHighlight(analysis: AnalysisData): {
  isHighlight: boolean;
  reason?: string;
} {
  const reasons: string[] = [];
  
  // Check for strong SST gradient (temp break)
  if (analysis.conditions.sst_gradient_max > 2.0) {
    reasons.push(`Strong temp break: ${analysis.conditions.sst_gradient_max.toFixed(1)}°F/nm`);
  }
  
  // Check for high confidence hotspot
  if (analysis.hotspot_confidence > 0.8) {
    reasons.push(`High confidence hotspot: ${(analysis.hotspot_confidence * 100).toFixed(0)}%`);
  }
  
  // Check for multiple strong features
  const strongFeatures = analysis.detected_features.filter(f => f.confidence > 0.7);
  if (strongFeatures.length >= 2) {
    reasons.push(`${strongFeatures.length} converging features`);
  }
  
  // Check success prediction
  if (analysis.success_prediction > 0.75) {
    reasons.push(`High success prediction: ${(analysis.success_prediction * 100).toFixed(0)}%`);
  }
  
  return {
    isHighlight: reasons.length >= 2, // Need at least 2 criteria
    reason: reasons.join(' • ')
  };
}

/**
 * Convert analysis to community report format
 */
export async function analysisToReport(analysis: AnalysisData): Promise<CommunityReport> {
  // Get center of analysis area or use hotspot location
  let lat: number, lon: number;
  
  if (analysis.primary_hotspot) {
    [lon, lat] = analysis.primary_hotspot.coordinates;
  } else {
    // Calculate center of polygon
    const coords = analysis.geometry.coordinates[0];
    lat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
    lon = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
  }
  
  // Check ABFI highlight criteria
  const { isHighlight, reason } = checkABFIHighlight(analysis);
  
  // Extract key recommendations from report text
  const recommendations: string[] = [];
  if (analysis.report_text.includes('HOT ZONE')) {
    recommendations.push('🔥 HOT ZONE detected - Prime fishing conditions!');
  }
  if (analysis.report_text.includes('WARM ZONE')) {
    recommendations.push('🎯 WARM ZONE - Good potential, worth checking');
  }
  if (analysis.conditions.sst_gradient_max > 1.5) {
    recommendations.push(`Temperature break of ${analysis.conditions.sst_gradient_max.toFixed(1)}°F/nm detected`);
  }
  
  // Build community report
  const report: CommunityReport = {
    id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    bite_id: `bite_${Date.now()}`,
    user_id: analysis.user_id,
    user_name: analysis.user_id === 'anonymous' ? 'Anonymous Captain' : analysis.user_id,
    created_at: analysis.timestamp,
    lat,
    lon,
    inlet_id: analysis.inlet_id,
    inlet_name: analysis.inlet_id ? getInletName(analysis.inlet_id) : undefined,
    notes: `Analysis Report: ${analysis.conditions.time_of_day} conditions`,
    fish_on: analysis.success_prediction > 0.6,
    analysis: {
      ocean_conditions: {
        sst: (analysis.conditions.sst_min + analysis.conditions.sst_max) / 2,
        sst_gradient: analysis.conditions.sst_gradient_max,
        distance_to_edge: analysis.detected_features.find(f => f.type === 'edge')?.strength || 0
      },
      confidence_score: analysis.hotspot_confidence * 100,
      recommendations
    },
    is_abfi_highlight: isHighlight,
    highlight_reason: reason
  };
  
  return report;
}

/**
 * Save analysis as community report
 */
export async function saveAnalysisAsReport(analysis: AnalysisData): Promise<void> {
  const report = await analysisToReport(analysis);
  
  // Save to localStorage for testing
  const existingReports = JSON.parse(localStorage.getItem('abfi_community_reports') || '[]');
  existingReports.unshift(report); // Add to beginning
  
  // Keep only last 100 reports
  if (existingReports.length > 100) {
    existingReports.length = 100;
  }
  
  localStorage.setItem('abfi_community_reports', JSON.stringify(existingReports));
  
  // If ABFI highlight, trigger notification
  if (report.is_abfi_highlight) {
    notifyABFIHighlight(report);
  }
  
  // Try to save to Supabase if available
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('bite_reports')
      .insert({
        bite_id: report.bite_id,
        user_id: report.user_id,
        user_name: report.user_name,
        created_at: report.created_at,
        lat: report.lat,
        lon: report.lon,
        inlet_id: report.inlet_id,
        inlet_name: report.inlet_name,
        notes: report.notes,
        fish_on: report.fish_on,
        analysis: report.analysis,
        status: 'analyzed',
        is_hotspot: report.is_abfi_highlight,
        hotspot_count: report.is_abfi_highlight ? 1 : 0
      });
      
    if (error) {
      console.warn('[Reports] Supabase save failed:', error);
    } else {
      console.log('[Reports] Saved to Supabase successfully');
    }
  } catch (e) {
    console.warn('[Reports] Supabase not configured, using local storage only');
  }
}

/**
 * Notify about ABFI highlight
 */
function notifyABFIHighlight(report: CommunityReport) {
  // Create notification badge
  const notification = document.createElement('div');
  notification.className = 'fixed top-20 right-4 z-[99999] animate-slide-in';
  notification.innerHTML = `
    <div class="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg shadow-2xl p-4 max-w-sm border border-cyan-400/30">
      <div class="flex items-start gap-3">
        <div class="p-2 bg-white/20 rounded-lg">
          <svg class="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/>
          </svg>
        </div>
        <div class="flex-1">
          <div class="font-bold text-sm mb-1">🎯 ABFI Network Highlight!</div>
          <div class="text-xs opacity-90">${report.highlight_reason}</div>
          ${report.inlet_name ? `<div class="text-xs mt-1 opacity-80">📍 ${report.inlet_name}</div>` : ''}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('animate-slide-out');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

/**
 * Get inlet name from ID
 */
function getInletName(inletId: string): string {
  // This would normally come from your inlets data
  const inletMap: Record<string, string> = {
    'nj-manasquan': 'Manasquan Inlet',
    'ny-montauk': 'Montauk Point',
    'nc-oregon': 'Oregon Inlet',
    'fl-jupiter': 'Jupiter Inlet',
    // Add more as needed
  };
  
  return inletMap[inletId] || inletId;
}

// Add CSS for animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slide-out {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
    .animate-slide-out {
      animation: slide-out 0.3s ease-in;
    }
  `;
  document.head.appendChild(style);
}
