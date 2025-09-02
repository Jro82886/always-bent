'use client';

import { useCallback, useEffect, useState } from 'react';

export type GeoStatus = 'idle' | 'prompt' | 'granted' | 'denied' | 'error';
type Coords = { lat: number; lon: number } | null;

export function useGeo() {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [coords, setCoords] = useState<Coords>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('abfi_location');
      if (raw) {
        const { lat, lon } = JSON.parse(raw);
        if (typeof lat === 'number' && typeof lon === 'number') {
          setCoords({ lat, lon });
          setStatus('granted');
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const anyNav: any = navigator;
    if (anyNav?.permissions?.query) {
      anyNav.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((p: PermissionStatus) => {
          const sync = () => {
            if (p.state === 'granted') setStatus('granted');
            else if (p.state === 'denied') setStatus('denied');
            else setStatus('prompt');
          };
          sync();
          p.onchange = sync;
        })
        .catch(() => setStatus('prompt'));
    } else {
      setStatus('prompt');
    }
  }, []);

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setMessage('Geolocation is not supported by this browser.');
      return;
    }
    setBusy(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoords({ lat, lon });
        setStatus('granted');
        localStorage.setItem('abfi_location', JSON.stringify({ lat, lon, ts: Date.now() }));
        setBusy(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          setMessage('Location permission denied. Enable it in site/browser settings to use Tracking.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setStatus('error');
          setMessage('Location unavailable. Try again outdoors or check your network.');
        } else if (err.code === err.TIMEOUT) {
          setStatus('error');
          setMessage('Location timed out. Try again.');
        } else {
          setStatus('error');
          setMessage("Couldn’t get location.");
        }
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem('abfi_location');
    setCoords(null);
    setStatus('prompt');
    setMessage(null);
  }, []);

  return { status, coords, busy, message, request, clear };
}


