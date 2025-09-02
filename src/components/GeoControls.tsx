'use client';
import { useGeo } from '@/lib/useGeo';

export default function GeoControls({ showNearest=false }: { showNearest?: boolean }) {
  const { status, coords, busy, message, request } = useGeo();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={request}
        disabled={busy}
        className="rounded-md border border-cyan-300/40 px-2.5 py-1.5 text-xs text-cyan-100 bg-black/50 hover:border-cyan-200/80 disabled:opacity-60"
      >
        {busy ? 'Locating…' : status === 'granted' ? 'Refresh location' : 'Enable location'}
      </button>
      {showNearest && status === 'granted' && coords && (
        <button
          type="button"
          disabled
          title="Nearest inlet (enable after review)"
          className="rounded-md border border-white/20 px-2.5 py-1.5 text-xs text-white/80 bg-black/40 opacity-60 cursor-not-allowed"
        >
          Use nearest inlet
        </button>
      )}
      {message && <span className="text-xs text-amber-300/80">{message}</span>}
    </div>
  );
}


