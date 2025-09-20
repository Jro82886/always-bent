'use client';

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

export function MonthFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const month = params.get("month") ?? isoMonth(new Date()); // "2025-09"

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value; // "YYYY-MM"
    const q = new URLSearchParams(params.toString());
    q.set("month", v);
    router.push(`?${q.toString()}`);
  }

  const options = lastMonths(12); // array of "YYYY-MM"

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-slate-400">Month</label>
      <select
        value={month}
        onChange={onChange}
        className="abfi-card-bg abfi-glow rounded-full px-3 py-1.5 text-sm font-medium text-cyan-300 bg-transparent border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      >
        {options.map(m => (
          <option key={m} value={m} className="bg-slate-900 text-white">
            {prettyMonth(m)}
          </option>
        ))}
      </select>
    </div>
  );
}

// Quick chip buttons for convenience
export function MonthQuickChips({ onSelectMonth }: { onSelectMonth: (month: string) => void }) {
  const setMonthFromNow = (monthsAgo: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    onSelectMonth(isoMonth(d));
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {["This Month", "Last Month", "2 Months Ago"].map((label, i) => (
        <button 
          key={label}
          onClick={() => setMonthFromNow(i)}
          className="abfi-card-bg abfi-glow abfi-glow-hover rounded-full px-3 py-1 text-xs font-medium text-cyan-300"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function isoMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function lastMonths(n: number) {
  const arr: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    arr.push(isoMonth(new Date(d.getFullYear(), d.getMonth() - i, 1)));
  }
  return arr;
}

function prettyMonth(m: string) { // "2025-09" -> "Sep 2025"
  const [y, mm] = m.split('-').map(Number);
  return new Date(y, mm - 1, 1).toLocaleString(undefined, { month: 'short', year: 'numeric' });
}
