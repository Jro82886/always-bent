/**
 * Inlet resolution utilities for demo and production modes
 */

export function resolveInletSlug(current?: string | null): string | null {
  if (current) return current;
  if (process.env.NEXT_PUBLIC_DEMO_FORCE_INLET === '1') {
    return process.env.NEXT_PUBLIC_DEMO_DEFAULT_INLET || 'ocean-city-md';
  }
  return null;
}

export function resolveInlet(current?: any) {
  if (current?.slug) return current;
  if (process.env.NEXT_PUBLIC_DEMO_FORCE_INLET === '1') {
    return { 
      slug: 'ocean-city-md', 
      name: 'Ocean City, MD',
      center: [-75.091, 38.329] // [lng, lat] for Mapbox
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
