"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useAppState } from "@/store/appState";

function RailItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const { unreadMentions } = useAppState();
  return (
    <div className="relative w-full flex items-center justify-center focus-within:z-10">
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Link
            href={href}
            aria-label={label}
            title={label}
            className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
              isActive ? "bg-cyan-600/20 text-cyan-400" : "text-neutral-300 hover:text-cyan-300 hover:bg-cyan-700/20"
            }`}
          >
            <span className="text-xl" aria-hidden>
              {icon}
            </span>
          </Link>
        </Tooltip.Trigger>
        <Tooltip.Content side="right" className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-100 shadow">
          {label}
        </Tooltip.Content>
      </Tooltip.Root>
      {label === "Community" && unreadMentions > 0 ? (
        <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-cyan-600 text-[10px] text-white flex items-center justify-center px-1" title="Mentions">
          {Math.min(unreadMentions, 9)}
        </span>
      ) : null}
      <span
        className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 origin-left scale-95 opacity-0 rounded bg-neutral-800/95 px-2 py-1 text-xs text-neutral-100 shadow transition-all duration-150 group-hover/nav:opacity-100 group-hover/nav:scale-100 group-hover/nav:translate-x-0 translate-x-[-4px] focus-within:opacity-100 focus-within:scale-100 focus-within:translate-x-0"
      >
        {label}
      </span>
    </div>
  );
}

export function LeftRail() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-14 bg-neutral-900/90 backdrop-blur z-40">
      <Tooltip.Provider delayDuration={0}>
        <div className="group/nav flex flex-col items-center gap-3 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)] overflow-y-auto">
          <RailItem href="/app/imagery" label="Imagery" icon="📷" />
          <RailItem href="/app" label="Analysis" icon="📈" />
          <RailItem href="/app/community" label="Community" icon="💬" />
          <RailItem href="/app/gfw" label="GFW" icon="🚢" />
          <RailItem href="/reports" label="Reports" icon="📝" />
        </div>
      </Tooltip.Provider>
    </aside>
  );
}


