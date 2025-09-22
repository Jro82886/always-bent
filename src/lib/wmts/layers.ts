/**
 * WMTS Layer Configuration
 * Based on Copernicus Marine GetCapabilities
 */

export interface WMTSLayer {
  id: string;
  variable: string;
  product: string;
  layerPath: string;
  supportsTime: boolean;
  supportsElevation: boolean;
  defaultElevation?: number;
  unit: string;
  conversionFn: (value: number) => number;
}

// Layer configurations discovered from GetCapabilities
export const WMTS_LAYERS = {
  SST: {
    id: 'sst',
    variable: 'thetao', // potential temperature
    product: 'GLOBAL_ANALYSISFORECAST_PHY_001_024',
    // Full layer path from GetCapabilities
    layerPath: 'GLOBAL_ANALYSISFORECAST_PHY_001_024/cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m/thetao',
    supportsTime: true,
    supportsElevation: true,
    defaultElevation: 0, // Surface
    unit: '°F',
    conversionFn: (kelvin: number) => {
      // Copernicus typically returns temperature in Kelvin
      // Convert to Fahrenheit: K → C → F
      const celsius = kelvin - 273.15;
      return celsius * 9/5 + 32;
    }
  } as WMTSLayer,
  
  CHL: {
    id: 'chl',
    variable: 'chl',
    product: 'OCEANCOLOUR_ATL_BGC_L4_MY_009_118',
    // Full layer path from GetCapabilities
    layerPath: 'OCEANCOLOUR_ATL_BGC_L4_MY_009_118/cmems_obs-oc_atl_bgc-plankton_my_l4-multi-1km_P1D/chl',
    supportsTime: true,
    supportsElevation: false,
    unit: 'mg/m³',
    conversionFn: (value: number) => value // Already in mg/m³
  } as WMTSLayer
};

// Base URL for WMTS requests
export const WMTS_BASE_URL = 'https://wmts.marine.copernicus.eu/teroWmts';

// Build GetFeatureInfo URL
export function buildGetFeatureInfoUrl(
  layer: WMTSLayer,
  tileCol: number,
  tileRow: number,
  i: number,
  j: number,
  zoom: number,
  time: string,
  auth: { user: string; pass: string }
): string {
  const params = new URLSearchParams({
    service: 'WMTS',
    request: 'GetFeatureInfo',
    version: '1.0.0',
    layer: layer.layerPath,
    tilematrixset: 'EPSG:3857',
    tilematrix: zoom.toString(),
    tilerow: tileRow.toString(),
    tilecol: tileCol.toString(),
    i: i.toString(),
    j: j.toString(),
    infoformat: 'application/json',
    time: time
  });
  
  // Add elevation for SST
  if (layer.supportsElevation && layer.defaultElevation !== undefined) {
    params.append('elevation', layer.defaultElevation.toString());
  }
  
  // Build URL with auth
  const url = new URL(`${WMTS_BASE_URL}?${params}`);
  url.username = auth.user;
  url.password = auth.pass;
  
  return url.toString();
}
