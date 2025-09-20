'use client';

import { SPECIES } from '@/constants/species';

interface SpeciesBadgeProps {
  slug: string;
  size?: 'xs' | 'sm';
}

export default function SpeciesBadge({ slug, size = 'xs' }: SpeciesBadgeProps) {
  const species = SPECIES.find(x => x.slug === slug);
  if (!species) return null;
  
  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-[10px]' 
    : 'px-2.5 py-1 text-xs';
  
  return (
    <span
      className={`abfi-species-pill ${sizeClasses} font-medium text-black`}
      style={{
        background: species.color,
        boxShadow: `0 0 8px ${species.color}88, 0 0 16px ${species.color}44`, // double glow
      }}
    >
      {species.label}
    </span>
  );
}
