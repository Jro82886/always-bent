# ABFI Tracking Recon
Generated: Sun Sep 21 03:21:38 EDT 2025

## A. Routes present
```
analysis
community
tracking
welcome
src/app/legendary/analysis:
src/app/legendary/community:
src/app/legendary/community/chat:
src/app/legendary/community/reports:
reset-welcome
src/app/legendary/debug/reset-welcome:
src/app/legendary/tracking:
src/app/legendary/welcome:
```

## B. Tracking-related files (first 200 matches)
```
src/middleware.ts:7:  '/legendary/tracking', 
src/types/community.ts:43:  type: 'snip' | 'abfi' | 'analysis';
src/types/ml-fishing.ts:76:  snip_analysis_id?: string;
src/app/maptest/page.tsx:4:import mapboxgl from 'mapbox-gl';
src/app/maptest/page.tsx:5:import 'mapbox-gl/dist/mapbox-gl.css';
src/app/maptest/page.tsx:9:  const map = useRef<mapboxgl.Map | null>(null);
src/app/maptest/page.tsx:24:      mapboxgl.accessToken = token;
src/app/maptest/page.tsx:28:      map.current = new mapboxgl.Map({
src/app/maptest/page.tsx:30:        style: 'mapbox://styles/mapbox/dark-v11',
src/app/direct/page.tsx:28:            <p className="text-gray-300">Main map with SST/Chlorophyll layers, polygons, vessel tracking</p>
src/app/direct/page.tsx:33:            href="/legendary/tracking"
src/app/direct/page.tsx:37:            <p className="text-gray-300">Real-time vessel positions and fleet tracking</p>
src/app/status/page.tsx:16:      mapbox: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? '✅ Set' : '❌ Missing',
src/app/status/page.tsx:18:      polygons: process.env.NEXT_PUBLIC_POLYGONS_URL || 'Not configured',
src/app/status/page.tsx:27:      description: 'Map with SST/CHL layers, vessel tracking, polygon detection',
src/app/status/page.tsx:33:      path: '/legendary/tracking',
src/app/status/page.tsx:63:            <p className="text-gray-300">Mapbox Token: <span className="font-mono">{status.mapbox}</span></p>
src/app/status/page.tsx:65:            <p className="text-gray-300">Polygon Backend: <span className="font-mono text-yellow-400">{status.polygons}</span></p>
src/app/v2/imagery/page.tsx:9:  const { snipOn, setSnipOn } = useUI();
src/app/v2/imagery/page.tsx:10:  const label = useMemo(()=> snipOn ? 'Exit Snip' : 'Snip/Analyze', [snipOn]);
src/app/v2/imagery/page.tsx:17:          onClick={()=>setSnipOn(!snipOn)}
src/app/v2/analysis/page.tsx:6:const PolysLayer = dynamic(() => import('@/components/polygons/PolysLayer'), { ssr: false });
src/app/v2/analysis/page.tsx:9:  const { iso, sstOn, setSstOn, day, setDay, polygonsOn, setPolygonsOn } = useUI() as any;
src/app/v2/analysis/page.tsx:17:          <input type="checkbox" checked={!!polygonsOn} onChange={(e)=> setPolygonsOn(!!e.target.checked)} />
src/app/v2/analysis/page.tsx:31:      {polygonsOn && iso ? <PolysLayer iso={iso} /> : null}
src/app/v2/analysis/page.tsx:32:      {polygonsOn ? (
src/app/v2/layout.tsx:25:      <div className="font-semibold tracking-wide">Always Bent (v2 sandbox)</div>
src/app/layout.tsx:3:import 'mapbox-gl/dist/mapbox-gl.css';
src/app/layout.tsx:17:  description: 'Real-time fishing intelligence and bite tracking',
src/app/api/ocean-features/live/route.ts:58:    const demoResponse = await fetch(`${request.nextUrl.origin}/abfi_sst_edges_latest.geojson`);
src/app/api/polygons/route.ts:94:      path.join(process.cwd(), 'public', 'abfi_sst_edges_latest.geojson'),
src/app/api/polygons/route.ts:95:      path.join(process.cwd(), 'public', 'abfi_sst_edges_sample.geojson'),
src/app/api/polygons/route.ts:106:      return new Response(JSON.stringify({ error: 'No polygons dataset found' }), {
src/app/api/polygons/route.ts:132:    return new Response(JSON.stringify({ error: 'polygons_failed', message: String(err?.message || err) }), {
src/app/api/polygons/live/route.ts:42:// Convert edge matrix to GeoJSON polygons
src/app/api/polygons/live/route.ts:185:          // Convert edges to polygons
src/app/api/polygons/live/route.ts:248:    console.error('Error generating live polygons:', error);
src/app/api/polygons/live/route.ts:250:      { error: 'Failed to generate polygons', details: error instanceof Error ? error.message : 'Unknown error' },
src/app/api/polygons/generate/route.ts:5: * POST /api/polygons/generate
src/app/api/polygons/generate/route.ts:6: * Generate daily SST edge and eddy polygons
src/app/api/polygons/generate/route.ts:15:    // Generate polygons from current SST data
src/app/api/polygons/generate/route.ts:16:    const polygons = await generateDailyPolygons(
src/app/api/polygons/generate/route.ts:22:    // await savePolygonsToSupabase(polygons);
src/app/api/polygons/generate/route.ts:24:    // For now, save to a JSON file that the polygon layer can read
src/app/api/polygons/generate/route.ts:29:    const filename = `sst_polygons_${new Date().toISOString().split('T')[0]}.json`;
src/app/api/polygons/generate/route.ts:35:    // Write polygons
src/app/api/polygons/generate/route.ts:36:    await fs.writeFile(filepath, JSON.stringify(polygons, null, 2));
src/app/api/polygons/generate/route.ts:39:    const latestPath = path.join(dataDir, 'sst_polygons_latest.json');
src/app/api/polygons/generate/route.ts:40:    await fs.writeFile(latestPath, JSON.stringify(polygons, null, 2));
src/app/api/polygons/generate/route.ts:45:      count: polygons.features.length,
src/app/api/polygons/generate/route.ts:48:        eddies: polygons.features.filter((f: any) => f.properties?.type === 'eddy').length,
src/app/api/polygons/generate/route.ts:49:        edges: polygons.features.filter((f: any) => f.properties?.type === 'edge').length,
src/app/api/polygons/generate/route.ts:50:        filaments: polygons.features.filter((f: any) => f.properties?.type === 'filament').length
src/app/api/polygons/generate/route.ts:54:    console.error('Error generating polygons:', error);
src/app/api/polygons/generate/route.ts:56:      { error: 'Failed to generate polygons' },
src/app/api/polygons/generate/route.ts:63: * GET /api/polygons/generate
src/app/api/polygons/generate/route.ts:64: * Get the latest generated polygons
src/app/api/polygons/generate/route.ts:71:    // Try to read the latest polygons
src/app/api/polygons/generate/route.ts:72:    const latestPath = path.join(process.cwd(), 'public', 'data', 'sst_polygons_latest.json');
src/app/api/polygons/generate/route.ts:76:      const polygons = JSON.parse(data);
src/app/api/polygons/generate/route.ts:78:      return NextResponse.json(polygons);
src/app/api/polygons/generate/route.ts:80:      // If no file exists, generate new polygons
src/app/api/polygons/generate/route.ts:82:      const polygons = await generateDailyPolygons(
src/app/api/polygons/generate/route.ts:89:      await fs.writeFile(latestPath, JSON.stringify(polygons, null, 2));
src/app/api/polygons/generate/route.ts:91:      return NextResponse.json(polygons);
src/app/api/polygons/generate/route.ts:94:    console.error('Error reading polygons:', error);
src/app/api/polygons/generate/route.ts:96:      { error: 'Failed to read polygons' },
src/app/api/sst-features/route.ts:23:    // Generate polygons for the requested area
src/app/api/sst-features/route.ts:24:    const polygons = await generateDailyPolygons(
src/app/api/sst-features/route.ts:31:      eddies: polygons.features.filter((f: any) => f.properties?.type === 'eddy').length,
src/app/api/sst-features/route.ts:32:      edges: polygons.features.filter((f: any) => f.properties?.type === 'edge').length,
src/app/api/sst-features/route.ts:33:      filaments: polygons.features.filter((f: any) => f.properties?.type === 'filament').length,
src/app/api/sst-features/route.ts:37:    return NextResponse.json(polygons);
src/app/api/test-supabase/route.ts:13:      'snip_analyses',
src/app/api/bites/batch/route.ts:252:    recs.push('Multiple boats working this area - fish are likely present');
src/app/api/tracking/activity/route.ts:16:// GET /api/tracking/activity - Get boat activity in a polygon area
src/app/api/tracking/activity/route.ts:20:    const polygonParam = searchParams.get('polygon');
src/app/api/tracking/activity/route.ts:23:    if (!polygonParam) {
src/app/api/tracking/activity/route.ts:30:    const polygon = JSON.parse(polygonParam);
src/app/api/tracking/activity/route.ts:33:    // Query positions within polygon and time window
src/app/api/tracking/activity/route.ts:36:    // Build polygon SQL - expecting array of [lng, lat] coordinates
src/app/api/tracking/activity/route.ts:37:    const polygonPoints = polygon.map((p: number[]) => `${p[0]} ${p[1]}`).join(',');
src/app/api/tracking/activity/route.ts:38:    const polygonWKT = `POLYGON((${polygonPoints}))`;
src/app/api/tracking/activity/route.ts:40:    // Get all positions in the polygon
src/app/api/tracking/activity/route.ts:68:    // Filter positions that are within the polygon (client-side for now)
src/app/api/tracking/activity/route.ts:71:      isPointInPolygon([pos.lng, pos.lat], polygon)
src/app/api/tracking/activity/route.ts:104:      isPointInPolygon([event.lng, event.lat], polygon)
src/app/api/tracking/activity/route.ts:166:// Helper function to check if point is in polygon
src/app/api/tracking/activity/route.ts:167:function isPointInPolygon(point: number[], polygon: number[][]): boolean {
src/app/api/tracking/activity/route.ts:171:  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
src/app/api/tracking/activity/route.ts:172:    const [xi, yi] = polygon[i];
src/app/api/tracking/activity/route.ts:173:    const [xj, yj] = polygon[j];
src/app/api/tracking/position/route.ts:40:// POST /api/tracking/position - Record a vessel position
src/app/api/tracking/position/route.ts:111:        message: 'Position tracking disabled (no database configured)' 
src/app/api/tracking/position/route.ts:147:// GET /api/tracking/position - Get vessel positions
src/app/api/tracking/position/route.ts:165:        message: 'Position tracking disabled (no database configured)' 
src/app/api/tracking/tracks/route.ts:37:// GET /api/tracking/tracks - Get vessel tracks
src/app/api/tracking/tracks/route.ts:56:        message: 'Position tracking disabled (no database configured)' 
src/app/api/tracking/fleet/route.ts:16:// GET /api/tracking/fleet - Get all active fleet positions with trails
src/app/api/community/fleet/route.ts:94:    console.error('Fleet tracking error:', error);
src/app/api/gfw/vessels/route.ts:3:// GFW API configuration
src/app/api/gfw/vessels/route.ts:4:const GFW_API_URL = 'https://gateway.api.globalfishingwatch.org/v3/vessels';
src/app/api/gfw/vessels/route.ts:5:const GFW_TOKEN = process.env.GFW_API_TOKEN;
src/app/api/gfw/vessels/route.ts:7:// Cache for GFW data (5 minutes per inlet)
src/app/api/gfw/vessels/route.ts:33:    if (!GFW_TOKEN) {
src/app/api/gfw/vessels/route.ts:34:      console.log('GFW API token not configured, returning mock data');
src/app/api/gfw/vessels/route.ts:82:    // Build GFW API request
src/app/api/gfw/vessels/route.ts:93:    const response = await fetch(`${GFW_API_URL}?${params}`, {
src/app/api/gfw/vessels/route.ts:95:        'Authorization': `Bearer ${GFW_TOKEN}`,
src/app/api/gfw/vessels/route.ts:101:      console.error('GFW API error:', response.status, response.statusText);
src/app/api/gfw/vessels/route.ts:102:      throw new Error(`GFW API error: ${response.status}`);
src/app/api/gfw/vessels/route.ts:107:    // Transform GFW data to our format
src/app/api/gfw/vessels/route.ts:146:    console.error('GFW vessels API error:', error);
src/app/api/reports/route.ts:10:  const type = searchParams.get("type");   // optional 'snip' | 'bite'
src/app/api/debug/sniptool/route.ts:9:      mapboxToken: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
src/app/legendary/analysis/AnalysisContent.tsx:5:import mapboxgl from 'mapbox-gl';
src/app/legendary/analysis/AnalysisContent.tsx:6:import 'mapbox-gl/dist/mapbox-gl.css';
src/app/legendary/analysis/AnalysisContent.tsx:19:import CommercialVesselLayer from '@/components/tracking/CommercialVesselLayer';
src/app/legendary/analysis/AnalysisContent.tsx:37:  const map = useRef<mapboxgl.Map | null>(null);
src/app/legendary/analysis/AnalysisContent.tsx:100:    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;
src/app/legendary/analysis/AnalysisContent.tsx:103:    const existingCanvas = mapContainer.current.querySelector('.mapboxgl-canvas');
src/app/legendary/analysis/AnalysisContent.tsx:108:    map.current = new mapboxgl.Map({
src/app/legendary/analysis/AnalysisContent.tsx:110:      style: 'mapbox://styles/mapbox/dark-v11',  // Dark base with grey anchoring
src/app/legendary/analysis/AnalysisContent.tsx:119:    mapInstance.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
src/app/legendary/analysis/AnalysisContent.tsx:342:      {/* Map Container with enhanced rendering - Hidden during tracking for clean separation */}
src/app/legendary/analysis/page.tsx:3:// DO NOT touch window/mapbox here
src/app/legendary/welcome/EnhancedWelcome.tsx:65:      params.set('mode', hasMode === 'community' ? 'tracking' : 'analysis');
src/app/legendary/welcome/EnhancedWelcome.tsx:154:      params.set('mode', selectedMode === 'community' ? 'tracking' : 'analysis');
src/app/legendary/welcome/EnhancedWelcome.tsx:421:              <span className="text-xs font-medium uppercase tracking-wide">Always Bent Fishing Intelligence</span>
src/app/legendary/components/HeroInterface.tsx:10:  polygonsActive: boolean;
src/app/legendary/components/HeroInterface.tsx:20:  polygonsActive,
src/app/legendary/components/HeroInterface.tsx:54:              <h1 className="text-2xl font-black text-white tracking-tight">
src/app/legendary/components/HeroInterface.tsx:147:              onClick={() => onPolygons(!polygonsActive)}
src/app/legendary/components/HeroInterface.tsx:149:                polygonsActive 
src/app/legendary/components/HeroInterface.tsx:154:              {polygonsActive ? (
src/app/legendary/tracking/TrackingContent.tsx:5:import mapboxgl from 'mapbox-gl';
src/app/legendary/tracking/TrackingContent.tsx:6:import 'mapbox-gl/dist/mapbox-gl.css';
src/app/legendary/tracking/TrackingContent.tsx:9:import VesselLayerClean from '@/components/tracking/VesselLayerClean';
src/app/legendary/tracking/TrackingContent.tsx:10:import CommercialVesselLayer from '@/components/tracking/CommercialVesselLayer';
src/app/legendary/tracking/TrackingContent.tsx:11:import RecBoatsClustering from '@/components/tracking/RecBoatsClustering';
src/app/legendary/tracking/TrackingContent.tsx:12:import TrackingToolbar from '@/components/tracking/TrackingToolbar';
src/app/legendary/tracking/TrackingContent.tsx:13:import TrackingLegend from '@/components/tracking/TrackingLegend';
src/app/legendary/tracking/TrackingContent.tsx:20:import { useLocationRequired } from '@/components/tracking/useLocationRequired';
src/app/legendary/tracking/TrackingContent.tsx:31:let globalMapInstance: mapboxgl.Map | null = null;
src/app/legendary/tracking/TrackingContent.tsx:35:  const map = useRef<mapboxgl.Map | null>(null);
src/app/legendary/tracking/TrackingContent.tsx:116:    mapboxgl.accessToken = token;
src/app/legendary/tracking/TrackingContent.tsx:119:    const newMap = new mapboxgl.Map({
src/app/legendary/tracking/TrackingContent.tsx:121:      style: 'mapbox://styles/mapbox/dark-v11',
src/app/legendary/tracking/TrackingContent.tsx:132:      map.current!.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
src/app/legendary/tracking/TrackingContent.tsx:198:      if (!pathname.includes('/tracking')) {
src/app/legendary/tracking/TrackingContent.tsx:199:        console.log('Leaving tracking page - cleaning up global map');
src/app/legendary/tracking/TrackingContent.tsx:212:        activeMode="tracking"
src/app/legendary/tracking/page.tsx:4:import 'mapbox-gl/dist/mapbox-gl.css';
src/app/legendary/community/chat/page.tsx:51:              <h2 className="flex items-center justify-center gap-2 text-[15px] md:text-lg font-semibold tracking-wide">
src/app/legendary/community/reports/page.tsx:53:              <span className="text-xs opacity-70 text-slate-400">Your saved snips and on-water bite logs</span>
src/app/legendary/community/reports/page.tsx:64:              <h2 className="flex items-center justify-center gap-2 text-[15px] md:text-lg font-semibold tracking-wide">
src/app/page.tsx:42:            Real-time SST, chlorophyll mapping, and vessel tracking. 
src/app/page.tsx:86:            description="Community-driven catch reports and real-time bite tracking"
src/app/check/page.tsx:8:    mapboxToken: null,
src/app/check/page.tsx:9:    mapboxValid: false,
src/app/check/page.tsx:22:            mapboxToken: null,
src/app/check/page.tsx:23:            mapboxValid: false,
src/app/check/page.tsx:33:        const testUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${token}`;
src/app/check/page.tsx:38:          mapboxToken: hiddenToken,
src/app/check/page.tsx:39:          mapboxValid: response.ok,
src/app/check/page.tsx:47:          mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'Set but error' : null,
src/app/check/page.tsx:48:          mapboxValid: false,
src/app/check/page.tsx:71:                <span className={status.mapboxToken ? 'text-green-500' : 'text-red-500'}>
src/app/check/page.tsx:72:                  {status.mapboxToken ? '✅ YES' : '❌ NO'}
src/app/check/page.tsx:76:              {status.mapboxToken && (
src/app/check/page.tsx:81:                      {status.mapboxToken}
src/app/check/page.tsx:87:                    <span className={status.mapboxValid ? 'text-green-500' : 'text-red-500'}>
src/app/check/page.tsx:88:                      {status.mapboxValid ? '✅ YES' : '❌ NO'}
src/app/check/page.tsx:112:          {status.mapboxToken && status.mapboxValid && (
src/app/globals.css:424:.map-canvas, .mapboxgl-canvas, .mapboxgl-canvas-container {
src/app/legendary-backup/components/HeroInterface.tsx:10:  polygonsActive: boolean;
src/app/legendary-backup/components/HeroInterface.tsx:20:  polygonsActive,
src/app/legendary-backup/components/HeroInterface.tsx:54:              <h1 className="text-2xl font-black text-white tracking-tight">
src/app/legendary-backup/components/HeroInterface.tsx:147:              onClick={() => onPolygons(!polygonsActive)}
src/app/legendary-backup/components/HeroInterface.tsx:149:                polygonsActive 
src/app/legendary-backup/components/HeroInterface.tsx:154:              {polygonsActive ? (
src/app/legendary-backup/page.tsx:4:import mapboxgl from 'mapbox-gl';
src/app/legendary-backup/page.tsx:5:import 'mapbox-gl/dist/mapbox-gl.css';
src/app/legendary-backup/page.tsx:8:mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;
src/app/legendary-backup/page.tsx:12:  const map = useRef<mapboxgl.Map | null>(null);
src/app/legendary-backup/page.tsx:15:  const [polygonsActive, setPolygonsActive] = useState(false);
src/app/legendary-backup/page.tsx:39:    map.current = new mapboxgl.Map({
src/app/legendary-backup/page.tsx:41:      style: 'mapbox://styles/mapbox/satellite-streets-v12',
src/app/legendary-backup/page.tsx:77:      mapInstance.addSource('polygons', {
src/app/legendary-backup/page.tsx:78:        type: 'geojson',
src/app/legendary-backup/page.tsx:84:        id: 'polygons-glow-outer',
src/app/legendary-backup/page.tsx:86:        source: 'polygons',
src/app/legendary-backup/page.tsx:102:        id: 'polygons-glow-inner',
src/app/legendary-backup/page.tsx:104:        source: 'polygons',
src/app/legendary-backup/page.tsx:120:        id: 'polygons-main',
src/app/legendary-backup/page.tsx:122:        source: 'polygons',
src/app/legendary-backup/page.tsx:137:        id: 'polygons-fill',
src/app/legendary-backup/page.tsx:139:        source: 'polygons',
src/app/legendary-backup/page.tsx:191:  // Epic polygon activation with cascade
src/app/legendary-backup/page.tsx:194:    const newState = !polygonsActive;
```

## C. Commits touching Tracking/Polygons last 14d
```
No commits found in these paths
```

## D. Diff stats (last 7 days)
```
No changes in last 7 days
```

## E. Mode locks / redirects
```
src/app/legendary/welcome/EnhancedWelcome.tsx:69:      router.replace(`/legendary?${params.toString()}`);
src/app/legendary/community/CommunityPage.tsx:11:    router.replace('/legendary/community/chat');
src/app/legendary/community/page.tsx:7:  redirect('/legendary/community/reports');
src/app/legendary/page.tsx:9:  if (!onboarded) redirect('/legendary/welcome');   // single server redirect; no blink
src/components/RequireUsername.tsx:17:    if (!username) router.replace('/legendary?mode=welcome');
src/components/FirstTimeSetup.tsx:88:        router.push('/legendary?mode=analysis');
src/components/FirstTimeSetup.tsx:208:                router.push('/legendary?mode=analysis');
src/components/NavTabs.tsx:25:  const TABS = appMode === 'analysis' 
src/components/NavTabs.tsx:27:        { href: '/legendary?mode=analysis', label: 'Analysis' },
src/components/NavTabs.tsx:31:        { href: '/legendary?mode=analysis', label: 'Analysis' },
src/components/CommandBridge/Tabs.tsx:11:    { id: 'analysis', label: 'Analysis', href: '/legendary?mode=analysis' },
src/components/CommandBridge/HeaderBar.tsx:62:            href="/legendary?mode=analysis"
src/components/CommandBridge/HeaderBar.tsx:103:              href="/legendary?mode=analysis"
src/components/CommandBridge/HeaderBar.tsx:154:              href="/legendary?mode=analysis"
src/components/LegendaryNav.tsx:8:  { id: 'analysis', label: 'Analysis', icon: MapPin, path: '/legendary?mode=analysis' },
src/components/welcome/WelcomeHydrate.tsx:20:        router.replace('/legendary/community/reports');
src/components/welcome/WelcomeHydrate.tsx:25:        router.replace('/legendary/analysis');
src/components/welcome/WelcomeHydrate.tsx:29:        router.replace('/legendary/analysis');
src/components/welcome/WelcomeHydrate.tsx:33:        router.replace('/legendary/analysis');
src/components/tracking/TrackingToolbar.tsx:111:            {appMode === 'analysis' 
src/components/NavTabsClient.tsx:38:    { href: '/legendary?mode=analysis', label: 'Analysis', mode: 'analysis' },
```

## F. Hydration offenders
```
src/app/legendary/welcome/EnhancedWelcome.tsx:1:'use client';
src/app/legendary/welcome/EnhancedWelcome.tsx:35:  // Ensure store is hydrated from localStorage
src/app/legendary/welcome/EnhancedWelcome.tsx:36:  useEffect(() => {
src/app/legendary/welcome/EnhancedWelcome.tsx:40:  useEffect(() => {
src/app/legendary/welcome/EnhancedWelcome.tsx:46:    const urlParams = new URLSearchParams(window.location.search);
src/app/legendary/welcome/EnhancedWelcome.tsx:158:      // Use window.location for a clean navigation
src/app/legendary/welcome/EnhancedWelcome.tsx:159:      window.location.href = `/legendary?${params.toString()}`;
src/app/legendary/welcome/page.tsx:1:'use client';
src/components/SelectedInletPersistence.tsx:1:'use client';
src/components/SelectedInletPersistence.tsx:11:  // Hydrate from localStorage once
src/components/SelectedInletPersistence.tsx:12:  useEffect(() => {
src/components/SelectedInletPersistence.tsx:14:      const saved = localStorage.getItem(STORAGE_KEY);
src/components/SelectedInletPersistence.tsx:23:  useEffect(() => {
src/components/SelectedInletPersistence.tsx:25:      if (selectedInletId) localStorage.setItem(STORAGE_KEY, selectedInletId);
src/components/UnifiedCommandCenter.tsx:1:'use client';
src/components/UnifiedCommandCenter.tsx:32:  useEffect(() => {
src/components/ModernControls.tsx:1:"use client";
src/components/ModernControls.tsx:76:  useEffect(() => {
src/components/ModernControls.tsx:96:  useEffect(() => {
src/components/ModernControls.tsx:98:    const enabled = localStorage.getItem('abfi_location_enabled') === 'true';
src/components/ModernControls.tsx:101:    const storedBoatName = localStorage.getItem('abfi_boat_name');
src/components/ModernControls.tsx:275:                          // Store in localStorage for persistence
src/components/ModernControls.tsx:276:                          localStorage.setItem('abfi_selected_inlet', inlet.id);
src/components/ModernControls.tsx:715:                localStorage.setItem('abfi_location_enabled', 'true');
src/components/ModernControls.tsx:717:                window.location.reload();
src/components/ui/SuccessAnimations.tsx:9:  useEffect(() => {
src/components/ui/SuccessAnimations.tsx:40:  useEffect(() => {
src/components/ui/OceanBackground.tsx:1:'use client';
src/components/ui/OceanBackground.tsx:12:  useEffect(() => {
src/components/ui/OceanBackground.tsx:21:      canvas.width = window.innerWidth;
src/components/ui/OceanBackground.tsx:22:      canvas.height = window.innerHeight;
src/components/ui/OceanBackground.tsx:25:    window.addEventListener('resize', resizeCanvas);
src/components/ui/OceanBackground.tsx:146:      window.removeEventListener('resize', resizeCanvas);
src/components/ui/Tooltip.tsx:1:'use client';
src/components/ui/Tooltip.tsx:18:    timer.current = window.setTimeout(() => setOpen(true), delay); 
src/components/ui/Tooltip.tsx:22:    if (timer.current) window.clearTimeout(timer.current); 
src/components/ui/Tooltip.tsx:27:  useEffect(() => {
src/components/ui/Tooltip.tsx:31:    const start = () => { lp = window.setTimeout(() => setOpen(true), 400); };
src/components/ui/Tooltip.tsx:32:    const end = () => { if (lp) window.clearTimeout(lp); setOpen(false); };
src/components/ui/SoundEffects.tsx:1:'use client';
src/components/ui/SoundEffects.tsx:26:    // Check if sounds are enabled in localStorage
src/components/ui/SoundEffects.tsx:28:      this.enabled = localStorage.getItem('abfi_sounds') !== 'false';
src/components/ui/SoundEffects.tsx:29:      this.volume = parseFloat(localStorage.getItem('abfi_volume') || '0.5');
src/components/ui/SoundEffects.tsx:68:      localStorage.setItem('abfi_sounds', enabled.toString());
src/components/ui/SoundEffects.tsx:75:      localStorage.setItem('abfi_volume', this.volume.toString());
src/components/ui/SoundEffects.tsx:85:    if (!this.enabled || typeof window === 'undefined' || !window.navigator.vibrate) return;
src/components/ui/SoundEffects.tsx:88:      window.navigator.vibrate(pattern);
src/components/ui/SoundEffects.tsx:100:  useEffect(() => {
src/components/ui/SoundEffects.tsx:119:      return localStorage.getItem('abfi_sounds') !== 'false';
src/components/ui/SoundEffects.tsx:126:      return parseFloat(localStorage.getItem('abfi_volume') || '0.5');
```

## G. FastAPI check
```
No FastAPI found
No Python dependency files found
```

## H. Out-of-trunk anomalies
```
=== Non-legendary page.tsx files ===
src/app/demo/page.tsx
src/app/go/page.tsx
src/app/maptest/page.tsx
src/app/imagery/page.tsx
src/app/direct/page.tsx
src/app/test/page.tsx
src/app/auth/register/page.tsx
src/app/auth/login/page.tsx
src/app/test-location/page.tsx
src/app/start/page.tsx
src/app/status/page.tsx
src/app/simple/page.tsx
src/app/v2/imagery/page.tsx
src/app/v2/analysis/page.tsx
src/app/v2/community/page.tsx
src/app/styleguide/page.tsx
src/app/abfi/page.tsx
src/app/view/page.tsx
src/app/showcase/page.tsx
src/app/page.tsx
src/app/check/page.tsx
src/app/legendary-backup/page.tsx
src/app/gfw/page.tsx
src/app/debug/page.tsx

=== LegendaryShell references outside components ===
None found

=== Duplicate shells or unexpected routes ===
src/components/WidgetShell.tsx
src/components/welcome/WelcomeShell.tsx
```

Report completed.
