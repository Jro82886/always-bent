'use client';
import { ReactNode } from 'react';

export default function SoonToggle({
  label,
  checked,
  onChange,
  enabled,
  tooltip = 'Coming soon',
  badge = 'Soon',
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  enabled: boolean;
  tooltip?: string;
  badge?: string;
}) {
  if (enabled) {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="toggle"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <span>{label}</span>
      </label>
    );
  }
  return (
    <div className="group relative inline-flex items-center gap-2 opacity-60 cursor-not-allowed">
      <input type="checkbox" className="toggle" disabled />
      <span>{label}</span>
      <span className="text-[10px] px-1 py-0.5 rounded bg-yellow-300/70 text-black">{badge}</span>
      <div className="pointer-events-none absolute -bottom-8 left-0 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded">
        {tooltip}
      </div>
    </div>
  );
}


