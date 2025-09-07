'use client';

import HeaderBar from '@/components/HeaderBar';
import CleanReloadButton from '@/components/CleanReloadButton';
import BasemapControl from '@/components/BasemapControl';

export default function TopHUD({ includeAbfi = false, className, extraRight, showSoon = false, showLayers = true }: { includeAbfi?: boolean; className?: string; extraRight?: React.ReactNode; showSoon?: boolean; showLayers?: boolean }) {
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
        <HeaderBar includeAbfi={includeAbfi} />
        {showSoon ? (
          <div className="hidden md:flex flex-col items-start pl-2 ml-2 border-l border-white/10">
            <div className="text-[10px] uppercase tracking-wide text-white/50 mb-1">Coming soon</div>
            <div className="flex items-center gap-1">
              {['Wind','Salinity','Currents','Altimetry','AIS','Reports'].map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  aria-disabled="true"
                  title={`${label} — coming soon`}
                  className="cursor-not-allowed rounded-md px-2 py-1 text-[11px] text-white/40 ring-1 ring-white/10 opacity-60"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {extraRight}
        <div className="ml-2 hidden md:block">
          <BasemapControl />
        </div>
        {/* Dev-only: show Clean Reload when NODE_ENV !== 'production' */}
        {(process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_CLEAN_RELOAD_VISIBLE === 'true') ? (
          <div className="ml-2 hidden md:block">
            <CleanReloadButton />
          </div>
        ) : null}
      </div>
    </div>
  );
}


