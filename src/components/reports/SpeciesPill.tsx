'use client';

import { prettySpecies, getSpeciesEmoji } from '@/constants/species';

interface SpeciesPillProps {
  species: string;
  size?: 'xs' | 'sm';
}

export default function SpeciesPill({ species, size = 'xs' }: SpeciesPillProps) {
  const label = prettySpecies(species);
  const emoji = getSpeciesEmoji(species);
  
  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full 
      bg-emerald-500/10 text-emerald-300 border border-emerald-500/20
      ${size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}
      font-medium
    `}>
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  );
}
