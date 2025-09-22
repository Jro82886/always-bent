// GFW Feature Flag
export const gfwEnabled =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FLAG_GFW_ENABLED === 'true') ||
  (typeof window !== 'undefined' && (window as any).__GFW_OVERRIDE__ === true);
