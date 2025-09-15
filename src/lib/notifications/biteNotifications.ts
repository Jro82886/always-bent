/**
 * ABFI Bite Notifications
 * Selective notifications for ABFI Highlights in user's inlet
 * Avoids notification overload by only alerting on high-value events
 */

import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface NotificationPreferences {
  enableHighlights: boolean;
  myInletOnly: boolean;
  minBitesForAlert: number;
}

// Default preferences - can be stored in localStorage or user profile
const DEFAULT_PREFS: NotificationPreferences = {
  enableHighlights: true,
  myInletOnly: true,
  minBitesForAlert: 4, // ABFI Highlight threshold
};

/**
 * Get user's notification preferences
 */
export function getNotificationPrefs(): NotificationPreferences {
  const stored = localStorage.getItem('abfi_notification_prefs');
  if (stored) {
    return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  }
  return DEFAULT_PREFS;
}

/**
 * Save notification preferences
 */
export function saveNotificationPrefs(prefs: Partial<NotificationPreferences>) {
  const current = getNotificationPrefs();
  const updated = { ...current, ...prefs };
  localStorage.setItem('abfi_notification_prefs', JSON.stringify(updated));
  return updated;
}

/**
 * Check if a report should trigger a notification
 */
export function shouldNotify(report: any, userInletId?: string): boolean {
  const prefs = getNotificationPrefs();
  
  // Only notify for highlights
  if (!prefs.enableHighlights) return false;
  
  // Check if it's an ABFI Highlight
  if (!report.is_hotspot || report.hotspot_count < prefs.minBitesForAlert) {
    return false;
  }
  
  // Check inlet preference
  if (prefs.myInletOnly && report.inlet_id !== userInletId) {
    return false;
  }
  
  // Don't notify for own reports
  const supabase = createClient();
  const userId = (window as any).__ABFI_USER_ID__;
  if (report.user_id === userId) {
    return false;
  }
  
  return true;
}

/**
 * Show notification for ABFI Highlight
 */
export function showHighlightNotification(report: any) {
  // Check if we should show this notification
  const userInlet = localStorage.getItem('abfi_selected_inlet');
  if (!shouldNotify(report, userInlet || undefined)) {
    return;
  }
  
  // Throttle notifications - max 1 per minute
  const lastNotif = localStorage.getItem('abfi_last_notification');
  if (lastNotif) {
    const timeSince = Date.now() - parseInt(lastNotif);
    if (timeSince < 60000) return; // Less than 1 minute
  }
  localStorage.setItem('abfi_last_notification', Date.now().toString());
  
  // Show toast notification
  toast.custom((t) => (
    <div className="bg-gradient-to-r from-cyan-900/95 to-blue-900/95 backdrop-blur-md rounded-lg p-3 border border-cyan-500/30 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <svg className="w-5 h-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-white text-sm flex items-center gap-2">
            ABFI Highlight
            <span className="text-xs bg-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full">
              {report.inlet_name || report.inlet_id}
            </span>
          </div>
          <div className="text-xs text-cyan-100/80 mt-1">
            {report.user_name} is on fire! {report.hotspot_count} bites in the last hour
          </div>
          {report.analysis?.ocean_conditions && (
            <div className="flex gap-3 mt-2 text-xs text-cyan-200/60">
              {report.analysis.ocean_conditions.sst && (
                <span>{report.analysis.ocean_conditions.sst.toFixed(1)}°F</span>
              )}
              {report.analysis.ocean_conditions.distance_to_edge && (
                <span>Edge: {(report.analysis.ocean_conditions.distance_to_edge / 1000).toFixed(1)}km</span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            // Navigate to reports tab
            const event = new CustomEvent('abfi:navigate', { 
              detail: { tab: 'community', subtab: 'reports' } 
            });
            window.dispatchEvent(event);
            toast.dismiss(t);
          }}
          className="text-cyan-300 hover:text-cyan-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  ), {
    duration: 8000,
    position: 'top-right',
  });
}

/**
 * Subscribe to realtime ABFI Highlights
 */
export function subscribeToHighlights(inletId?: string) {
  const supabase = createClient();
  
  const channel = supabase
    .channel('abfi-highlights')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'bite_reports',
      filter: inletId ? `inlet_id=eq.${inletId}` : undefined,
    }, (payload) => {
      // Check if it's a highlight
      if (payload.new && payload.new.is_hotspot) {
        showHighlightNotification(payload.new);
      }
    })
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}
