// src/app/welcome/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import BrandMark from '@/components/BrandMark';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/store/appState';
import { DEFAULT_INLET } from '@/lib/inlets';

type GeoStatus = 'idle' | 'prompt' | 'granted' | 'denied' | 'error';

export default function Welcome() {
  const router = useRouter();
  const { setUsername: setUsernameStore, hydrateOnce, setSelectedInletId } = useAppState();

  const [username, setUsername] = useState('');
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    hydrateOnce();
    const saved = localStorage.getItem('abfi_username') || '';
    if (saved) setUsername(saved);

    const savedGeo = localStorage.getItem('abfi_location');
    if (savedGeo) {
      try {
        const { lat, lon } = JSON.parse(savedGeo);
        setCoords({ lat, lon });
        setGeoStatus('granted');
      } catch {}
    }
  }, []);

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('error');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoords({ lat, lon });
        localStorage.setItem('abfi_location', JSON.stringify({ lat, lon, ts: Date.now() }));
        setGeoStatus('granted');
        setBusy(false);
      },
      () => {
        setGeoStatus('denied');
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const onContinue = () => {
    const clean = username.trim();
    if (!clean) return;
    try { localStorage.setItem('abfi_username', clean); } catch {}
    setUsernameStore(clean);
    try { localStorage.removeItem('abfi_selected_inlet'); } catch {}
    setSelectedInletId(DEFAULT_INLET.id);
    router.push('/imagery');
  };

  const canContinue = useMemo(() => username.trim().length > 0, [username]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0C0F1C] to-black text-white">
      {/* Subtle background contrast layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(0,221,235,0.22) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 30%, rgba(0,221,235,0.24) 0%, rgba(0,0,0,0) 60%)',
        }}
      />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 text-center">
        
        {/* Brand */}
        <div className="mb-10 flex flex-col items-center">
          <BrandMark className="h-20 w-auto sm:h-24 md:h-28 brand-glow-xl" />
          <p className="mt-4 text-sm sm:text-base text-cyan-200/80 tracking-wide">
            Precision fishing starts here.
          </p>
        </div>

        

        {/* Username input */}
        <div className="mb-4 w-full">
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username (boat name recommended)"
            className="w-full rounded-xl border border-cyan-400/30 bg-white/5 px-4 py-3 text-base text-white outline-none placeholder:text-cyan-200/50 focus:border-cyan-300/80"
          />
        </div>

        {/* Location */}
        <div className="mb-6 w-full rounded-xl border border-cyan-400/20 bg-white/5 p-4 text-left backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/90">Location</span>
            <StatusPill status={geoStatus} />
          </div>
          {coords && (
            <p className="text-xs text-white/60">
              {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
            </p>
          )}
          <button
            type="button"
            onClick={requestLocation}
            disabled={busy}
            className="mt-3 rounded-lg border border-cyan-300/40 px-3 py-2 text-sm text-cyan-200 hover:border-cyan-200/80 hover:text-cyan-100 disabled:opacity-60"
          >
            {busy ? 'Getting location…' : geoStatus === 'granted' ? 'Refresh location' : 'Enable location'}
          </button>
        </div>

        {/* Main button */}
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full rounded-2xl px-5 py-3 text-base font-medium text-black disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg, #00DDEB 0%, #00AACC 100%)' }}
        >
          Analyze Ocean Data
        </button>

        {/* No guest path; username required */}
      </section>
    </main>
  );
}

function StatusPill({ status }: { status: GeoStatus }) {
  const map: Record<GeoStatus, { label: string; dot: string; tone: string }> = {
    idle:   { label: 'Idle', dot: 'bg-white/40', tone: 'text-white/70 border-white/20' },
    prompt: { label: 'Needs permission', dot: 'bg-amber-400', tone: 'text-amber-200 border-amber-400/30' },
    granted:{ label: 'Enabled', dot: 'bg-emerald-400', tone: 'text-emerald-200 border-emerald-400/30' },
    denied: { label: 'Denied', dot: 'bg-rose-400', tone: 'text-rose-200 border-rose-400/30' },
    error:  { label: 'Not supported', dot: 'bg-rose-400', tone: 'text-rose-200 border-rose-400/30' },
  };
  const { label, dot, tone } = map[status] ?? map.idle;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${tone}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

