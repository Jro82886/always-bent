'use client';
import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

export default function Showcase() {
  const Panels = [
    { name: 'TopHUD', C: dynamicImport(() => import('@/components/TopHUD')) },
    // Add more: { name: 'SizingPanel', C: dynamic(() => import('@/components/SizingPanel')) },
    // { name: 'SnipAnalyze', C: dynamic(() => import('@/components/SnipTool')) },
  ];
  return (
    <div style={{ display: 'grid', gap: 16, padding: 16, background: '#030712', minHeight: '100vh' }}>
      {Panels.map(({ name, C }) => (
        <section key={name} style={{ border: '1px solid #333', borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>{name}</h3>
          <C />
        </section>
      ))}
    </div>
  );
}


