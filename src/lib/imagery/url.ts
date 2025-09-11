export function buildWMTS(template: string, isoTime: string): string {
  // Replace both {time} and {TIME} placeholders
  return template
    .replace('{time}', encodeURIComponent(isoTime))
    .replace('{TIME}', encodeURIComponent(isoTime))
    .trim();
}


