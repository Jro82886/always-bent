'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/imagery', label: 'Imagery' },
  { href: '/analysis', label: 'Analysis' },
  { href: '/reports',  label: 'Reports' },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-auto absolute top-3 left-1/2 -translate-x-1/2 z-40">
      <ul className="flex items-center gap-1 rounded-md bg-slate-900/85 p-1 ring-1 ring-white/10 backdrop-blur">
        {TABS.map(t => {
          const active = pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={[
                  'px-3 py-1.5 text-sm rounded-md',
                  active
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                ].join(' ')}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


