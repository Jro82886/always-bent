'use client';

import TopHUD from '@/components/TopHUD';
import RequireUsername from '@/components/RequireUsername';
import NavTabsWrapper from '@/components/NavTabsWrapper';

export default function GfwPage() {
  const placeholder = 'https://example.com';
  return (
    <RequireUsername>
    <main className="h-screen w-screen bg-gray-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <NavTabsWrapper />
        <TopHUD includeAbfi={false} />
      </div>
      <div className="absolute inset-0 top-0">
        <iframe
          src={placeholder}
          title="Global Fishing Watch"
          className="h-full w-full border-0"
        />
      </div>
    </main>
    </RequireUsername>
  );
}


