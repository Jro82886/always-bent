export type CatchDraft = {
  user_id: string;
  lat: number;
  lon: number;
  captured_at: string;
  inlet_id?: string;
  species?: string;
  method?: string;
  lure?: string;
  depth_m?: number;
  weight_kg?: number;
  length_cm?: number;
  notes?: string;
  photo_url?: string;
  app_version?: string;
  device?: string;
  gps_accuracy_m?: number;
};

export async function reportCatch(draft: CatchDraft) {
  const res = await fetch('/api/catches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new Error('Failed to save catch');
  return res.json();
}


