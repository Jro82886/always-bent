import React from 'react';

type ToggleCardProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  tone?: 'sst' | 'chl' | 'ocean' | 'orange' | 'teal' | 'cyan' | 'lime';
  rightSlot?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

export function ToggleCard({
  icon,
  label,
  active = false,
  tone = 'ocean',
  rightSlot,
  onClick,
  disabled = false
}: ToggleCardProps) {
  return (
    <button
      type="button"
      className={`abfi-toggle ${active ? 'is-active' : ''} tone-${tone} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
      aria-pressed={!!active}
      disabled={disabled}
    >
      <span className="icon">{icon}</span>
      <span className="label">{label}</span>
      {rightSlot && <span className="right">{rightSlot}</span>}
    </button>
  );
}
