'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/store/appState';

export default function RequireUsername({ children }: { children: React.ReactNode }) {
  const { username, hydrateOnce } = useAppState();
  const router = useRouter();

  useEffect(() => {
    hydrateOnce();
  }, [hydrateOnce]);

  useEffect(() => {
    if (username === null) return; // wait for hydrate
    if (!username) router.replace('/legendary?mode=welcome');
  }, [username, router]);

  if (username === null) return null;
  return <>{children}</>;
}


