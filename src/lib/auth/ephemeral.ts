// TODO: Replace with Memberstack user once enabled

export function getOrCreateEphemeralUser() {
  const k = 'abfi_ephemeral_user';
  let u = localStorage.getItem(k);
  if (!u) {
    u = JSON.stringify({ id: crypto.randomUUID(), createdAt: Date.now(), kind: 'pwa' });
    localStorage.setItem(k, u);
  }
  return JSON.parse(u) as { id: string; createdAt: number; kind: 'pwa' };
}
