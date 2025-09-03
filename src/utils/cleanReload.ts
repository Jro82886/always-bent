// utils/cleanReload.ts
export async function cleanReload(): Promise<void> {
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n).catch(() => false)));
    }
  } catch {}
  // Force a reload; modern browsers ignore the boolean param
  window.location.reload();
}


