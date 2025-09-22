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
      // Let recordBite handle GPS + map-center fallback internally
      const layersOn: string[] = [];
      await recordBite({
        user_id: user?.id || 'anonymous',
        user_name: 'Anonymous',
        inlet_id: selectedInletId || undefined,
        layers_on: layersOn,
        fish_on: true,
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
      const denied = typeof err?.code !== 'undefined' && err.code === (navigator as any).geolocation?.PERMISSION_DENIED;
      const msg = denied ? 'Enable location to log a bite.' : 'Couldn’t get GPS — try again.';
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


