export const SPECIES = [
  { slug: "yellowfin-tuna", label: "Yellowfin Tuna", color: "#FFD54F" }, // golden yellow
  { slug: "bluefin-tuna",   label: "Bluefin Tuna",   color: "#4FC3F7" }, // bright blue
  { slug: "bigeye-tuna",    label: "Bigeye Tuna",    color: "#BA68C8" }, // purple
  { slug: "mahi",           label: "Mahi-Mahi",     color: "#81C784" }, // green
  { slug: "wahoo",          label: "Wahoo",         color: "#FF8A65" }, // orange
  { slug: "marlin",         label: "Marlin",        color: "#7986CB" }, // indigo
  { slug: "swordfish",      label: "Swordfish",     color: "#A1887F" }, // taupe
  { slug: "sailfish",       label: "Sailfish",      color: "#64B5F6" }, // lighter blue
] as const;

export type SpeciesSlug = typeof SPECIES[number]['slug'];

export function prettySpecies(slug: string): string {
  const found = SPECIES.find(x => x.slug === slug);
  return found ? found.label : slug;
}

export function getSpeciesEmoji(slug: string): string {
  // Fun emoji mapping for visual flair
  const emojiMap: Record<string, string> = {
    "yellowfin-tuna": "🐟",
    "bluefin-tuna": "🐟",
    "bigeye-tuna": "🐟",
    "mahi": "🐠",
    "wahoo": "⚡",
    "marlin": "🗡️",
    "swordfish": "⚔️",
    "sailfish": "🏴‍☠️",
  };
  return emojiMap[slug] || "🐟";
}

export function getSpeciesColor(slug: string): string {
  const found = SPECIES.find(x => x.slug === slug);
  return found?.color || "#6B7280"; // default gray if not found
}
