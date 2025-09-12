/**
 * 🌊 ABFI Philosophical Fishing Bank - Complete Collection
 * 50+ quotes that flow like Ocean Intelligence
 * Mixing science, pattern recognition, and ocean wisdom with life lessons
 */

export const FULL_PHILOSOPHY_BANK = [
  // 🎣 Patience & Flow (1-10)
  "The tide teaches patience — nothing arrives before its time.",
  "The current carries both hunter and prey; surrender and you'll find your path.",
  "Like driftwood, sometimes we travel farther by doing less.",
  "Storms pass, but the sea remembers every wave.",
  "To fish is to wait — to live is to trust the unseen depths.",
  "Patience is the angler's greatest lure.",
  "The ocean doesn't rush, yet everything arrives.",
  "Still water runs deep; busy water runs shallow.",
  "The best fisherman is invisible to the fish.",
  "Wait like water — formless, patient, inevitable.",

  // 🌐 Boundaries & Edges (11-20)
  "Edges are not endings — they are invitations to transformation.",
  "Predators wait at the edge because life is richest where boundaries blur.",
  "A temperature break is a truth break — where opposites collide, life awakens.",
  "Thermal lines are thresholds: cross them and the story changes.",
  "Confusion at the boundary reveals opportunity for those who pay attention.",
  "Every edge is a doorway between worlds.",
  "Where warm meets cold, the magic unfolds.",
  "Boundaries are where negotiations happen — in ocean and in life.",
  "The sharpest edges cut the deepest channels.",
  "Life doesn't happen in the middle — it explodes at the margins.",

  // 🌀 Patterns & Wisdom (21-30)
  "The ocean hides her wisdom in layers; only those who look deeply see the patterns.",
  "Every ripple is a signal — read it, and you'll never be lost.",
  "A scattered school is chaos; a tight ball is survival.",
  "The sea's surface is noise; meaning lies beneath.",
  "To see patterns in water is to see patterns in life.",
  "Chaos is pattern waiting to be recognized.",
  "The wise angler reads water like ancient text.",
  "Patterns repeat until their lesson is learned.",
  "What looks random from above makes sense from below.",
  "Intelligence is seeing the pattern before it completes.",

  // ⚖️ Balance & Adaptation (31-40)
  "All balance is dynamic — the ocean never holds still.",
  "Fish adapt or disappear; so do we.",
  "When the water warms, the fleet must move.",
  "Life thrives not in comfort, but in contrast.",
  "Every migration is a reminder that nothing true is static.",
  "Adaptation is the ocean's only constant.",
  "The flexible rod catches more than the rigid one.",
  "Change your depth, change your luck.",
  "Evolution happens one tide at a time.",
  "The ocean rewards those who bend, not those who break.",

  // 🔥 Predator & Prey (41-50)
  "A baitfish's confusion is a predator's clarity.",
  "At the edge, prey hesitate and predators decide.",
  "Predator and prey share the same rhythm — only intent separates them.",
  "Every chase is both an ending and a beginning.",
  "To feed or be fed upon — the sea offers no middle ground.",
  "The hunter becomes hunted when the tide turns.",
  "Fear travels faster than fins.",
  "In clear water, be subtle; in murky water, be bold.",
  "The best predators are patient gardeners.",
  "Every baitball tells a story of coordination and chaos.",

  // 🌌 Depth & Mystery (51-60)
  "Dark water holds answers bright skies never reveal.",
  "Beneath every calm lies a current unseen.",
  "The deeper the drop, the greater the secrets.",
  "Mystery is not absence — it is abundance waiting to be understood.",
  "The unknown isn't empty — it's overflowing.",
  "Depth changes everything — pressure, light, and truth.",
  "What swims in darkness fears no shadow.",
  "The abyss doesn't gaze back — it pulls you in.",
  "Deep water doesn't make noise about its depth.",
  "Secrets sink; wisdom rises.",

  // 🪞 Reflection & Self (61-70)
  "The ocean reflects us — restless, vast, and searching.",
  "We are all currents — moving, colliding, reshaping each other.",
  "Every cast is a hope made visible.",
  "The fish doesn't see the hook — only the hunger.",
  "To fish is to practice humility before the unseen.",
  "The sea doesn't care about your ego — only your respect.",
  "What you seek in the ocean, you carry within.",
  "Every angler casts their own shadow.",
  "The rod bends toward what the heart desires.",
  "We fish not to conquer, but to connect.",

  // 🌅 Time & Impermanence (71-80)
  "No wave is the same — no moment repeats.",
  "The bite is brief, but the memory lasts forever.",
  "Every tide erases and rewrites the shore.",
  "A hot bite today is gone tomorrow — so is everything we cling to.",
  "Time flows like water — unstoppable, ungraspable.",
  "Yesterday's honey hole is today's dead zone.",
  "The ocean has no memory, yet forgets nothing.",
  "Timing isn't everything — it's the only thing.",
  "Miss the tide, miss the ride.",
  "The perfect moment passes before you recognize it.",

  // ⚓ Strength & Survival (81-90)
  "A lone fish is vulnerable; a school survives.",
  "Strength lies not in fighting the current, but in riding it.",
  "Resilience is measured in returns — every tide comes back.",
  "Hooks test the strong, nets test the many.",
  "The sea rewards those who endure.",
  "Survival is a team sport in the ocean.",
  "The strongest swimmers know when not to swim.",
  "Endurance is the ocean's favorite virtue.",
  "Break like water — impossible to destroy.",
  "The coral that bends survives the storm.",

  // ✨ Wonder & Connection (91-100)
  "Every shimmer of scales is a reminder of life's brilliance.",
  "Fishing is less about catching, more about listening.",
  "Every cast ties us to the infinite.",
  "The ocean's story is written in temperature, current, and life — and we are part of it.",
  "To understand the sea is to understand ourselves.",
  "Wonder begins where knowledge ends.",
  "The ocean speaks to those who listen with their whole body.",
  "Connection happens in the space between the cast and the catch.",
  "We are not above the water — we are of it.",
  "The best fishing stories are about everything except the fish.",

  // 🌊 Bonus Universal Truths (101-110)
  "Salt water cures everything — tears, sweat, or the sea.",
  "The ocean is honest — it shows you exactly who you are.",
  "Respect the water, or the water will teach you respect.",
  "Every sunrise is an invitation; every sunset, a benediction.",
  "The sea gives and takes with the same hand.",
  "Luck is preparation meeting opportunity — at the right depth.",
  "The ocean doesn't owe you fish — earn them.",
  "Knowledge speaks; wisdom listens; the ocean does both.",
  "The best technology is understanding natural patterns.",
  "In the end, we all return to water."
];

/**
 * Get a random quote from the full bank
 */
export function getRandomPhilosophicalQuote(): string {
  return FULL_PHILOSOPHY_BANK[Math.floor(Math.random() * FULL_PHILOSOPHY_BANK.length)];
}

/**
 * Get multiple unique random quotes
 */
export function getUniqueRandomQuotes(count: number): string[] {
  const shuffled = [...FULL_PHILOSOPHY_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get quotes by theme/category
 */
export function getQuotesByTheme(theme: 
  | 'patience' 
  | 'edges' 
  | 'patterns' 
  | 'adaptation' 
  | 'predator' 
  | 'depth' 
  | 'reflection' 
  | 'time' 
  | 'strength' 
  | 'wonder'
): string[] {
  const themeRanges = {
    patience: [0, 10],
    edges: [10, 20],
    patterns: [20, 30],
    adaptation: [30, 40],
    predator: [40, 50],
    depth: [50, 60],
    reflection: [60, 70],
    time: [70, 80],
    strength: [80, 90],
    wonder: [90, 100]
  };
  
  const [start, end] = themeRanges[theme] || [0, 110];
  return FULL_PHILOSOPHY_BANK.slice(start, end);
}

/**
 * Get a contextual quote based on time of day
 */
export function getTimeOfDayQuote(): string {
  const hour = new Date().getHours();
  
  if (hour >= 4 && hour < 8) {
    // Dawn patrol
    const dawnQuotes = [
      "Dawn patrol sees what darkness hides.",
      "First light, first bite.",
      "The early hook gets the fish.",
      "Morning glass tells no lies.",
      "Sunrise is nature's starter pistol."
    ];
    return dawnQuotes[Math.floor(Math.random() * dawnQuotes.length)];
  } else if (hour >= 17 && hour < 21) {
    // Evening bite
    const eveningQuotes = [
      "Sunset bite — when predators wake and prey descends.",
      "Magic hour isn't just for photographers.",
      "The last light is the best light.",
      "Evening shadows bring morning's dreams.",
      "Dusk is dawn's echo across the water."
    ];
    return eveningQuotes[Math.floor(Math.random() * eveningQuotes.length)];
  } else if (hour >= 21 || hour < 4) {
    // Night fishing
    const nightQuotes = [
      "Night fishing: where instinct replaces sight.",
      "The darkness holds the biggest secrets.",
      "Moon phases matter more than sun positions.",
      "Night feeds different mouths.",
      "Stars above, phosphorescence below — magic between."
    ];
    return nightQuotes[Math.floor(Math.random() * nightQuotes.length)];
  }
  
  // Default daytime
  return getRandomPhilosophicalQuote();
}
