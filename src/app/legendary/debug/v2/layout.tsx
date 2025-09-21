"use client";
import '@/app/globals.css';
import { UIProvider, useUI } from '@/state/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden bg-neutral-900 text-neutral-100">
        <UIProvider>
          <HeaderBar />
          <main className="h-[calc(100vh-56px)]">{children}</main>
        </UIProvider>
      </body>
    </html>
  );
}

function HeaderBar(){
  const path = usePathname();
  const { sstOn, setSstOn, setSnipOn } = useUI() as any;
  return (
    <div className="h-14 border-b border-neutral-800 flex items-center justify-between px-4">
      <div className="font-semibold tracking-wide">Always Bent (v2 debug sandbox)</div>
      <div className="flex items-center gap-2">
        <button className={`px-3 py-1 rounded ${sstOn?'bg-neutral-800':'hover:bg-neutral-800/60'}`} onClick={()=>{ setSstOn(!sstOn); setSnipOn(true); }}>SST</button>
        <button className="px-3 py-1 rounded bg-neutral-800/50 text-neutral-400" disabled>Chlorophyll</button>
        <Link href="/legendary/debug/v2/community" className={`px-3 py-1 rounded ${path.startsWith('/legendary/debug/v2/community')?'bg-neutral-800':'hover:bg-neutral-800/60'}`}>Chat</Link>
      </div>
    </div>
  );
}

// Old DatePicker removed for simplified header

// Tabs removed per simplified header
