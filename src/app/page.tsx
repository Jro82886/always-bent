'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAppState } from '@/store/appState';
import { nearestInlet } from '@/lib/inlets';
import { getLocation } from '@/lib/services/geo';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const { inletId, setInletId, username, setUsername } = useAppState();

  const [name, setName] = useState(username ?? '');

  useEffect(() => {
    if (username) setName(username);
  }, [username]);

  async function onUseMyLocation() {
    try {
      const res = await getLocation();
      if (!res.ok) {
        toast.error(res.message || 'Could not get location');
        return;
      }
      const inlet = nearestInlet(res.coords.lat, res.coords.lng);
      if (inlet) {
        setInletId(inlet.id);
        toast.success(`Nearest inlet set to ${inlet.name}`);
      }
    } catch (err) {
      toast.error(`Location error: ${String(err)}`);
    }
  }

  function onContinue() {
    setUsername(name.trim());
    router.push('/app');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded bg-black/30 p-6 shadow-lg">
        <div className="flex flex-col items-center">
          <Image
            src="/next.svg"
            alt="Logo"
            width={180}
            height={38}
            priority
          />
        </div>

        <label className="block text-sm font-medium text-white/70">
          Username
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring focus:ring-cyan-500"
          placeholder="Enter a username"
        />

        <button
          onClick={onContinue}
          disabled={!name.trim()}
          className="w-full rounded bg-cyan-600 py-2 text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          Continue
        </button>

        <button
          onClick={onUseMyLocation}
          className="w-full rounded bg-gray-700 py-2 text-white hover:bg-gray-600"
        >
          Use My Location
        </button>
      </div>
    </main>
  );
}