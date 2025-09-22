'use client';

import { useState } from 'react';
import { Target } from 'lucide-react';
import { recordBite } from '@/lib/offline/biteDB';
import { showToast } from '@/components/ui/Toast';
import { useAppState } from '@/lib/store';

export default function AbfiBiteButton({ compact = false, context = 'tracking' as 'tracking' | 'analysis' }) {
  const [busy, setBusy] = useState(false);
  const { user, selectedInletId, userLoc, incrementPendingBites, pendingBitesCount } = useAppState();

  const handlePress = async () => {
    if (busy) return;
    setBusy(true);
    
    try {
      // Try to get GPS
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 });
      }).catch(() => null);

      let lat = pos?.coords.latitude ?? userLoc?.lat;
      let lon = pos?.coords.longitude ?? userLoc?.lon;
      let accuracy = pos?.coords.accuracy ?? userLoc?.accuracy;

      if ((!lat || !lon) && context === 'analysis') {
        // Offer manual map-center fallback (low confidence)
        const map: any = (window as any).map || (window as any).mapboxMap;
        if (map?.getCenter) {
          const center = map.getCenter();
          lat = center.lat;
          lon = center.lng;
          accuracy = 500; // low-confidence
        }
      }

      if (!lat || !lon) {
        showToast({ type: 'warning', title: 'Location Required', message: 'Enable location to log a bite.', duration: 3500 });
        setBusy(false);
        return;
      }

      await recordBite({
        user_id: user?.id || 'anonymous',
        user_name: 'Anonymous',
        lat, lon, accuracy_m: accuracy,
        inlet_id: selectedInletId || undefined,
        context: {
          layers_on: [],
          map_zoom: (window as any).map?.getZoom?.() || 8,
          vessel_count: 0
        },
        fish_on: true,
        device_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        app_version: '1.0.0'
      });

      // Increment pending badge immediately
      incrementPendingBites?.(1);

      if (navigator.onLine) {
        showToast({ type: 'success', title: 'Bite saved', message: 'Uploading…', duration: 2500 });
        const { syncBites } = await import('@/lib/offline/biteSync');
        syncBites();
      } else {
        showToast({ type: 'info', title: 'Saved offline', message: 'Will upload when back online.', duration: 4000 });
      }
    } catch (err: any) {
      const msg = err?.code === err.PERMISSION_DENIED ? 'Enable location to log a bite.' : 'Couldn’t get GPS — try again.';
      showToast({ type: 'warning', title: 'Location', message: msg, duration: 3500 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handlePress}
      disabled={busy}
      className={`relative inline-flex items-center gap-2 ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} rounded-md border border-cyan-500/40 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 transition disabled:opacity-60`}
      aria-label="Log ABFI Bite"
    >
      <Target className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>{busy ? 'Logging…' : 'ABFI'}</span>

      {pendingBitesCount > 0 && (
        <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-400 text-gray-900 border border-cyan-300/60 shadow">
          {pendingBitesCount}
        </span>
      )}
    </button>
  );
}


