'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/legendary/analysis', label: 'Analysis' },
  { href: '/legendary/tracking', label: 'Tracking' },
  { href: '/legendary/community', label: 'Community' },
  { href: '/legendary/trends', label: 'Trends' },
];

export function CommandBridgeTabs() {
  const pathname = usePathname() || '';
  
  return (
    <nav className="cb-tabs">
      {TABS.map(tab => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link 
            key={tab.href} 
            href={tab.href} 
            className={`cb-tab ${active ? 'is-active' : ''}`}
            prefetch
          >
            {tab.label}
            <span className="cb-underline" />
          </Link>
        );
      })}
    </nav>
  );
}
