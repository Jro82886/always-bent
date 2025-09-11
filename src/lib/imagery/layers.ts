import type { TimeMode } from './time';

export const Layers = {
  SST: {
    srcId: 'sst-src',
    lyrId: 'sst-lyr',
    template: process.env.NEXT_PUBLIC_SST_WMTS_TEMPLATE || process.env.NEXT_PUBLIC_SST_TILES_URL || '/api/tiles/sst/{z}/{x}/{y}.png',
    tileSize: Number(process.env.NEXT_PUBLIC_SST_TILESIZE || process.env.NEXT_PUBLIC_RASTER_TILE_SIZE || 512),
    timeMode: 'default' as TimeMode, // Jeff's PT1H
  },
  CHL: {
    srcId: 'chl-src',
    lyrId: 'chl-lyr',
    template: process.env.NEXT_PUBLIC_CHL_WMTS_TEMPLATE || process.env.NEXT_PUBLIC_CHL_TILES_URL || '/api/tiles/chl/{z}/{x}/{y}.png',
    tileSize: Number(process.env.NEXT_PUBLIC_CHL_TILESIZE || process.env.NEXT_PUBLIC_RASTER_TILE_SIZE || 512),
    timeMode: 'isoDate' as TimeMode, // adjust when Jeff gives CHL
  },
};
