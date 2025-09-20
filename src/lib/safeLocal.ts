/**
 * Safe localStorage utility that prevents SSR hydration errors
 * by gracefully handling server-side rendering where localStorage is undefined
 */
export const safeLocal = {
  /**
   * Safely get an item from localStorage
   * Returns null on server-side or if localStorage is unavailable
   */
  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to read from localStorage for key: ${key}`, error);
      return null;
    }
  },

  /**
   * Safely set an item in localStorage
   * No-op on server-side or if localStorage is unavailable
   */
  set(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to write to localStorage for key: ${key}`, error);
    }
  },

  /**
   * Safely remove an item from localStorage
   */
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove from localStorage for key: ${key}`, error);
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const testKey = '__localStorage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
};
