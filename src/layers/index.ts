export type RasterLayerDef = {
  id: string;
  name: string;
  url: string;      // may include {DATE}
  opacity?: number; // 0..1
  minzoom?: number;
  maxzoom?: number;
  visible?: boolean;
};

export const RASTER_LAYERS: RasterLayerDef[] = [
  // Copernicus WMTS entries removed (deprecated)
];


