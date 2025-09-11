/**
 * Resolve UTC date string to YYYY-MM-DD format
 * Input: "today" | "-1d" | "-2d" | "YYYY-MM-DD"
 * Output: "YYYY-MM-DD" (always UTC)
 */
export function resolveUtcDate(input: string): string {
  if (input === "today") {
    return isoTodayUTC();
  }

  if (/^-\d+d$/.test(input)) {
    const days = parseInt(input.slice(1));
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return toISO(d);
  }

  // Assume it's already YYYY-MM-DD
  return input;
}

function isoTodayUTC(): string {
  return toISO(new Date());
}

function toISO(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
