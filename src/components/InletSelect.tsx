"use client";

import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { INLETS } from "@/lib/inlets";
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
        className={`flex items-center justify-between gap-2 bg-black/60 backdrop-blur-sm border border-cyan-500/30 px-3 py-2 text-sm text-white hover:border-cyan-400/50 transition-all min-w-[280px] ${
          isOpen ? 'rounded-t-lg border-b-0' : 'rounded-lg'
        }`}
      >
        {selectedInlet && (
          <div className="flex items-center gap-2 flex-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: selectedInlet.color || '#26c281',
                boxShadow: `0 0 8px ${selectedInlet.color || '#26c281'}`,
              }}
            />
            <span className="text-left">{selectedInlet.name}</span>
          </div>
        )}
        <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - Connected appearance */}
      {isOpen && (
        <div className="absolute z-50 -mt-[1px] w-full max-h-[400px] overflow-y-auto bg-black/95 backdrop-blur-xl border border-cyan-500/30 border-t-0 rounded-b-lg shadow-2xl">
          {/* Flat list of all inlets with glowing color dots */}
          {INLETS.map((inlet) => (
            <button
              key={inlet.id}
              onClick={() => {
                onChange(inlet.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-cyan-500/10 transition-all ${
                value === inlet.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: inlet.color || '#26c281',
                    boxShadow: `0 0 8px ${inlet.color || '#26c281'}`,
                  }}
                />
                <span className="text-left">{inlet.name}</span>
              </div>
              {value === inlet.id && (
                <span className="text-cyan-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


