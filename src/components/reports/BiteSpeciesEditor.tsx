'use client';
import { useState, useCallback, useRef } from 'react';
import { ALLOWED_SPECIES } from '@/config/species';
import { showToast } from '@/components/ui/Toast';
import { Check } from 'lucide-react';

interface BiteSpeciesEditorProps {
  reportId: string;
  initialSpecies: string[];
  isOwner?: boolean;
}

export function BiteSpeciesEditor({ 
  reportId, 
  initialSpecies = [], 
  isOwner = false 
}: BiteSpeciesEditorProps) {
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>(initialSpecies);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const saveSpecies = useCallback(async (species: string[]) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update species');
      }

      showToast({
        type: 'success',
        title: 'Species updated',
        message: 'Your catch species have been saved',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to update species:', error);
      showToast({
        type: 'error',
        title: 'Update failed',
        message: error instanceof Error ? error.message : 'Could not update species',
        duration: 5000
      });
      // Revert on error
      setSelectedSpecies(initialSpecies);
    } finally {
      setIsSaving(false);
    }
  }, [reportId, initialSpecies]);

  const toggleSpecies = useCallback((species: string) => {
    if (!isOwner) return;

    setSelectedSpecies(prev => {
      let next: string[];
      if (prev.includes(species)) {
        next = prev.filter(s => s !== species);
      } else {
        // Max 3 species
        next = [...prev, species].slice(0, 3);
      }

      // Debounce the save
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        saveSpecies(next);
      }, 400);

      return next;
    });
  }, [isOwner, saveSpecies]);

  if (!isOwner) {
    // Read-only view for non-owners
    return (
      <div className="flex flex-wrap gap-2">
        {selectedSpecies.length > 0 ? (
          selectedSpecies.map(species => (
            <div
              key={species}
              className="px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 
                       text-cyan-300 text-sm font-medium shadow-[0_0_12px_rgba(56,189,248,0.3)]"
            >
              {species}
            </div>
          ))
        ) : (
          <div className="text-slate-500 text-sm italic">No species recorded</div>
        )}
      </div>
    );
  }

  // Editable view for owner
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-300">Species Caught</h4>
        {selectedSpecies.length > 0 && (
          <span className="text-xs text-slate-500">
            {selectedSpecies.length}/3 selected
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {ALLOWED_SPECIES.map(species => {
          const isSelected = selectedSpecies.includes(species);
          return (
            <button
              key={species}
              onClick={() => toggleSpecies(species)}
              disabled={isSaving}
              className={`
                px-3 py-1.5 rounded-full border transition-all duration-200
                ${isSelected 
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 border-cyan-400 text-white shadow-[0_0_20px_rgba(56,189,248,0.5)]' 
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                }
                ${isSaving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                relative
              `}
            >
              <span className="flex items-center gap-1.5">
                {isSelected && <Check size={14} className="text-white" />}
                {species}
              </span>
            </button>
          );
        })}
      </div>
      
      {selectedSpecies.length === 0 && (
        <p className="text-xs text-slate-500 italic">
          Tap to add species you caught (max 3)
        </p>
      )}
    </div>
  );
}
