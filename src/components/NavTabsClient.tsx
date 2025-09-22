'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppState } from '@/lib/store';

/**
 * NavTabsClient - Navigation tabs that determine active state from pathname
 * instead of searchParams to avoid SSR issues and enable static optimization
 */
export default function NavTabsClient() {
  const pathname = usePathname();
  const { username, hydrateOnce, communityBadge, setCommunityBadge } = useAppState();
  const [locationEnabled, setLocationEnabled] = useState(false);
  
  // Determine current mode from pathname instead of searchParams
  const getCurrentMode = () => {
    if (pathname?.includes('/legendary/analysis')) return 'analysis';
    if (pathname?.includes('/legendary/tracking')) return 'tracking';
    if (pathname?.includes('/legendary/trends')) return 'trends';
    if (pathname?.includes('/legendary/community')) return 'community';
    if (pathname === '/legendary') return 'analysis'; // default
    return 'analysis';
  };
  
  const currentMode = getCurrentMode();
  
  useEffect(() => { 
    hydrateOnce(); 
    // Check if location services are enabled
    const enabled = localStorage.getItem('abfi_location_enabled') === 'true';
    setLocationEnabled(enabled);
  }, [hydrateOnce]);
  
  // Build tabs based on permissions
  const TABS = [
    { href: '/legendary?mode=analysis', label: 'Analysis', mode: 'analysis' },
    ...(locationEnabled ? [{ href: '/legendary?mode=tracking', label: 'Tracking', mode: 'tracking' }] : []),
    { href: '/legendary?mode=trends', label: 'Trends', mode: 'trends' },
    { href: '/legendary?mode=community', label: 'Community', mode: 'community' },
  ];

  return (
    <div
      className={[
        'absolute z-40',
        'top-3 left-3 md:top-4 md:left-4',
        'pointer-events-auto',
      ].join(' ')}
      style={{
        paddingLeft: 'max(0px, env(safe-area-inset-left))',
        paddingTop: 'max(0px, env(safe-area-inset-top))',
      }}
    >
      <div className="flex items-center gap-2">
        <nav className="flex flex-wrap items-center gap-2 rounded-xl bg-black/35 backdrop-blur-md px-2 py-2 shadow-lg ring-1 ring-white/10">
          {TABS.map((t) => {
            const active = t.mode === currentMode;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={[
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                  active
                    ? 'bg-cyan-400/90 text-black shadow ring-1 ring-cyan-300'
                    : 'text-white/80 hover:text-white hover:bg-white/10',
                ].join(' ')}
              >
                <span className="relative inline-flex items-center">
                  {t.label}
                  {t.label === 'Community' && communityBadge && !active && (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(0,221,235,.8)]" />
                  )}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
