// /mocks/reports.ts
export const MOCK_HIGHLIGHTS = [
  { id:'h1', inletId:'ny-montauk', createdAtIso:new Date().toISOString(),
    analysisText:'Strong edge at 68–70°F near the rip; wind SW 12 kt; 3 ft @ 8 s.',
    conditions:{ sstF:68.7, windKt:12, windDir:'SW', swellFt:3.0, periodS:8 }, score:86 },
  { id:'h2', inletId:'ny-montauk', createdAtIso:new Date().toISOString(),
    analysisText:'Bait stacked on the drop-off; pressure falling, evening bite window likely.',
    conditions:{ sstF:69.1, windKt:10, windDir:'SW', swellFt:2.7, periodS:9 }, score:81 },
];

export const MOCK_SNIPS = [
  { id:'s1', createdAtIso:new Date().toISOString(),
    inletId:'ny-montauk', rectangleBbox:[-71.95,41.05,-71.90,41.08],
    analysisText:'Rectangle analysis: clean temp break and mild chl gradient; best on outgoing.',
    conditions:{ sstF:68.9, windKt:11, windDir:'SW', swellFt:3.1, periodS:8 }, species:[] },
  { id:'s2', createdAtIso:new Date().toISOString(),
    inletId:'ny-montauk', rectangleBbox:[-71.90,41.02,-71.85,41.06],
    analysisText:'Secondary edge; less traffic; try metals on the seam.',
    conditions:{ sstF:68.2, windKt:9, windDir:'S', swellFt:2.8, periodS:9 }, species:[] },
  { id:'s3', createdAtIso:new Date().toISOString(),
    inletId:'ny-montauk', rectangleBbox:[-71.93,41.00,-71.89,41.03],
    analysisText:'Slack tide window likely dead; wait for first push.',
    conditions:{ sstF:68.0, windKt:8, windDir:'SSW', swellFt:2.5, periodS:8 }, species:[] },
];

export const MOCK_ABFI = [
  { id:'a1', createdAtIso:new Date().toISOString(),
    inletId:'ny-montauk', point:[-71.936,41.071],
    analysisText:'ABFI: bite on depth change; birds briefly pinned; 68.7°F.',
    conditions:{ sstF:68.7, windKt:12, windDir:'SW', swellFt:3.0, periodS:8 }, offlineCaptured:false, species:['yellowfin-tuna'] },
  { id:'a2', createdAtIso:new Date().toISOString(),
    inletId:'ny-montauk', point:[-71.932,41.074],
    analysisText:'ABFI: bait showed on sounder; short strike; pressure falling.',
    conditions:{ sstF:68.5, windKt:11, windDir:'SW', swellFt:3.0, periodS:8 }, offlineCaptured:true, species:['mahi'] },
  { id:'a3', createdAtIso:new Date().toISOString(),
    inletId:'ny-montauk', point:[-71.928,41.069],
    analysisText:'ABFI: tight rip on outgoing; try rubber shads low.',
    conditions:{ sstF:68.6, windKt:12, windDir:'SW', swellFt:3.2, periodS:8 }, offlineCaptured:false, species:['bluefin-tuna', 'wahoo'] },
];
