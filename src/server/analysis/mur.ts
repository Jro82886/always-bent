export type BBox = { west:number; south:number; east:number; north:number };

async function cmrFetch(path: string): Promise<any> {
  const res = await fetch(`https://cmr.earthdata.nasa.gov${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'abfi/1.0' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

function buildTemporal(dateISO?: string): string {
  if (!dateISO) return 'NOW-3%20DAYS,NOW';
  // +/- 1 day around requested date
  const d = new Date(dateISO);
  const d0 = new Date(d.getTime() - 24*3600*1000).toISOString();
  const d1 = new Date(d.getTime() + 24*3600*1000).toISOString();
  return encodeURIComponent(`${d0},${d1}`);
}

export async function findMurGranuleUrl(bbox: BBox, dateISO?: string): Promise<string | null> {
  const bboxParam = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
  const temporal = buildTemporal(dateISO);
  const qs = `short_name=MUR-JPL-L4-GLOB-v4.1&provider=POCLOUD&page_size=1&sort_key=-start_date&bounding_box=${bboxParam}&temporal=${temporal}`;
  let j = await cmrFetch(`/search/granules.umm_json?${qs}`);
  if (!j || !j.items || !j.items.length) {
    // fallback: last 3 days anywhere
    j = await cmrFetch(`/search/granules.umm_json?short_name=MUR-JPL-L4-GLOB-v4.1&provider=POCLOUD&page_size=1&sort_key=-start_date&temporal=NOW-3%20DAYS,NOW`);
  }
  const item = j?.items?.[0]?.umm;
  if (!item) return null;
  const urls: string[] = (item.RelatedUrls || [])
    .filter((u: any) => /OPENDAP|GET DATA/i.test(u?.Type || ''))
    .map((u: any) => u.URL)
    .filter(Boolean);
  return urls[0] || null;
}


