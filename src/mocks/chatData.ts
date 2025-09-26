// Mock chat data for demo mode
export const mockChats: Record<string, any[]> = {
  'inlet:ocean-city-md': [
    {
      id: '1',
      user: 'CaptainMike',
      inletId: 'inlet:ocean-city-md',
      text: 'Birds working hard 2 miles east of the inlet. Lots of bait.',
      createdAt: Date.now() - 1000 * 60 * 15, // 15 min ago
    },
    {
      id: '2', 
      user: 'ReelDeal22',
      inletId: 'inlet:ocean-city-md',
      text: 'Thanks Mike! Heading that way now.',
      createdAt: Date.now() - 1000 * 60 * 12,
    },
    {
      id: '3',
      user: 'SaltyDog',
      inletId: 'inlet:ocean-city-md', 
      text: 'Water temp just hit 76°F on the edge. Fish should turn on soon.',
      createdAt: Date.now() - 1000 * 60 * 8,
    },
    {
      id: '4',
      user: 'CaptainMike',
      inletId: 'inlet:ocean-city-md',
      text: '@SaltyDog seeing the same temps here. Current is ripping north.',
      createdAt: Date.now() - 1000 * 60 * 5,
    },
    {
      id: '5',
      user: 'FishHawk',
      inletId: 'inlet:ocean-city-md',
      text: 'Anyone seeing any weed lines forming? Looked clean yesterday.',
      createdAt: Date.now() - 1000 * 60 * 2,
    }
  ],
  'offshore:tuna': [
    {
      id: '6',
      user: 'BluefinBob',
      inletId: 'offshore:tuna',
      text: 'Hot bite at the Washington! Chunking is on fire right now.',
      createdAt: Date.now() - 1000 * 60 * 30,
    },
    {
      id: '7',
      user: 'TunaHunter',
      inletId: 'offshore:tuna',
      text: 'Confirmed! Just boxed a nice 60" fish. They want the big chunks.',
      createdAt: Date.now() - 1000 * 60 * 25,
    },
    {
      id: '8', 
      user: 'OffshoreAce',
      inletId: 'offshore:tuna',
      text: 'Heading out at 3am tomorrow. What depth are you marking them?',
      createdAt: Date.now() - 1000 * 60 * 20,
    },
    {
      id: '9',
      user: 'BluefinBob',
      inletId: 'offshore:tuna',
      text: '@OffshoreAce 60-80ft on the sounder. Some deeper.',
      createdAt: Date.now() - 1000 * 60 * 15,
    },
    {
      id: '10',
      user: 'ReelScreamer',
      inletId: 'offshore:tuna',
      text: 'SST break looking good at 73.5 to 76.8. Should hold fish.',
      createdAt: Date.now() - 1000 * 60 * 10,
    }
  ],
  'inshore:general': [
    {
      id: '11',
      user: 'BayRat',
      inletId: 'inshore:general',
      text: 'Stripers are thick in the back bays. Throwing swim shads.',
      createdAt: Date.now() - 1000 * 60 * 45,
    },
    {
      id: '12',
      user: 'FlatsHunter',
      inletId: 'inshore:general',
      text: 'Speckled trout bite is insane on the grass beds!',
      createdAt: Date.now() - 1000 * 60 * 35,
    },
    {
      id: '13',
      user: 'PierPressure',
      inletId: 'inshore:general',
      text: 'Anyone tried the jetties lately? Thinking about tog.',
      createdAt: Date.now() - 1000 * 60 * 25,
    },
    {
      id: '14',
      user: 'BayRat',
      inletId: 'inshore:general',
      text: '@PierPressure Tog are there but you need green crabs.',
      createdAt: Date.now() - 1000 * 60 * 20,
    },
    {
      id: '15',
      user: 'BackwaterBill',
      inletId: 'inshore:general',
      text: 'Tide is about to switch. Time to hit the bridges!',
      createdAt: Date.now() - 1000 * 60 * 5,
    }
  ]
};

export const mockPresence: Record<string, number> = {
  'inlet:ocean-city-md': 5,
  'offshore:tuna': 12,
  'inshore:general': 8
};
