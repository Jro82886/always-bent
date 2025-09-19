'use client';
import { useEffect, useRef, useState } from 'react';

type Props = {
  content: React.ReactNode;
  children: React.ReactElement;   // the trigger
  side?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;                  // ms before showing (default 250)
  maxW?: string;                   // e.g. '16rem'
};

export default function Tooltip({ content, children, side = 'top', delay = 250, maxW = '18rem' }: Props) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const show = () => { 
    timer.current = window.setTimeout(() => setOpen(true), delay); 
  };
  
  const hide = () => { 
    if (timer.current) window.clearTimeout(timer.current); 
    setOpen(false); 
  };

  // long-press for mobile
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    let lp: number | null = null;
    const start = () => { lp = window.setTimeout(() => setOpen(true), 400); };
    const end = () => { if (lp) window.clearTimeout(lp); setOpen(false); };
    el.addEventListener('touchstart', start);
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    return () => { 
      el.removeEventListener('touchstart', start); 
      el.removeEventListener('touchend', end); 
      el.removeEventListener('touchcancel', end); 
    };
  }, []);

  // Calculate position based on side
  const getPositionStyles = () => {
    switch (side) {
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-6px)'
        };
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(6px)'
        };
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%) translateX(-6px)'
        };
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%) translateX(6px)'
        };
    }
  };

  return (
    <span
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className="relative inline-flex"
      aria-describedby={open ? 'tt' : undefined}
    >
      {children}
      {open && (
        <div
          role="tooltip"
          id="tt"
          className="pointer-events-none absolute z-50 rounded-md bg-slate-900/95 text-slate-100
                     shadow-lg ring-1 ring-white/10 px-2 py-1 text-xs leading-snug"
          style={{ 
            maxWidth: maxW, 
            ...getPositionStyles()
          }}
        >
          {content}
        </div>
      )}
    </span>
  );
}