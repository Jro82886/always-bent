import mapboxgl from 'mapbox-gl';

type SourceDef =
  | ({ type: 'geojson' } & mapboxgl.GeoJSONSourceSpecification)
  | ({ type: 'raster' } & mapboxgl.RasterSourceSpecification);

type LayerDef = mapboxgl.AnyLayer;

export type PersistentBundle = {
  sourceId: string;
  source: SourceDef;
  layers: LayerDef[]; // in draw order
};

export class PersistentLayerManager {
  private map: mapboxgl.Map;
  private bundles: PersistentBundle[] = [];
  private attached = false;

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  register(bundle: PersistentBundle) {
    this.bundles.push(bundle);
  }

  attach() {
    if (this.attached) return;
    this.attached = true;

    const ensureAll = () => this.ensureAll();
    this.map.on('style.load', ensureAll);
    this.map.on('styledata', ensureAll);
    if (this.map.isStyleLoaded()) ensureAll();
  }

  ensureAll() {
    this.bundles.forEach((b) => this.ensureBundle(b));
  }

  private ensureBundle(b: PersistentBundle) {
    if (!this.map.getSource(b.sourceId)) {
      this.safeAddSource(b.sourceId, b.source);
    }
    b.layers.forEach((layer) => {
      if (!this.map.getLayer(layer.id)) {
        const idx = b.layers.findIndex((l) => l.id === layer.id);
        const beforeId = idx > 0 ? b.layers[idx - 1].id : this.findFirstSymbolLayerId();
        this.safeAddLayer(layer, beforeId);
      }
    });
  }

  private safeAddSource(id: string, spec: SourceDef) {
    try {
      this.map.addSource(id, spec as any);
    } catch {}
  }

  private safeAddLayer(layer: LayerDef, beforeId?: string) {
    try {
      if (beforeId && this.map.getLayer(beforeId)) this.map.addLayer(layer, beforeId);
      else this.map.addLayer(layer);
    } catch {}
  }

  private findFirstSymbolLayerId(): string | undefined {
    const layers = this.map.getStyle()?.layers || [];
    const sym = layers.find((l: any) => l.type === 'symbol');
    return sym?.id;
  }
}


