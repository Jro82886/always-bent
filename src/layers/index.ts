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
  {
    id: "abfi-thetao",
    name: "ABFI (thetao)",
    url:
      "https://wmts.marine.copernicus.eu/teroWmts/?" +
      "service=WMTS&request=GetTile&version=1.0.0" +
      "&layer=GLOBAL_ANALYSISFORECAST_PHY_001_024/cmems_mod_glo_phy-thetao_anfc_0.083deg_PT6H-i_202406/thetao" +
      "&tilematrixset=EPSG:3857&tilematrix={z}&tilecol={x}&tilerow={y}" +
      "&format=image/png&time={DATE}T00:00:00.000Z",
    opacity: 0.9,
    visible: false,
  },
];


