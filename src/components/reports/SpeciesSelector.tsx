'use client';

import React, { useState } from 'react';
import { SPECIES } from '@/constants/species';

interface SpeciesSelectorProps {
  reportId: string;
  initial?: string[];
  onUpdate?: (species: string[]) => void;
}

export default function SpeciesSelector({ reportId, initial = [], onUpdate }: SpeciesSelectorProps) {
  const [value, setValue] = useState<string[]>(initial);
  const [saving, setSaving] = useState(false);

  async function save(newValue: string[]) {
    setValue(newValue);
    setSaving(true);
    
    try {
      const res = await fetch(`/api/reports/${reportId}/species`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ species: newValue })
      });
      
      if (res.ok && onUpdate) {
        onUpdate(newValue);
      }
    } catch (error) {
      console.error('Failed to update species:', error);
    } finally {
      setSaving(false);
    }
  }

  function toggle(slug: string) {
    const newValue = value.includes(slug) 
      ? value.filter(x => x !== slug) 
      : [...value, slug];
    save(newValue);
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <span className="text-xs font-medium text-slate-400 w-full mb-1">Species Caught:</span>
      {SPECIES.map(s => {
        const isActive = value.includes(s.slug);
        return (
          <button
            key={s.slug}
            onClick={(e) => { 
              e.stopPropagation(); 
              toggle(s.slug); 
            }}
            disabled={saving}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
              saving ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105'
            }`}
            style={{
              background: isActive ? s.color : "rgba(255,255,255,0.05)",
              color: isActive ? "#000" : "#ccc",
              boxShadow: isActive ? `0 0 8px ${s.color}AA, 0 0 16px ${s.color}66` : "none",
              border: isActive ? "none" : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {s.label}
          </button>
        );
      })}
      {!value.length && !saving && (
        <span className="text-xs text-slate-500 italic">Add species (optional)</span>
      )}
      {saving && (
        <span className="text-xs text-cyan-400 animate-pulse">Saving...</span>
      )}
    </div>
  );
}
