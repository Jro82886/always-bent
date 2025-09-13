'use client';

type BrandMarkProps = { className?: string };

export default function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <div className={["inline-flex items-center gap-3", className].join(' ')} aria-hidden>
      {/* Globe */}
      <svg
        className="spin-slow drop-shadow-[0_0_18px_rgba(139,92,246,0.35)]"
        width="38"
        height="38"
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient id="abfiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" stroke="url(#abfiGradient)" strokeWidth="2" fill="none" />
        <ellipse cx="50" cy="50" rx="48" ry="18" stroke="#8b5cf6" strokeWidth="1" fill="none" />
        <ellipse cx="50" cy="50" rx="18" ry="48" stroke="#6d28d9" strokeWidth="1" fill="none" />
        <path d="M2 50 H98 M50 2 V98" stroke="#8b5cf6" strokeWidth="0.6" opacity="0.7" />
      </svg>

      {/* Wordmark */}
      <div className="leading-tight select-none">
        <div className="bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] bg-clip-text text-transparent font-semibold text-xl sm:text-2xl">
          ALWAYS BENT
        </div>
        <div className="text-[11px] sm:text-xs tracking-[0.22em] text-purple-300/80 uppercase">
          Fishing Intelligence
        </div>
      </div>
    </div>
  );
}


