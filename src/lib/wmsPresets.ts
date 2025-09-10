type Preset = {
  base: string; 
  layer: string; 
  version: string; 
  styles: string; 
  crs: string;
  width?: number; 
  height?: number; 
  format?: string; 
  transparent?: string;
  hostAllow: string[];
};

export const WMS_PRESETS: Record<string, Preset> = {
  sst: {
    base: process.env.ABFI_SST_WMS_BASE!,
    layer: process.env.ABFI_SST_WMS_LAYER!,
    version: process.env.ABFI_SST_WMS_VERSION || '1.3.0',
    styles: process.env.ABFI_SST_WMS_STYLES || '',
    crs: process.env.ABFI_SST_WMS_CRS || 'CRS:84',
    width: 256, 
    height: 256, 
    format: 'image/png', 
    transparent: 'TRUE',
    hostAllow: ['coastwatch.pfeg.noaa.gov']
  },
  chl: {
    base: process.env.ABFI_CHL_WMS_BASE!,
    layer: process.env.ABFI_CHL_WMS_LAYER!,
    version: process.env.ABFI_CHL_WMS_VERSION || '1.3.0',
    styles: process.env.ABFI_CHL_WMS_STYLES || '',
    crs: process.env.ABFI_CHL_WMS_CRS || 'CRS:84',
    width: 256, 
    height: 256, 
    format: 'image/png', 
    transparent: 'TRUE',
    hostAllow: ['coastwatch.noaa.gov']
  }
};
