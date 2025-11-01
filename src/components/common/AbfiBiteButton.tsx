'use client';

import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import dynamic from 'next/dynamic';
import { recordBite } from '@/lib/offline/biteDB';
import { showToast } from '@/components/ui/Toast';
import { useAppState } from '@/lib/store';
import '@/components/abfi.css';

// Dynamically import the BiteReportCard to avoid SSR issues
const BiteReportCard = dynamic(() => import('@/components/reports/BiteReportCard'), { ssr: false });

export default function AbfiBiteButton({ compact = false, context = 'tracking' as 'tracking' | 'analysis' }) {
  const [busy, setBusy] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [lastBiteReport, setLastBiteReport] = useState<any>(null);
  const { user, selectedInletId, userLoc, incrementPendingBites, pendingBitesCount } = useAppState();

  const handlePress = async () => {
    if (busy) return;
    setBusy(true);

    try {
      // Get user ID - prioritize Supabase user ID over app state
      const userId =
        localStorage.getItem('abfi_supabase_user_id') ||  // Supabase user (authenticated)
        user?.id ||                                        // App state user
        'anonymous';                                       // Fallback

      // Let recordBite handle GPS + map-center fallback internally
      const layersOn: string[] = [];
      const biteRecord = await recordBite({
        user_id: userId,
        user_name: 'Anonymous',
        inlet_id: selectedInletId || undefined,
        layers_on: layersOn,
        fish_on: true,
      });

      // Create report data
      const report = {
        id: biteRecord.bite_id,
        timestamp: new Date(biteRecord.created_at_ms).toISOString(),
        location: { lat: biteRecord.lat, lng: biteRecord.lon },
        species: biteRecord.species,
        notes: biteRecord.notes
      };

      setLastBiteReport(report);
      setShowReport(true);

      // Increment pending badge immediately
      incrementPendingBites?.(1);

      if (navigator.onLine) {
        showToast({ type: 'success', title: 'Bite saved', message: 'Analyzing conditions...', duration: 2500 });
        const { syncBites } = await import('@/lib/offline/biteSync');
        syncBites();
      } else {
        showToast({ type: 'info', title: 'Saved offline', message: 'Will upload when back online.', duration: 4000 });
      }
    } catch (err: any) {
      const denied = typeof err?.code !== 'undefined' && err.code === (navigator as any).geolocation?.PERMISSION_DENIED;
      const msg = denied ? 'Enable location to log a bite.' : 'Could not get GPS - try again.';
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

  const handleShare = () => {
    // Share the bite report
    if (navigator.share && lastBiteReport) {
      navigator.share({
        title: 'ABFI Bite Report',
        text: `Recorded a bite at ${lastBiteReport.location.lat.toFixed(4)}, ${lastBiteReport.location.lng.toFixed(4)}`,
        url: window.location.href
      }).catch(() => {
        showToast({ type: 'info', title: 'Share', message: 'Copied to clipboard', duration: 2000 });
      });
    }
  };

  const handleAddCatch = () => {
    setShowReport(false);
    showToast({ type: 'info', title: 'Add Catch', message: 'Feature coming soon!', duration: 2000 });
  };

  return (
    <>
      <button
        onClick={handlePress}
        disabled={busy}
        className="abfi-pill"
        title="Record a bite (B)"
        aria-label="Log ABFI Bite"
        data-abfi-button
      >
        <span className="dot" />
        <span>{busy ? 'Logging...' : 'ABFI Bite'}</span>
        {pendingBitesCount > 0 && (
          <span className="abfi-badge">{pendingBitesCount}</span>
        )}
      </button>

      {/* Show bite report card */}
      {showReport && lastBiteReport && (
        <BiteReportCard
          report={lastBiteReport}
          onClose={() => setShowReport(false)}
          onShare={handleShare}
          onAddCatch={handleAddCatch}
        />
      )}
    </>
  );
}


