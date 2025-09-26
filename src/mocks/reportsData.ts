// Mock highlights data for demo mode
export const mockHighlights = [
  {
    id: '1',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    payload_json: {
      highlight: true,
      identity: {
        captain: 'Mike',
        boat: 'Reel Deal'
      },
      analysis: {
        summary: 'Strong temperature break with active bait schools. Multiple hookups on the troll.',
        sst: 76.8,
        wind_speed: 12
      },
      species: ['Yellowfin Tuna', 'Mahi'],
      coords: {
        lat: 38.5,
        lng: -74.2
      }
    }
  },
  {
    id: '2',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 90 min ago
    payload_json: {
      highlight: true,
      identity: {
        captain: 'Sarah',
        boat: 'Blue Horizon'
      },
      analysis: {
        summary: 'Productive green water edge with consistent action. Birds working hard over bait.',
        sst: 74.2,
        wind_speed: 8
      },
      species: ['Bluefin Tuna', 'False Albacore'],
      coords: {
        lat: 39.1,
        lng: -73.8
      }
    }
  },
  {
    id: '3',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    payload_json: {
      highlight: true,
      identity: {
        captain: 'Joe',
        boat: 'Lucky Strike'
      },
      analysis: {
        summary: 'Weed line holding fish. Color change from blue to green with good current.',
        sst: 77.5,
        wind_speed: 15
      },
      species: ['Mahi', 'Wahoo', 'Skipjack'],
      coords: {
        lat: 38.8,
        lng: -74.5
      }
    }
  }
];
