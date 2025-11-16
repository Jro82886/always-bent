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

// Layer configurations - CORRECT layer names from Copernicus catalog
export const WMTS_LAYERS = {
  SST: {
    id: 'sst',
    variable: 'analysed_sst', // analysed sea surface temperature
    product: 'SST_GLO_PHY_L4_NRT_010_043',
    // Full layer path from GetCapabilities - VERIFIED WORKING
    layerPath: 'SST_GLO_PHY_L4_NRT_010_043/cmems_obs-sst_glo_phy_nrt_l4_P1D-m_202303/analysed_sst',
    supportsTime: true,
    supportsElevation: false, // L4 SST is surface only
    unit: 'K', // Temporarily showing raw Kelvin values (no conversion)
    conversionFn: (value: number) => {
      // TEMPORARY: Disabled Fahrenheit conversion - returning raw Kelvin values
      // Copernicus SST data comes in Kelvin from CMEMS (Copernicus Marine Service)
      // Product: SST_GLO_PHY_L4_NRT_010_043
      //
      // Typical range: 271-313K (-2°C to 40°C or 28°F to 104°F)
      //
      // TODO: Re-enable Fahrenheit conversion after reviewing Copernicus documentation

      console.log(`[SST_CONV] Raw Kelvin value (no conversion): ${value}K`);
      return value; // Return raw Kelvin value
    }
  } as WMTSLayer,
  
  CHL: {
    id: 'chl',
    variable: 'CHL', // chlorophyll-a concentration
    product: 'OCEANCOLOUR_GLO_BGC_L4_NRT_009_102',
    // Full layer path from GetCapabilities - VERIFIED WORKING
    layerPath: 'OCEANCOLOUR_GLO_BGC_L4_NRT_009_102/cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D_202311/CHL',
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
  
  // Build URL without auth in URL (auth goes in header only)
  return `${WMTS_BASE_URL}?${params}`;
}
