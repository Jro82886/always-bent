// src/components/HeaderBar.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useMapbox } from "@/lib/MapCtx";
import { INLETS, DEFAULT_INLET, getInletById } from "@/lib/inlets";
import { buildInletColorMap } from "@/lib/inletColors";
import { useAppState } from "@/lib/store";
import * as Tooltip from "@radix-ui/react-tooltip";
import { usePathname } from "next/navigation";
import { useMemberstack } from "@/lib/memberstack/MemberstackProvider";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { User, LogOut, Settings } from "lucide-react";

/** Small helper for today's ISO (YYYY-MM-DD) */
const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * HeaderBar
 * - Inlet dropdown (flies map to selection)
 * - Date picker (writes to store)
 * - Exclusive layer toggles (SST / CHL)
 */
const COLOR_MAP = buildInletColorMap();

export default function HeaderBar({ includeAbfi = false }: { includeAbfi?: boolean } = {}) {
  const map = useMapbox();
  const {
    selectedInletId,
    setSelectedInletId,
    isoDate,
    setIsoDate,
    activeRaster,          // 'sst' | 'chl' | 'abfi' | null
    setActiveRaster,
  } = useAppState();

  const { member, logout, loading: memberLoading } = useMemberstack();

  const pathname = usePathname();
  const showInletSelect = Boolean(pathname && (pathname.startsWith("/legendary/tracking") || pathname === "/legendary"));
  const onRawImagery = Boolean(pathname && (pathname.startsWith("/legendary/imagery")));
  const onAnalysis   = Boolean(pathname && (pathname.startsWith("/legendary/analysis")));
  const showRawTime = onRawImagery;
  const showColors = showInletSelect; // Colors legend only on Tracking
  const [indexTimestamps, setIndexTimestamps] = useState<string[]>([]);

  // Load recent timestamps for Raw Imagery time chips
  useEffect(() => {
    if (!showRawTime) return;
    (async () => {
      try {
        const res = await fetch(`/api/tiles/index?layer=sst&source=goes&windowHours=72`, { cache: 'no-store' });
        const j = await res.json().catch(() => ({ timestamps: [] }));
        if (Array.isArray(j.timestamps)) setIndexTimestamps(j.timestamps);
      } catch {}
    })();
  }, [showRawTime]);

  const currentId = selectedInletId ?? DEFAULT_INLET.id;
  const activeInlet = useMemo(() => getInletById(currentId) ?? DEFAULT_INLET, [currentId]);
  const [legendOpen, setLegendOpen] = useState(false);

  // Keep a local input mirror for date (optional—can write straight to store)
  const [localDate, setLocalDate] = useState<string>(isoDate || todayISO());

  useEffect(() => {
    if (!isoDate) setIsoDate(todayISO());
    else if (isoDate !== localDate) setLocalDate(isoDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isoDate]);

  const onChangeInlet = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || DEFAULT_INLET.id;
    if (id === selectedInletId) return; // no-op if unchanged
    // Rule: cannot switch inlets with an active layer; require toggling off first
    if (activeRaster) {
      // Revert the select by not changing state and notify
      alert('Please toggle off active layers before switching inlets.');
      return;
    }
    const inlet = getInletById(id) ?? DEFAULT_INLET;
    
    setSelectedInletId(inlet.id);
  };

  // Ensure map is positioned once on mount (helpful during debugging)
  useEffect(() => {
    if (!map) return;
    const inlet = getInletById(currentId) ?? DEFAULT_INLET;
    // Do not animate here; MapShell handles authoritative fly on changes
    map.jumpTo({ center: inlet.center, zoom: inlet.zoom });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  const onChangeDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value;
    setLocalDate(d);
    setIsoDate(d);
  };

  // One-at-a-time selection for raw layers; ABFI remains single-select too
  const toggleLayer = (id: "sst" | "chl" | "abfi") => {
    if (id === 'sst') {
      const desired = 'sst';
      setActiveRaster((activeRaster as any) === desired ? null : (desired as any));
      return;
    }
    setActiveRaster((activeRaster as any) === id ? null : id);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Memberstack handles redirect to home page
    } catch (error: any) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  return (
    <div className="pointer-events-auto z-[100] flex flex-wrap items-center gap-2 rounded-md bg-black/50 px-3 py-2 text-white backdrop-blur" style={{ pointerEvents: 'auto' }}>
      {/* Inlet select: Only in Tracking */}
      {showInletSelect && (
        <>
          <select
            id="inlet-select"
            value={activeInlet.id}
            onChange={onChangeInlet}
            className="rounded bg-black/60 px-2 py-1 outline-none ring-1 ring-white/10 focus:ring-cyan-400/60"
          >
            {INLETS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>

          <span
            className="inline-block h-4 w-4 rounded-full border border-white/40"
            style={{ backgroundColor: COLOR_MAP[activeInlet.id] ?? '#343A40' }}
            title="Inlet color"
          />
        </>
      )}

      {showColors && (
        <button
          type="button"
          onClick={() => setLegendOpen(v => !v)}
          className="rounded-md bg-black/60 text-white/90 px-2 py-1 text-xs border border-white/15 hover:bg-black/70"
        >
          Colors
        </button>
      )}

      {showColors && legendOpen && (
        <div className="absolute mt-10 left-0 max-h-64 w-72 overflow-auto rounded-md border border-white/15 bg-black/80 p-2 backdrop-blur z-[110]">
          <div className="mb-1 text-xs text-white/60">Inlet Colors</div>
          <ul className="space-y-1">
            {INLETS.map((i) => (
              <li key={i.id} className="flex items-center gap-2 text-xs text-white/90">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full border border-white/40"
                  style={{ backgroundColor: COLOR_MAP[i.id] ?? '#343A40' }}
                />
                <span>{i.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw Imagery time chips */}
      {showRawTime && (
        <div className="ml-2 flex items-center gap-1">
          <span className="text-xs opacity-80 mr-1">Time</span>
          <button
            type="button"
            onClick={() => setIsoDate('latest') as any}
            className="rounded px-2 py-1 text-xs ring-1 ring-white/10 hover:ring-cyan-300/50 bg-black/60 text-white"
            title="Latest (today UTC)"
          >Latest</button>
          <button
            type="button"
            onClick={() => { const d=new Date(); d.setUTCDate(d.getUTCDate()-1); setIsoDate(d.toISOString().slice(0,10)); }}
            className="rounded px-2 py-1 text-xs ring-1 ring-white/10 hover:ring-cyan-300/50 bg-black/60 text-white"
            title="Yesterday (UTC)"
          >-1d</button>
          <button
            type="button"
            onClick={() => { const d=new Date(); d.setUTCDate(d.getUTCDate()-2); setIsoDate(d.toISOString().slice(0,10)); }}
            className="rounded px-2 py-1 text-xs ring-1 ring-white/10 hover:ring-cyan-300/50 bg-black/60 text-white"
            title="Two days ago (UTC)"
          >-2d</button>
          <select
            onChange={(e)=> setIsoDate((e.target.value||'').slice(0,10))}
            className="ml-1 rounded bg-black/60 px-2 py-1 text-xs outline-none ring-1 ring-white/10 focus:ring-cyan-400/60"
            value={isoDate || todayISO()}
            title="More timestamps (last ~72h)"
          >
            {([isoDate, ...indexTimestamps].filter(Boolean) as string[]).filter((v,i,self)=>self.indexOf(v)===i).map(ts => (
              <option key={ts} value={ts.slice(0,10)}>{ts.slice(0,10)}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date picker (hide on Raw Imagery to avoid duplicate calendar UI) */}
      {!onRawImagery && (
        <>
          <label className="ml-3 mr-1 text-xs opacity-80" htmlFor="date-input">
            Date
          </label>
          <div id="tour-date-picker" className="pointer-events-auto">
            <input
              id="date-input"
              type="date"
              value={localDate}
              onChange={onChangeDate}
              className="rounded bg-black/60 px-2 py-1 outline-none ring-1 ring-white/10 focus:ring-cyan-400/60 pointer-events-auto cursor-pointer"
              style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
            />
          </div>
        </>
      )}

      {/* Divider */}
      <span className="mx-2 h-5 w-px bg-white/15" />

      {/* Layer toggles (exclusive) */}
      <span className="text-xs opacity-80">Layers</span>
      <ToggleButton
        label="SST"
        active={activeRaster === "sst"}
        onClick={() => toggleLayer("sst")}
        tooltip="Toggle Sea Surface Temperature layer"
      />
      <ToggleButton
        label="CHL"
        active={activeRaster === "chl"}
        onClick={() => toggleLayer("chl")}
        tooltip="Toggle Chlorophyll-a layer"
      />
      {includeAbfi ? (
        <ToggleButton
          label="ABFI"
          active={activeRaster === "abfi"}
          onClick={() => toggleLayer("abfi")}
          tooltip="Thermocline (custom blend) for hotspot prediction"
        />
      ) : null}

      {/* User Menu - positioned at the end */}
      <div className="ml-auto flex items-center gap-2">
        {!memberLoading && (
          <>
            {member ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-2 rounded bg-black/60 px-3 py-1 text-sm ring-1 ring-white/10 hover:ring-cyan-400/60 transition-all">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">{member.email}</span>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[180px] rounded-md bg-black/90 p-1 shadow-lg backdrop-blur border border-white/10"
                    sideOffset={5}
                    align="end"
                  >
                    <DropdownMenu.Label className="px-2 py-1 text-xs font-semibold text-white/60">
                      My Account
                    </DropdownMenu.Label>
                    <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
                    <DropdownMenu.Item
                      className="flex items-center gap-2 rounded px-2 py-1 text-sm text-white outline-none hover:bg-white/10 cursor-pointer"
                      onSelect={() => window.location.href = '/account-billing'}
                    >
                      <Settings className="h-4 w-4" />
                      Account Settings
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
                    <DropdownMenu.Item
                      className="flex items-center gap-2 rounded px-2 py-1 text-sm text-red-400 outline-none hover:bg-white/10 cursor-pointer"
                      onSelect={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="rounded bg-black/60 px-3 py-1 text-sm ring-1 ring-white/10 hover:ring-cyan-400/60 transition-all"
                >
                  Login
                </button>
                <button
                  onClick={() => window.location.href = '/signup'}
                  className="rounded bg-cyan-500 px-3 py-1 text-sm font-medium text-black hover:bg-cyan-400 transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** A tiny button component for the layer toggles */
function ToggleButton({
  label,
  active,
  onClick,
  tooltip,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tooltip?: string;
}) {
  const btn = (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={tooltip || label}
      className={[
        "rounded px-3 py-1 text-sm font-medium transition",
        "ring-1 ring-white/10 hover:ring-cyan-300/50",
        active
          ? "bg-cyan-400 text-black shadow-[0_0_24px_rgba(0,221,235,0.35)]"
          : "bg-black/60 text-white hover:bg-black/50",
      ].join(" ")}
    >
      {label}
    </button>
  );
  if (!tooltip) return btn;
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{btn}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="bottom" sideOffset={6} className="rounded bg-black/80 px-2 py-1 text-[11px] text-white shadow ring-1 ring-white/10">
            {tooltip}
            <Tooltip.Arrow className="fill-black/80" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}