export function buildWMTS(template: string, isoTime: string): string {
  return template.replace('{time}', encodeURIComponent(isoTime)).trim();
}


