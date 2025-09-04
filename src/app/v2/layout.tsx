import '../globals.css';
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
  return (
    <div className="h-14 border-b border-neutral-800 flex items-center justify-between px-4">
      <div className="font-semibold tracking-wide">Always Bent (v2 sandbox)</div>
      <div className="flex items-center gap-3">
        <DatePicker />
        <Tabs />
      </div>
    </div>
  );
}

function DatePicker(){
  const { dateISO, setDateISO } = useUI();
  return (
    <input
      type="date"
      value={dateISO}
      onChange={(e)=>setDateISO(e.target.value)}
      className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
      aria-label="Imagery Date"
    />
  );
}

function Tabs(){
  const path = usePathname();
  const Tab = ({href,label}:{href:string;label:string}) => {
    const active = path.startsWith(href);
    return (
      <Link href={href} className={`px-3 py-1 rounded ${active?'bg-neutral-800':'hover:bg-neutral-800/60'}`}>
        {label}
      </Link>
    );
  };
  return (
    <nav className="flex items-center gap-2">
      <Tab href="/v2/imagery" label="Raw Imagery" />
      <Tab href="/v2/analysis" label="Analysis" />
      <Tab href="/v2/community" label="Community" />
    </nav>
  );
}
