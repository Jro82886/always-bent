/**
 * Notification Manager with Throttling
 * Prevents notification spam and manages user preferences
 */

interface NotificationSettings {
  enableABFIHighlights: boolean;
  enableInletCatches: boolean;
  enableDirectMessages: boolean;
  soundEnabled: boolean;
  maxNotificationsPerHour: number;
}

interface NotificationRecord {
  timestamp: number;
  type: 'abfi' | 'inlet' | 'dm' | 'system';
  shown: boolean;
}

class NotificationManager {
  private static instance: NotificationManager;
  private notificationHistory: NotificationRecord[] = [];
  private settings: NotificationSettings;
  private lastCleanup: number = Date.now();
  
  private constructor() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('abfi_notification_settings');
    this.settings = savedSettings ? JSON.parse(savedSettings) : {
      enableABFIHighlights: true,
      enableInletCatches: true,
      enableDirectMessages: true,
      soundEnabled: false,
      maxNotificationsPerHour: 10 // Default throttle: 10 per hour
    };
  }
  
  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }
  
  /**
   * Update notification settings
   */
  updateSettings(settings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...settings };
    localStorage.setItem('abfi_notification_settings', JSON.stringify(this.settings));
  }
  
  /**
   * Get current settings
   */
  getSettings(): NotificationSettings {
    return this.settings;
  }
  
  /**
   * Check if we can show a notification (throttling)
   */
  private canShowNotification(type: 'abfi' | 'inlet' | 'dm' | 'system'): boolean {
    // Check if this type is enabled
    if (type === 'abfi' && !this.settings.enableABFIHighlights) return false;
    if (type === 'inlet' && !this.settings.enableInletCatches) return false;
    if (type === 'dm' && !this.settings.enableDirectMessages) return false;
    
    // Clean up old records (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.notificationHistory = this.notificationHistory.filter(
      record => record.timestamp > oneHourAgo
    );
    
    // Count recent notifications
    const recentCount = this.notificationHistory.filter(r => r.shown).length;
    
    // Check throttle limit
    if (recentCount >= this.settings.maxNotificationsPerHour) {
      console.log(`[Notifications] Throttled: ${recentCount}/${this.settings.maxNotificationsPerHour} shown in last hour`);
      return false;
    }
    
    // Check for duplicate notifications in last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentSameType = this.notificationHistory.filter(
      r => r.type === type && r.timestamp > fiveMinutesAgo && r.shown
    );
    
    if (recentSameType.length > 0) {
      console.log(`[Notifications] Skipping duplicate ${type} notification within 5 minutes`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Show a notification with throttling
   */
  showNotification(
    type: 'abfi' | 'inlet' | 'dm' | 'system',
    title: string,
    message: string,
    options?: {
      icon?: string;
      duration?: number;
      onClick?: () => void;
      priority?: 'low' | 'normal' | 'high';
    }
  ): boolean {
    // Record attempt
    this.notificationHistory.push({
      timestamp: Date.now(),
      type,
      shown: false
    });
    
    // Check if we can show it
    if (!this.canShowNotification(type)) {
      return false;
    }
    
    // Mark as shown
    this.notificationHistory[this.notificationHistory.length - 1].shown = true;
    
    // Priority determines duration
    const duration = options?.duration || 
      (options?.priority === 'high' ? 7000 : 
       options?.priority === 'low' ? 3000 : 5000);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.setAttribute('data-priority', options?.priority || 'normal');
    
    // Different styles for different types
    const typeStyles = {
      abfi: 'from-cyan-600 to-blue-600 border-cyan-400/30',
      inlet: 'from-green-600 to-teal-600 border-green-400/30',
      dm: 'from-purple-600 to-indigo-600 border-purple-400/30',
      system: 'from-gray-600 to-slate-600 border-gray-400/30'
    };
    
    notification.innerHTML = `
      <div class="notification-content bg-gradient-to-r ${typeStyles[type]} text-white rounded-lg shadow-2xl p-4 max-w-sm border">
        <div class="flex items-start gap-3">
          ${options?.icon ? `
            <div class="p-2 bg-white/20 rounded-lg">
              ${options.icon}
            </div>
          ` : ''}
          <div class="flex-1">
            <div class="font-bold text-sm mb-1">${title}</div>
            <div class="text-xs opacity-90">${message}</div>
          </div>
          <button onclick="this.closest('.notification-toast').remove()" class="text-white/60 hover:text-white">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    // Add click handler
    if (options?.onClick) {
      notification.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).closest('button')) {
          options.onClick!();
          notification.remove();
        }
      });
      notification.style.cursor = 'pointer';
    }
    
    // Add to container (create if doesn't exist)
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'fixed top-20 right-4 z-[99999] space-y-2';
      document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('notification-show');
    });
    
    // Play sound if enabled
    if (this.settings.soundEnabled) {
      this.playNotificationSound(type);
    }
    
    // Auto-remove after duration
    setTimeout(() => {
      notification.classList.add('notification-hide');
      setTimeout(() => notification.remove(), 300);
    }, duration);
    
    return true;
  }
  
  /**
   * Play notification sound
   */
  private playNotificationSound(type: string) {
    // Could implement different sounds for different types
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignore errors if audio fails
  }
  
  /**
   * Get notification statistics
   */
  getStats() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recent = this.notificationHistory.filter(r => r.timestamp > oneHourAgo);
    
    return {
      shownLastHour: recent.filter(r => r.shown).length,
      throttledLastHour: recent.filter(r => !r.shown).length,
      maxPerHour: this.settings.maxNotificationsPerHour
    };
  }
}

// Add CSS for notifications if not already present
if (typeof document !== 'undefined' && !document.getElementById('notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    .notification-toast {
      transform: translateX(400px);
      opacity: 0;
      transition: all 0.3s ease-out;
    }
    .notification-toast.notification-show {
      transform: translateX(0);
      opacity: 1;
    }
    .notification-toast.notification-hide {
      transform: translateX(400px);
      opacity: 0;
    }
    .notification-toast[data-priority="high"] {
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: translateX(0) scale(1); }
      50% { transform: translateX(0) scale(1.02); }
    }
  `;
  document.head.appendChild(style);
}

export default NotificationManager;
export type { NotificationSettings };
