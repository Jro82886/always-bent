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
        localStorage.setItem('abfi_app_mode', 'community');
        // Set cookie and go to community
        await fetch('/api/session/onboard', { method: 'POST' });
        router.replace('/legendary/community/reports');
      } else if (key === 'solo-mode') {
        localStorage.setItem('abfi_app_mode', 'solo');
        // Set cookie and go to analysis
        await fetch('/api/session/onboard', { method: 'POST' });
        router.replace('/legendary/analysis');
      } else if (key === 'enter-abfi') {
        // Set cookie and go to main app
        await fetch('/api/session/onboard', { method: 'POST' });
        router.replace('/legendary/analysis');
      } else if (key === 'take-tour') {
        // For now, just go to analysis
        await fetch('/api/session/onboard', { method: 'POST' });
        router.replace('/legendary/analysis');
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [router, demo]);

  return null;
}
