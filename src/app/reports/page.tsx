"use client";

import Link from "next/link";
import { useAppState } from "@/store/appState";
import { INLETS } from "@/lib/inlets";

export default function ReportsPage() {
  const { inletId, username } = useAppState();
  const inlet = INLETS.find((i) => i.id === inletId) || INLETS[0];
  const srcBase = process.env.FAMOUS_REPORTS_URL || "about:blank";
  const url = `${srcBase}?inlet=${encodeURIComponent(inlet.id)}&username=${encodeURIComponent(username || "anon")}`;

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <div className="h-12 border-b flex items-center justify-between px-4 bg-white/60 dark:bg-black/40 backdrop-blur">
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800/60">{inlet.name}</span>
          <span className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800/60">{username || "anon"}</span>
        </div>
        <Link href="/app" className="text-sm text-cyan-600 hover:underline">
          Back to Map
        </Link>
      </div>
      <iframe className="w-full h-full" src={url} />
    </div>
  );
}



