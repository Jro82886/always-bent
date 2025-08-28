"use client";

import { LeftRail } from "@/components/LeftRail";
import { TopBar } from "@/components/TopBar";

export default function GfwPage() {
  const src = process.env.GFW_EMBED_URL || "about:blank";
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <TopBar />
      <div className="grid grid-cols-[56px_1fr]">
        <LeftRail />
        <div className="ml-14 flex-1 grid grid-cols-2">
          <div className="bg-slate-100 dark:bg-slate-900" />
          <div className="border-l relative">
            <iframe className="w-full h-full" src={src} />
            {src === "about:blank" ? (
              <div className="absolute inset-0 grid place-items-center">
                <a
                  className="bg-cyan-600 text-white rounded px-4 py-2"
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open GFW in new window
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}


