'use client';

import { useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function HotspotReportModal({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="abfi-modal-backdrop" onClick={onClose} />
      <div className="abfi-modal" role="dialog" aria-modal="true" aria-label="Hotspot report">
        <div className="abfi-modal-card abfi-glow">
          <div className="abfi-modal-header">
            <div className="text-sm uppercase tracking-wide text-white/80">Hotspot Report</div>
            <button className="abfi-btn" onClick={onClose}>Close</button>
          </div>
          <div className="abfi-modal-body">{children}</div>
        </div>
      </div>
    </>
  );
}


