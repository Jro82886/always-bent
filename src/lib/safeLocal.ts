export const safeLocal = {
  get(key: string) {
    if (typeof window === 'undefined') return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, val: string) {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(key, val); } catch {}
  }
};
