'use client';

import { useEffect } from 'react';

export default function ChunkGuard() {
  useEffect(() => {
    // Best-effort: unregister rogue service workers that can cache old chunks
    if ('serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister().catch(() => {}));
        });
      } catch {}
    }

    function bustUrl(u: string): string {
      try {
        const url = new URL(u);
        url.searchParams.set('__abfi_bust', String(Date.now()));
        return url.toString();
      } catch {
        const sep = u.includes('?') ? '&' : '?';
        return `${u}${sep}__abfi_bust=${Date.now()}`;
      }
    }

    function reloadForChunkError() {
      try {
        const loc = window.location;
        // If user is on 3000, try 3010 (our dev default) with a cache-bust
        if (loc.port === '3000') {
          const url3010 = `${loc.protocol}//${loc.hostname}:3010${loc.pathname}${loc.search}${loc.hash}`;
          window.location.replace(bustUrl(url3010));
          return;
        }
        window.location.replace(bustUrl(loc.href));
      } catch {
        window.location.reload();
      }
    }

    function isChunkLoadError(err: any): boolean {
      const msg = (err && (err.message || err.toString())) || '';
      return /ChunkLoadError|Loading chunk/i.test(msg);
    }

    const onError = (e: ErrorEvent) => {
      if (e?.error && isChunkLoadError(e.error)) reloadForChunkError();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason: any = e?.reason;
      if (!reason) return;
      if (reason?.name === 'ChunkLoadError' || isChunkLoadError(reason)) reloadForChunkError();
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}


