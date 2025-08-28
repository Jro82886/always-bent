"use client";

import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { INLETS } from "@/lib/inlets";

type Props = {
  value: string;
  onChange: (id: string) => void;
  label?: string;
};

export function InletSelect({ value, onChange, label }: Props) {
  return (
    <div className="flex items-center gap-2">
      {label ? (
        <label className="text-sm opacity-80" htmlFor="inlet">
          {label}
        </label>
      ) : null}
      <Tooltip.Provider delayDuration={0}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <select
              id="inlet"
              className="bg-transparent border rounded px-2 py-1 text-sm"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            >
              {INLETS.map((i) => (
                <option key={i.id} value={i.id} className="text-black">
                  {i.name}
                </option>
              ))}
            </select>
          </Tooltip.Trigger>
          <Tooltip.Content className="bg-black text-white text-xs rounded px-2 py-1">
            Choose inlet
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  );
}


