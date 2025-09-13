"use client";

import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { INLETS } from "@/lib/inlets";
import { INLET_COLORS } from "@/lib/inletColors";
import { ChevronDown } from "lucide-react";

type Props = {
  value: string;
  onChange: (id: string) => void;
  label?: string;
};

export function InletSelect({ value, onChange, label }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedInlet = INLETS.find(i => i.id === value);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInletColor = (inletId: string) => {
    return INLET_COLORS[inletId]?.color || '#26c281';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="text-sm opacity-80 mb-1 block">
          {label}
        </label>
      )}
      
      {/* Custom Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-white hover:border-cyan-400/50 transition-all min-w-[280px]"
      >
        {selectedInlet && (
          <>
            <div 
              className="w-3 h-3 rounded-full shadow-lg"
              style={{ 
                backgroundColor: getInletColor(selectedInlet.id),
                boxShadow: `0 0 8px ${getInletColor(selectedInlet.id)}40`
              }}
            />
            <span className="flex-1 text-left">{selectedInlet.name}</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-[400px] overflow-y-auto bg-black/95 backdrop-blur-xl border border-cyan-500/30 rounded-lg shadow-2xl">
          {/* Simple flat list of all inlets */}
          {INLETS.map((inlet) => (
            <button
              key={inlet.id}
              onClick={() => {
                onChange(inlet.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-cyan-500/10 transition-all ${
                value === inlet.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-white'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full shadow-lg"
                style={{ 
                  backgroundColor: getInletColor(inlet.id),
                  boxShadow: `0 0 8px ${getInletColor(inlet.id)}40`
                }}
              />
              <span className="text-left">{inlet.name}</span>
              {value === inlet.id && (
                <span className="ml-auto text-cyan-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


