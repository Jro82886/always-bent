// src/app/welcome/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type GeoStatus = 'idle' | 'prompt' | 'granted' | 'denied' | 'error';

export default function Welcome() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
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
    localStorage.setItem('abfi_username', username.trim());
    router.push('/imagery');
  };

  const canContinue = useMemo(() => username.trim().length > 0, [username]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0C0F1C] to-black text-white">
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 text-center">
        
        {/* Logo */}
        <div className="mb-6 animate-[fadeIn_800ms_ease]">
          <Image
            src="/abfi_logo.png"
            alt="ABFI Logo"
            width={220}
            height={220}
            priority
          />
        </div>

        {/* Tagline */}
        <p className="mb-2 text-cyan-300/80 tracking-[0.22em] text-sm">
          ALWAYS BENT FISHING INTELLIGENCE
        </p>

        {/* Slogan */}
        <h2 className="mb-8 text-xl font-semibold text-white">
          Precision fishing starts here.
        </h2>

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

        {/* Guest */}
        <button
          onClick={() => router.push('/imagery')}
          className="mt-4 text-sm text-white/70 hover:text-white underline"
        >
          Continue as Guest
        </button>
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

