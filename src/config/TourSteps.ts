// Tour step configuration for ABFI Tutorial
export interface TourStep {
  id: string;
  title?: string;
  content: string;
  target?: string; // CSS selector or ref name
  spotlightType?: 'element' | 'area' | 'banner';
  action?: {
    type: 'enable-location' | 'navigate' | 'close';
    label?: string;
    secondary?: string;
  };
}

export const communitySteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Real-time with your inlet',
    content: 'See yourself, your fleet, and commercial vessels. If you see them, they can see you.',
    spotlightType: 'banner'
  },
  {
    id: 'inlet-dropdown',
    target: '[data-tour="inlet-dropdown"]',
    content: 'Your home inlet. Change anytime — the map won\'t move until you choose.',
    spotlightType: 'element'
  },
  {
    id: 'show-me',
    target: '[data-tour="show-me-toggle"]',
    content: 'Toggle your glowing orb. Anchored in your inlet, it moves offshore when you do.',
    spotlightType: 'element',
    action: {
      type: 'enable-location',
      label: 'Enable',
      secondary: 'Later'
    }
  },
  {
    id: 'fly-to-inlet',
    target: '[data-tour="fly-to-inlet"]',
    content: 'Only this button moves the map. You\'re in control.',
    spotlightType: 'element'
  },
  {
    id: 'fleet-toggles',
    target: '[data-tour="fleet-section"]',
    content: 'See your fleet when location is on and your inlet is set.',
    spotlightType: 'area'
  },
  {
    id: 'commercial',
    target: '[data-tour="commercial-toggle"]',
    content: 'Commercial vessels are always available.',
    spotlightType: 'element'
  },
  {
    id: 'abfi-bite',
    target: '[data-tour="abfi-button"]',
    content: 'Tap when you get bit. We capture conditions automatically. Offline? It syncs later.',
    spotlightType: 'element'
  }
];

export const soloSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Private scouting mode',
    content: 'Use ocean intel without sharing your location.',
    spotlightType: 'banner'
  },
  {
    id: 'analysis-layers',
    target: '[data-tour="layer-toggles"]',
    content: 'Turn on SST and Chlorophyll to read breaks fast.',
    spotlightType: 'area'
  },
  {
    id: 'bite-prediction',
    target: '[data-tour="prediction-card"]',
    content: 'See bite windows by period for today.',
    spotlightType: 'element'
  },
  {
    id: 'reports',
    target: '[data-tour="reports-section"]',
    content: 'Saved spots and bite logs. Search by month or species.',
    spotlightType: 'area'
  },
  {
    id: 'whats-hidden',
    content: 'Tracking, chat, and fleet are hidden in Solo. Switch to Community any time.',
    spotlightType: 'banner'
  }
];
