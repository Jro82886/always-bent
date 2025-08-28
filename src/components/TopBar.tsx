"use client";

import { useEffect, useState } from "react";
import { InletSelect } from "@/components/InletSelect";
import { useAppState } from "@/store/appState";

export function TopBar() {
  const { inletId, setInletId, username, setUsername } = useAppState();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const stored = window.localStorage.getItem("abfi_username");
      if (stored && stored !== username) setUsername(stored);
    } catch {}
  }, [hydrated]);

  return (
    <div className="h-12 border-b flex items-center justify-between px-4 bg-white/60 dark:bg-black/40 backdrop-blur">
      <div className="font-semibold">Always Bent Fishing Intelligence</div>
      <div className="flex items-center gap-3">
        <InletSelect value={inletId} onChange={setInletId} />
        <span className="text-sm opacity-80">{hydrated ? (username || "anon") : " "}</span>
      </div>
    </div>
  );
}



