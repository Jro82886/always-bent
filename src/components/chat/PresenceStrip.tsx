'use client';

interface PresenceStripProps {
  text: string;
}

export default function PresenceStrip({ text }: PresenceStripProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-cyan-200/80">
      <span className="inline-flex items-center gap-1.5">
        <i className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
        {text}
      </span>
    </div>
  );
}
