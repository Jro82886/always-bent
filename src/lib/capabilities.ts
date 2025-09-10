import { XMLParser } from 'fast-xml-parser';
import { WMS_PRESETS } from '@/lib/wmsPresets';

type TimeCacheEntry = { times: string[]; fetchedAt: number };
const CAP_CACHE: Record<string, TimeCacheEntry> = {};

// 15 minutes TTL (adjust as you like)
const TTL_MS = 15 * 60 * 1000;

// Make a minimal GetCapabilities URL for ERDDAP WMS
function buildCapabilitiesUrl(base: string, version = '1.3.0') {
  const u = base.endsWith('/request') ? base.replace(/\/request$/, '') : base;
  const url = new URL(u);
  url.pathname = url.pathname.replace(/\/wms\/?$/, '/wms'); // normalize
  // ERDDAP: /wms/<dataset>/ (not /request) + service=WMS&request=GetCapabilities
  if (!/\/wms\//.test(url.pathname)) {
    // If base looked like .../wms/<dataset>, keep it; else assume it's already right
  }
  url.searchParams.set('service', 'WMS');
  url.searchParams.set('request', 'GetCapabilities');
  url.searchParams.set('version', version);
  return url.toString();
}

async function fetchCapabilitiesXML(preset: string) {
  const p = WMS_PRESETS[preset];
  if (!p) throw new Error(`Unknown preset: ${preset}`);
  const url = buildCapabilitiesUrl(p.base, p.version);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ABFI/1.0 (capabilities)' },
    // Cache at the edge/CDN for a bit too
    next: { revalidate: 900 } as any,
  });
  if (!res.ok) throw new Error(`Capabilities ${res.status} ${res.statusText}`);
  return await res.text();
}

function parseTimesFromXML(xml: string): string[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    allowBooleanAttributes: true,
  });
  const j = parser.parse(xml);

  // Try to locate all Dimension nodes and pick time
  const dims =
    j?.WMS_Capabilities?.Capability?.Layer?.Dimension ??
    j?.WMT_MS_Capabilities?.Capability?.Layer?.Dimension ??
    [];

  const list = Array.isArray(dims) ? dims : [dims];
  const timeDim = list.find((d: any) => d?.name === 'time');
  const content: string = timeDim?.['#text'] || timeDim?.__text || '';

  if (!content) return [];

  // ERDDAP usually provides comma-separated ISO times
  if (content.includes(',')) {
    return content.split(',').map(s => s.trim()).filter(Boolean);
  }
  // If "start/end/period", return [end] as "latest" and [start] for fallback
  if (content.includes('/')) {
    const [start, end] = content.split('/').map(s => s.trim());
    return [end, start].filter(Boolean);
  }
  return [content.trim()].filter(Boolean);
}

export async function getCachedTimes(preset: string): Promise<string[]> {
  const now = Date.now();
  const hit = CAP_CACHE[preset];
  if (hit && now - hit.fetchedAt < TTL_MS && hit.times.length) {
    return hit.times;
  }
  const xml = await fetchCapabilitiesXML(preset);
  const times = parseTimesFromXML(xml);
  CAP_CACHE[preset] = { times, fetchedAt: now };
  return times;
}

/** Helper: get last N times (e.g., Latest, -1d, -2d, -3d) */
export async function getRecentTimes(preset: string, n = 4): Promise<string[]> {
  const all = await getCachedTimes(preset);
  // ERDDAP time arrays are usually ascending. Take the last n.
  return all.slice(-n);
}
