'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function WelcomeHydrate() {
  const router = useRouter();
  const q = useSearchParams();
  const demo = q.get('demo') === 'true'; // demo can show welcome even if onboarded

  useEffect(() => {
    const onClick = async (e: Event) => {
      const t = e.target as HTMLElement | null;
      const key = t?.getAttribute?.('data-abfi') || null;
      if (!key) return;

      if (key === 'join-community') {
        localStorage.setItem('abfi_app_mode', 'community'); // UI hint only
      } else if (key === 'solo-mode') {
        localStorage.setItem('abfi_app_mode', 'solo');      // UI hint only
      } else if (key === 'enter-abfi') {
        // ✅ set server cookie, then go to /legendary
        await fetch('/api/session/onboard', { method: 'POST' });
        router.replace('/legendary');
      } else if (key === 'take-tour') {
        router.replace('/legendary/welcome?demo=true'); // optional
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [router, demo]);

  return null;
}
