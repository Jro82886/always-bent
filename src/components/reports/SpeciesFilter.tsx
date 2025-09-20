'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { SPECIES } from "@/constants/species";

export default function SpeciesFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = new Set((params.get("species") ?? "")
    .split(",").filter(Boolean).map(s => s.toLowerCase()));

  function toggle(slug: string) {
    const next = new Set(current);
    next.has(slug) ? next.delete(slug) : next.add(slug);
    const q = new URLSearchParams(params.toString());
    const val = Array.from(next).join(",");
    if (val) q.set("species", val); else q.delete("species");
    router.push(`?${q.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {SPECIES.map(s => (
        <button 
          key={s.slug}
          onClick={() => toggle(s.slug)}
          className="abfi-card-bg abfi-glow abfi-glow-hover rounded-full px-3 py-1 text-xs font-medium transition-all
                     data-[on=true]:ring-1 data-[on=true]:ring-emerald-400/40"
          data-on={current.has(s.slug)}
          style={{
            background: current.has(s.slug) ? s.color : undefined,
            color: current.has(s.slug) ? "#000" : undefined,
            boxShadow: current.has(s.slug) ? `0 0 8px ${s.color}AA` : undefined
          }}
          aria-pressed={current.has(s.slug)}
          title={s.label}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
