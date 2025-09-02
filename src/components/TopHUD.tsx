'use client';

import HeaderBar from '@/components/HeaderBar';
import LayerToggles from '@/components/LayerToggles';

export default function TopHUD({ includeAbfi = false, className, extraRight, showSoon, showLayers = true }: { includeAbfi?: boolean; className?: string; extraRight?: React.ReactNode; showSoon?: boolean; showLayers?: boolean }) {
  return (
    <div
      className={[
        'absolute z-30 pointer-events-auto',
        'left-3 md:left-4 top-16 md:top-20',
        className || ''
      ].join(' ')}
    >
      <div
        className={[
          'flex flex-wrap items-center gap-2',
          'rounded-xl bg-black/30 backdrop-blur px-3 py-2 ring-1 ring-white/10'
        ].join(' ')}
      >
        <HeaderBar />
        {showLayers ? <LayerToggles includeAbfi={includeAbfi} /> : null}
        {showSoon ? (
          <div className="hidden md:flex items-center gap-1 pl-1 ml-1 border-l border-white/10">
            {['Wind','Salinity','Currents','Altimetry','AIS','Reports'].map((label) => (
              <button
                key={label}
                type="button"
                disabled
                title={`${label} — coming soon`}
                className="cursor-not-allowed rounded-md px-2 py-1 text-[11px] text-white/50 ring-1 ring-white/10"
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        {extraRight}
      </div>
    </div>
  );
}


