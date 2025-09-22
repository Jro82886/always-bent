/**
 * ABFI Bite Notifications
 * Selective notifications for ABFI Highlights in user's inlet
 * Avoids notification overload by only alerting on high-value events
 */

import { getSupabase } from "@/lib/supabaseClient"

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
  const supabase = getSupabase();
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
  
  // Show custom notification
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 z-[9999] animate-slide-in';
  notification.innerHTML = `
    <div class="bg-gradient-to-r from-cyan-900/95 to-blue-900/95 backdrop-blur-md rounded-lg p-3 border border-cyan-500/30 shadow-xl max-w-sm">
      <div class="flex items-start gap-3">
        <div class="p-2 bg-cyan-500/20 rounded-lg">
          <svg class="w-5 h-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div class="flex-1">
          <div class="font-semibold text-white text-sm">
            ABFI Highlight - ${report.inlet_name || report.inlet_id || 'Nearby'}
          </div>
          <div class="text-xs text-cyan-100/80 mt-1">
            ${report.user_name} is on fire! ${report.hotspot_count} bites in the last hour
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 8 seconds
  setTimeout(() => {
    notification.classList.add('animate-fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 8000);
}

/**
 * Subscribe to realtime ABFI Highlights
 */
export function subscribeToHighlights(inletId?: string) {
  const supabase = getSupabase();
  
  const channel = supabase
    .channel('abfi-highlights')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'bite_reports',
      filter: inletId ? `inlet_id=eq.${inletId}` : undefined,
    }, (payload: any) => {
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
