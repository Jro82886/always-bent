'use client';

import { useState, useEffect } from 'react';
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

  // Keyboard: B triggers (when not typing in an input)
  // Mount once per page; safe in multiple instances due to idempotent handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const editing = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;
      if (!editing && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        handlePress();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePress]);

  return (
    <button
      onClick={handlePress}
      disabled={busy}
      className="abfi-pill"
      title="Record a bite (B)"
      aria-label="Log ABFI Bite"
      data-abfi-button
    >
      <span className="dot" />
      <span>{busy ? 'Logging…' : 'ABFI Bite'}</span>
      {pendingBitesCount > 0 && (
        <span className="abfi-badge">{pendingBitesCount}</span>
      )}
    </button>
  );
}


