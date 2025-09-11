/**
 * Resolve a time token into a valid NASA GIBS daily composite date string.
 * Allowed inputs: "today", "-1d", "-2d", "-3d", or an ISO date (YYYY-MM-DD).
 * Always returns a string in YYYY-MM-DD (UTC).
 * Throws if the result is in the future or more than 3 days old.
 *
 * NASA GIBS MODIS SST imagery is provided as daily composites:
 * one complete global layer per UTC day.
 */
export function resolveSstDate(input: string): string {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  function toISO(d: Date): string {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }

  let target: Date;

  if (input === "today") {
    target = today;
  } else if (/^\-\d+d$/.test(input)) {
    const days = parseInt(input.slice(1, -1), 10);
    if (days < 1 || days > 3) {
      throw new Error(`Invalid relative day: ${input}. Only -1d, -2d, -3d allowed.`);
    }
    target = new Date(today);
    target.setUTCDate(today.getUTCDate() - days);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    target = new Date(input + "T00:00:00Z");
  } else {
    throw new Error(`Invalid SST time input: ${input}`);
  }

  // Guardrails: must not be future, must not be older than 3 days
  if (target > today) {
    throw new Error(`Invalid SST date: ${toISO(target)} is in the future`);
  }
  if ((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24) > 3) {
    throw new Error(`Invalid SST date: ${toISO(target)} is more than 3 days old`);
  }

  return toISO(target);
}


