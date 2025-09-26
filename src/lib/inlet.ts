/**
 * Inlet resolution utilities for demo and production modes
 */

export function resolveInletSlug(current?: string | null): string | null {
  if (current) return current;
  if (process.env.NEXT_PUBLIC_DEMO_FORCE_INLET === '1') {
    return process.env.NEXT_PUBLIC_DEMO_DEFAULT_INLET || 'md-ocean-city';
  }
  return null;
}

export function resolveInlet(current?: any) {
  if (current?.id) return current;
  if (process.env.NEXT_PUBLIC_DEMO_FORCE_INLET === '1') {
    return { 
      id: 'md-ocean-city', 
      name: 'Ocean City Inlet',
      state: 'MD',
      center: [-75.0906, 38.3286], // [lng, lat] for Mapbox
      zoom: 7.6,
      color: '#059669'
    };
  }
  return null;
}

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_FORCE_INLET === '1';
}

export function getDemoMessage(): string | null {
  if (isDemoMode()) {
    return "Using Ocean City, MD for the demo. Live builds will use your selected inlet.";
  }
  return null;
}
