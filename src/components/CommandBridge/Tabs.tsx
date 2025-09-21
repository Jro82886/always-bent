'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Analysis',  href: '/legendary',           match: (p:string)=> p === '/legendary' || p.startsWith('/legendary/analysis') },
  { label: 'Tracking',  href: '/legendary/tracking',  match: (p:string)=> p.startsWith('/legendary/tracking') },
  { label: 'Community', href: '/legendary/community', match: (p:string)=> p.startsWith('/legendary/community') },
  { label: 'Trends',    href: '/legendary/trends',    match: (p:string)=> p.startsWith('/legendary/trends') },
];

export default function Tabs() {
  const pathname = usePathname();
  
  return (
    <nav className="flex items-center h-full">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={[
              "group relative px-6 h-full flex items-center",
              "text-sm font-semibold transition-all duration-200",
              "hover:bg-cyan-500/10",
              active ? "active" : "",
              active
                ? "text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]"
                : "text-gray-400 hover:text-cyan-200 focus:text-cyan-200",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            <span className="relative z-[1]">{tab.label}</span>
            
            {/* underline (no layout shift) */}
            <span
              aria-hidden="true"
              className={[
                "pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-0 h-[2px] rounded-full",
                "bg-gradient-to-r from-transparent via-cyan-400 to-transparent",
                "shadow-[0_0_12px_rgba(34,211,238,0.8),0_0_24px_rgba(34,211,238,0.4)]",
                "transition-[width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                active ? "w-full opacity-100" : "w-0 opacity-0"
              ].join(" ")}
            />
            
            {/* hover shimmer for inactive tabs */}
            <span
              aria-hidden="true"
              className="absolute inset-x-6 bottom-0 h-px opacity-0 group-hover:opacity-30
                         transition-opacity duration-150 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </Link>
        );
      })}
    </nav>
  );
}