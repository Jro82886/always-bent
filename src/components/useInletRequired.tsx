import { useState } from 'react';

export function useInletRequired(hasInlet: boolean) {
  const [open, setOpen] = useState(false);
  const gate = <T extends (...a:any[])=>any>(fn: T) =>
    (...args: Parameters<T>) => { if (!hasInlet) { setOpen(true); return; } return fn(...args); };

  const Modal = () => !open ? null : (
    <div className="fixed inset-0 z-[999] grid place-items-center bg-black/60">
      <div className="rounded-xl bg-[#0b1220] p-5 ring-1 ring-white/10 w-[min(92vw,420px)]">
        <div className="text-lg font-semibold mb-1">Select your inlet</div>
        <p className="text-sm text-white/70 mb-4">You need to select your inlet to use Tracking features.</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15" onClick={()=>setOpen(false)}>Close</button>
          <a href="#inlet-selector" className="px-3 py-1.5 rounded-md bg-cyan-500/20 ring-1 ring-cyan-400/40">Choose Inlet</a>
        </div>
      </div>
    </div>
  );

  return { gate, InletRequiredModal: Modal };
}
