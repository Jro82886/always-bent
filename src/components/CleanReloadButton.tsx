'use client';

import { cleanReload } from '@/utils/cleanReload';
import * as Tooltip from '@radix-ui/react-tooltip';

export default function CleanReloadButton() {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            onClick={cleanReload}
            aria-label="Clean Reload"
            className="rounded-md bg-white/10 px-2 py-1 text-xs text-white/85 ring-1 ring-white/15 hover:bg-white/15"
            style={{ lineHeight: 1.1 }}
          >
            🔄 Clean Reload
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="bottom" align="end" sideOffset={6} className="rounded bg-black/80 px-2 py-1 text-[11px] text-white shadow ring-1 ring-white/10">
            Use if tiles or UI look cached/duplicated. Clears caches and hard reloads.
            <Tooltip.Arrow className="fill-black/80" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}


