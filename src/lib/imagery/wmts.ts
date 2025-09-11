import { DaySel, TimeMode, resolveTime } from './time';

export function buildWMTS(template: string, day: DaySel, mode: TimeMode) {
  let url = template.trim();
  if (!url.includes('{time}')) return url; // allow templates without time

  const t = resolveTime(day, mode); // 'default' | 'YYYY-MM-DD' | null
  if (t === null) {
    // remove TIME param cleanly if mode === 'none'
    url = url
      .replace(/([?&])TIME=\{time\}(&)?/i, (_, lead, amp) => (amp ? lead : ''))
      .replace(/[?&]$/, '');
  } else {
    url = url.replace('{time}', encodeURIComponent(t));
  }
  return url;
}
