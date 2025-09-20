'use client';
import { useEffect, useState } from 'react';

export default function ResetWelcome() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    (async () => {
      try { await fetch('/api/session/onboard', { method: 'DELETE' }); } catch {}
      localStorage.removeItem('abfi_setup_complete');
      localStorage.removeItem('abfi_welcome_completed');
      localStorage.removeItem('abfi_has_seen_tutorial');
      setDone(true);
    })();
  }, []);
  return <div style={{padding:24}}>{done ? 'Welcome state cleared.' : 'Clearing…'}</div>;
}
