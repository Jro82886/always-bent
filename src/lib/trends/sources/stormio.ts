import { TrendsInput } from '@/types/trends';
import { getInletById } from '@/lib/inlets';

export async function getStormio(input: TrendsInput) {
  const inlet = getInletById(input.inletId);
  // Use inlet center or East Coast default for overview
  const [lng, lat] = inlet?.center || [-74.5, 33.5];
  
  const res = await fetch(`/api/stormio?lat=${lat}&lng=${lng}`, { 
    cache: 'no-store' 
  });
  
  if (!res.ok) {
    throw new Error(`Stormio API failed: ${res.status}`);
  }
  
  const json = await res.json();
  
  // The API already returns the exact shape we need:
  // { weather, moon, tides: {next, events, curve?}, sun, lastIso }
  return json;
}
