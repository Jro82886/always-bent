/**
 * 🌊 ABFI Philosophical Fishing Bank
 * Contextual wisdom that matches the user's current feature or analysis result
 * Making the system feel intentional and alive, like the ocean itself is speaking
 */

export const PHILOSOPHY_BANK = {
  // 🌀 Edges & Boundaries - for SST breaks, temp fronts
  edges: [
    "Edges are not endings — they are invitations to transformation.",
    "Predators wait at the edge because life is richest where boundaries blur.",
    "A temperature break is a truth break — where opposites collide, life awakens.",
    "Thermal lines are thresholds: cross them and the story changes.",
    "Confusion at the boundary reveals opportunity for those who pay attention."
  ],
  
  // 🔍 Patterns & Recognition - for CHL, SST overlays, multi-layer analysis
  patterns: [
    "The ocean hides her wisdom in layers; only those who look deeply see the patterns.",
    "Every ripple is a signal — read it, and you'll never be lost.",
    "A scattered school is chaos; a tight ball is survival.",
    "The sea's surface is noise; meaning lies beneath.",
    "To see patterns in water is to see patterns in life."
  ],
  
  // 🎣 Patience & Flow - for no hotspot found, uniform water
  patience: [
    "The tide teaches patience — nothing arrives before its time.",
    "The current carries both hunter and prey; surrender and you'll find your path.",
    "Like driftwood, sometimes we travel farther by doing less.",
    "Storms pass, but the sea remembers every wave.",
    "To fish is to wait — to live is to trust the unseen depths."
  ],
  
  // ⚖️ Adaptation & Balance - for changing conditions, fleet movement
  adaptation: [
    "All balance is dynamic — the ocean never holds still.",
    "Fish adapt or disappear; so do we.",
    "When the water warms, the fleet must move.",
    "Life thrives not in comfort, but in contrast.",
    "Every migration is a reminder that nothing true is static."
  ],
  
  // 🐟 Predator & Prey - for convergence zones, high activity areas
  predatorPrey: [
    "A baitfish's confusion is a predator's clarity.",
    "At the edge, prey hesitate and predators decide.",
    "Predator and prey share the same rhythm — only intent separates them.",
    "Every chase is both an ending and a beginning.",
    "To feed or be fed upon — the sea offers no middle ground."
  ],
  
  // 🌌 Depth & Mystery - for deep water, unknown areas
  depth: [
    "Dark water holds answers bright skies never reveal.",
    "Beneath every calm lies a current unseen.",
    "The deeper the drop, the greater the secrets.",
    "Mystery is not absence — it is abundance waiting to be understood.",
    "The unknown isn't empty — it's overflowing."
  ],
  
  // 🪞 Reflection & Self - for community chat, user profiles
  reflection: [
    "The ocean reflects us — restless, vast, and searching.",
    "We are all currents — moving, colliding, reshaping each other.",
    "Every cast is a hope made visible.",
    "The fish doesn't see the hook — only the hunger.",
    "To fish is to practice humility before the unseen."
  ],
  
  // 🌅 Time & Impermanence - for time-based analysis, historical data
  time: [
    "No wave is the same — no moment repeats.",
    "The bite is brief, but the memory lasts forever.",
    "Every tide erases and rewrites the shore.",
    "A hot bite today is gone tomorrow — so is everything we cling to.",
    "Time flows like water — unstoppable, ungraspable."
  ],
  
  // ⚓ Strength & Survival - for fleet tracking, community strength
  strength: [
    "A lone fish is vulnerable; a school survives.",
    "Strength lies not in fighting the current, but in riding it.",
    "Resilience is measured in returns — every tide comes back.",
    "Hooks test the strong, nets test the many.",
    "The sea rewards those who endure."
  ],
  
  // ✨ Wonder & Connection - for first-time users, welcome screens, general inspiration
  wonder: [
    "Every shimmer of scales is a reminder of life's brilliance.",
    "Fishing is less about catching, more about listening.",
    "Every cast ties us to the infinite.",
    "The ocean's story is written in temperature, current, and life — and we are part of it.",
    "To understand the sea is to understand ourselves."
  ]
};

/**
 * Context-aware quote selection based on ABFI features
 */
export type PhilosophyContext = 
  | 'thermal_edge'      // SST breaks detected
  | 'pattern_detected'  // Multi-layer patterns found
  | 'convergence'       // Convergence zone identified
  | 'no_hotspot'        // Uniform water, no features
  | 'fleet_tracking'    // Boats/AIS layer active
  | 'community_chat'    // In chat mode
  | 'report_catch'      // After reporting a catch
  | 'welcome'           // Onboarding/welcome
  | 'loading'           // Loading states
  | 'general';          // Default/universal

/**
 * Get a contextual quote based on the current feature or analysis
 */
export function getPhilosophicalQuote(context: PhilosophyContext): string {
  let category: keyof typeof PHILOSOPHY_BANK;
  
  switch (context) {
    case 'thermal_edge':
      category = 'edges';
      break;
    case 'pattern_detected':
    case 'convergence':
      category = 'patterns';
      break;
    case 'no_hotspot':
      category = 'patience';
      break;
    case 'fleet_tracking':
      category = 'adaptation';
      break;
    case 'community_chat':
      category = 'reflection';
      break;
    case 'report_catch':
      category = 'strength';
      break;
    case 'welcome':
    case 'loading':
      category = 'wonder';
      break;
    default:
      // Pick from any category for general use
      const categories = Object.keys(PHILOSOPHY_BANK) as Array<keyof typeof PHILOSOPHY_BANK>;
      category = categories[Math.floor(Math.random() * categories.length)];
  }
  
  const quotes = PHILOSOPHY_BANK[category];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * Get a quote based on analysis results
 */
export function getAnalysisQuote(analysis: {
  hotspot: any;
  tempRange?: { min: number; max: number };
  layerAnalysis?: {
    convergence?: { detected: boolean };
    sst?: { hasEdge: boolean };
    chl?: { description: string };
  };
}): string {
  // Convergence zone detected - highest priority
  if (analysis.layerAnalysis?.convergence?.detected) {
    return getPhilosophicalQuote('convergence');
  }
  
  // Strong thermal edge detected
  if (analysis.hotspot && analysis.layerAnalysis?.sst?.hasEdge) {
    return getPhilosophicalQuote('thermal_edge');
  }
  
  // Pattern in layers but no strong hotspot
  if (analysis.layerAnalysis && !analysis.hotspot) {
    return getPhilosophicalQuote('pattern_detected');
  }
  
  // No features found - encourage patience
  if (!analysis.hotspot) {
    return getPhilosophicalQuote('no_hotspot');
  }
  
  // Default to edges for any hotspot
  return getPhilosophicalQuote('thermal_edge');
}

/**
 * Special quotes for specific ABFI moments
 */
export const MOMENT_QUOTES = {
  firstSnip: "Your first cast into intelligence. The ocean remembers everything.",
  firstCatch: "Your first report strengthens the whole fleet. We rise together.",
  joinCommunity: "Welcome to the current. We are all drops in the same ocean.",
  enableLocation: "Trust earned is knowledge shared. The fleet protects its own.",
  morningLogin: "Dawn patrol sees what darkness hides.",
  eveningLogin: "Sunset bite — when predators wake and prey descends.",
  weekendWarrior: "Weekend waters tell different stories than weekday solitude."
};

/**
 * Get time-based contextual quote
 */
export function getTimeBasedQuote(): string {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  
  // Weekend check
  if (day === 0 || day === 6) {
    if (Math.random() > 0.7) return MOMENT_QUOTES.weekendWarrior;
  }
  
  // Time of day
  if (hour >= 4 && hour < 8) {
    if (Math.random() > 0.7) return MOMENT_QUOTES.morningLogin;
  } else if (hour >= 17 && hour < 21) {
    if (Math.random() > 0.7) return MOMENT_QUOTES.eveningLogin;
  }
  
  // Default to wonder category for general time-based
  return getPhilosophicalQuote('general');
}
