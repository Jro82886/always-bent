#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to process
const filesToClean = [
  'src/components/LayersRuntime.tsx',
  'src/app/legendary/welcome/page.tsx',
  'src/lib/supabase/session.ts',
  'src/components/SnipTool.tsx',
  'src/lib/analysis/pixel-extractor.ts',
  'src/components/community/ReportsFeed.tsx',
  'src/lib/reports/analysis-to-report.ts',
  'src/lib/notifications/NotificationManager.ts',
  'src/components/SnipController.tsx',
  'src/lib/chat/ChatClient.ts',
  'src/app/api/ocean-features/live/route.ts',
  'src/components/tracking/VesselLayer.tsx',
  'src/components/tracking/CommercialVesselLayer.tsx',
  'src/app/legendary/tracking/page.tsx',
  'src/lib/MapRef.tsx',
  'src/components/tracking/DepartureMonitor.tsx',
  'src/app/legendary/analysis/page.tsx',
  'src/components/ReportCatchButton.tsx',
  'src/components/AnalysisModal.tsx',
  'src/components/trends/TrendsMode.tsx',
  'src/app/api/tiles/sst/[z]/[x]/[y]/route.ts',
  'src/lib/weather/noaa.ts',
  'src/lib/tracking/positionStore.ts',
  'src/lib/offline/biteSync.ts',
  'src/lib/analysis/rateLimiter.ts',
  'src/components/tracking/VesselTrackingSystem.tsx',
  'src/components/tracking/IndividualTrackingWidget.tsx',
  'src/components/layers/SSTLayer.tsx',
  'src/components/community/DMInterface.tsx',
  'src/components/TutorialOverlay.tsx',
  'src/components/SnipAnalyzeControl.tsx',
  'src/components/RightZone.tsx',
  'src/components/PolygonsPanel.tsx',
  'src/components/HotspotMarker.tsx',
  'src/components/HeaderBar.tsx',
  'src/components/GetOrganized.tsx',
  'src/components/CatchReportForm.tsx',
  'src/components/BiteSyncInitializer.tsx',
  'src/app/legendary-backup/page.tsx',
  'src/app/api/tiles/chl/[z]/[x]/[y]/route.ts',
  'src/app/api/tiles/chl-nasa/[z]/[x]/[y]/route.ts',
  'src/app/api/sst-features/route.ts',
  'src/app/api/copernicus/[z]/[x]/[y]/route.ts',
  'src/app/api/copernicus-thermocline/[z]/[x]/[y]/route.ts',
  'src/app/api/copernicus-sla/[z]/[x]/[y]/route.ts',
  'src/app/api/bites/batch/route.ts'
];

let totalRemoved = 0;
let filesProcessed = 0;

filesToClean.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${file} (not found)`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Remove console.log statements (handles multi-line)
  const cleaned = content
    .replace(/console\.log\([^)]*\);?/g, '')
    .replace(/console\.log\([^)]*\n[^)]*\);?/g, '')
    .replace(/console\.log\([^)]*\n[^)]*\n[^)]*\);?/g, '')
    .replace(/console\.warn\([^)]*\);?/g, '')
    .replace(/console\.error\([^)]*\);?/g, '');
  
  if (content !== cleaned) {
    fs.writeFileSync(filePath, cleaned);
    const removedCount = (content.match(/console\.(log|warn|error)/g) || []).length;
    totalRemoved += removedCount;
    filesProcessed++;
    console.log(`✅ Cleaned ${file} (removed ${removedCount} console statements)`);
  }
});

console.log(`\n🎯 BATCH 2 COMPLETE!`);
console.log(`   Removed ${totalRemoved} console statements from ${filesProcessed} files`);
console.log(`   Production ready - no console spam!`);
