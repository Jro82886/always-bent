#!/usr/bin/env node

/**
 * Production Verification Script for Always Bent
 * Run this to check all critical components
 */

console.log("🔍 ALWAYS BENT PRODUCTION VERIFICATION SCRIPT\n");

// 1. ENVIRONMENT VARIABLES CHECK
console.log("1️⃣ ENVIRONMENT VARIABLES NEEDED IN VERCEL:\n");
console.log("Based on code analysis, these environment variables are required:");
console.log("[[memory:8914917]]"); // Reference to complete env list

const envVars = {
  "Core Authentication (Supabase)": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY", 
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATABASE_URL"
  ],
  "Map & Visualization": [
    "NEXT_PUBLIC_MAPBOX_TOKEN"
  ],
  "Ocean Data (SST/CHL)": [
    "NEXT_PUBLIC_SST_TILES_URL",
    "NEXT_PUBLIC_CHL_TILES_URL",
    "NEXT_PUBLIC_SST_WMTS_TEMPLATE",
    "NEXT_PUBLIC_CHL_WMTS_TEMPLATE",
    "CMEMS_SST_WMTS_TEMPLATE",
    "CMEMS_CHL_WMTS_TEMPLATE",
    "COPERNICUS_USER",
    "COPERNICUS_PASS",
    "COPERNICUS_WMTS_BASE",
    "COPERNICUS_WMTS_SLA_LAYER",
    "COPERNICUS_WMTS_LAYER",
    "COPERNICUS_WMTS_THERMO_LAYER",
    "COPERNICUS_WMTS_STYLE",
    "COPERNICUS_WMTS_FORMAT",
    "COPERNICUS_WMTS_MATRIXSET"
  ],
  "Vessel Tracking": [
    "GFW_API_TOKEN (for Global Fishing Watch integration)"
  ],
  "Proxy & Backend": [
    "POLYGONS_BACKEND_URL",
    "NEXT_PUBLIC_POLYGONS_URL",
    "POLYGONS_BBOX_BUFFER_DEG"
  ],
  "Feature Flags": [
    "NEXT_PUBLIC_FLAG_CHL",
    "NEXT_PUBLIC_FLAG_ALTIMETRY",
    "NEXT_PUBLIC_FLAG_AIS",
    "NEXT_PUBLIC_FLAG_REPORTS",
    "NEXT_PUBLIC_FLAG_TOMORROW"
  ]
};

for (const [category, vars] of Object.entries(envVars)) {
  console.log(`\n${category}:`);
  vars.forEach(v => console.log(`  ✓ ${v}`));
}

// 2. AUTHENTICATION SETUP
console.log("\n\n2️⃣ AUTHENTICATION - MEMBERSTACK INTEGRATION:\n");
console.log("Current Status: NOT INTEGRATED YET");
console.log("What's needed:");
console.log("  1. Add Memberstack script to app");
console.log("  2. Create auth wrapper component");
console.log("  3. Connect to existing Supabase for data storage");
console.log("  4. Timing: Should be done BEFORE domain setup");
console.log("\nRecommended approach:");
console.log("  - Use Memberstack for auth/payments");
console.log("  - Store user data in Supabase");
console.log("  - Pass auth state via localStorage");

// 3. DATABASE CHECK
console.log("\n\n3️⃣ DATABASE TABLES CHECK:\n");
console.log("Run this SQL in Supabase to verify tables exist:");
console.log(`
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles',
  'vessel_tracks',
  'hotspot_intelligence',
  'catch_reports',
  'snip_analyses'
);
`);

// 4. DOMAIN SETUP
console.log("\n\n4️⃣ DOMAIN SETUP:\n");
console.log("Current production URL: https://always-bent.vercel.app");
console.log("Target domain: app.alwaysbent.com");
console.log("\nSteps needed:");
console.log("  1. Add custom domain in Vercel dashboard");
console.log("  2. Update DNS records (CNAME to cname.vercel-dns.com)");
console.log("  3. Wait for SSL certificate");
console.log("  4. Update Memberstack redirects to use custom domain");

// 5. TESTING CHECKLIST
console.log("\n\n5️⃣ PRODUCTION TESTING CHECKLIST:\n");
console.log("□ Visit https://always-bent.vercel.app");
console.log("□ Check if redirected to auth (currently goes to /legendary)");
console.log("□ Test SST layer toggle");
console.log("□ Test CHL layer toggle");
console.log("□ Use SnipTool near continental shelf edge");
console.log("□ Check if real temperature data is extracted");
console.log("□ Verify vessel tracking shows boats");

// 6. SNIPTOOL HOTSPOT VERIFICATION
console.log("\n\n6️⃣ SNIPTOOL REAL DATA VERIFICATION:\n");
console.log("To test if real data extraction works:");
console.log("  1. Go to /legendary/analysis");
console.log("  2. Enable SST layer");
console.log("  3. Zoom to continental shelf edge (around 38.5°N, -73.5°W)");
console.log("  4. Look for color changes (blue to green = temperature break)");
console.log("  5. Use SnipTool to draw rectangle over color change");
console.log("  6. Check console for 'Real data extracted' messages");
console.log("  7. Hotspot should appear at shallow side of break");

// 7. API ENDPOINTS
console.log("\n\n7️⃣ API ENDPOINTS TO VERIFY:\n");
const endpoints = [
  "/api/health",
  "/api/tiles/sst/{z}/{x}/{y}",
  "/api/tiles/chl/{z}/{x}/{y}",
  "/api/analyze",
  "/api/community/reports",
  "/api/community/hotspots"
];
endpoints.forEach(e => console.log(`  □ ${e}`));

console.log("\n\n✅ IMMEDIATE ACTIONS:");
console.log("  1. Check Vercel env vars (compare with list above)");
console.log("  2. Run database verification SQL");
console.log("  3. Test SnipTool with real ocean data");
console.log("  4. Plan Memberstack integration timing");
console.log("  5. Initiate domain setup in Vercel");

console.log("\n📝 Script complete. Save this output for reference.");
