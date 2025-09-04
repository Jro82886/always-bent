export async function edlFetch(input: string, init: RequestInit = {}) {
  const token = process.env.EDL_BEARER_TOKEN;
  if (!token) throw new Error('EDL_BEARER_TOKEN missing');
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', headers.get('Accept') || '*/*');
  return fetch(input, { ...init, headers, cache: 'no-store' });
}


