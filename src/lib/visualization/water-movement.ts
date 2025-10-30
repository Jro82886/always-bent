/**
 * 3-Day Water Movement Visualization
 *
 * This module provides functionality to display oceanographic features
 * over the last 3 days with varying opacity to show water mass movement.
 * - Current day: 100% opacity
 * - 1-day old: 40% opacity
 * - 2-day old: 20% opacity
 */

import type mapboxgl from 'mapbox-gl';

export interface WaterMovementOptions {
  enabled: boolean;
  currentDate: Date;
  showEdges?: boolean;
  showFilaments?: boolean;
  showEddies?: boolean;
  animationDuration?: number;
}

export interface HistoricalFeature {
  date: Date;
  daysAgo: number;
  opacity: number;
  features: GeoJSON.FeatureCollection;
}

/**
 * Manager class for 3-day water movement visualization
 */
export class WaterMovementVisualization {
  private map: mapboxgl.Map;
  private enabled: boolean = false;
  private historicalData: Map<string, HistoricalFeature[]> = new Map();
  private layerIds: string[] = [];
  private sourceIds: string[] = [];

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  /**
   * Toggle the 3-day movement visualization
   */
  async toggle(options: WaterMovementOptions): Promise<void> {
    this.enabled = options.enabled;

    if (!this.enabled) {
      this.clearLayers();
      return;
    }

    await this.loadHistoricalData(options);
    this.renderLayers(options);
  }

  /**
   * Load historical data for the past 3 days
   */
  private async loadHistoricalData(options: WaterMovementOptions): Promise<void> {
    const dates: Date[] = [];
    const opacities = [1.0, 0.4, 0.2]; // Current, T-1, T-2

    // Generate dates for past 3 days
    for (let i = 0; i < 3; i++) {
      const date = new Date(options.currentDate);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }

    // Load features for each date
    const promises = dates.map(async (date, index) => {
      const features = await this.fetchFeaturesForDate(date);
      return {
        date,
        daysAgo: index,
        opacity: opacities[index],
        features
      };
    });

    const historicalFeatures = await Promise.all(promises);

    // Store by feature type
    this.historicalData.clear();
    this.historicalData.set('edges', []);
    this.historicalData.set('filaments', []);
    this.historicalData.set('eddies', []);

    for (const histFeature of historicalFeatures) {
      // Separate features by type
      const edges = histFeature.features.features.filter(
        f => f.properties?.type === 'edge'
      );
      const filaments = histFeature.features.features.filter(
        f => f.properties?.type === 'filament'
      );
      const eddies = histFeature.features.features.filter(
        f => f.properties?.type === 'eddy'
      );

      if (edges.length > 0) {
        this.historicalData.get('edges')!.push({
          ...histFeature,
          features: { type: 'FeatureCollection', features: edges }
        });
      }

      if (filaments.length > 0) {
        this.historicalData.get('filaments')!.push({
          ...histFeature,
          features: { type: 'FeatureCollection', features: filaments }
        });
      }

      if (eddies.length > 0) {
        this.historicalData.get('eddies')!.push({
          ...histFeature,
          features: { type: 'FeatureCollection', features: eddies }
        });
      }
    }
  }

  /**
   * Fetch oceanographic features for a specific date
   */
  private async fetchFeaturesForDate(date: Date): Promise<GeoJSON.FeatureCollection> {
    try {
      // Get current map bounds
      const bounds = this.map.getBounds();
      const bbox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ];

      // Call the ocean features API
      const response = await fetch(
        `/api/ocean-features/historical?date=${date.toISOString()}&bbox=${bbox.join(',')}`
      );

      if (!response.ok) {
        console.warn(`Failed to fetch features for ${date.toISOString()}`);
        return { type: 'FeatureCollection', features: [] };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching historical features:', error);
      return { type: 'FeatureCollection', features: [] };
    }
  }

  /**
   * Render the historical layers with appropriate opacity
   */
  private renderLayers(options: WaterMovementOptions): void {
    // Clear existing layers first
    this.clearLayers();

    // Render edges if enabled
    if (options.showEdges !== false) {
      this.renderFeatureType('edges', '#FF0000');
    }

    // Render filaments if enabled
    if (options.showFilaments !== false) {
      this.renderFeatureType('filaments', '#FFFF00');
    }

    // Render eddies if enabled
    if (options.showEddies !== false) {
      this.renderFeatureType('eddies', '#00FF00');
    }
  }

  /**
   * Render a specific feature type with historical layers
   */
  private renderFeatureType(type: string, color: string): void {
    const historicalFeatures = this.historicalData.get(type);
    if (!historicalFeatures || historicalFeatures.length === 0) return;

    for (const histFeature of historicalFeatures) {
      if (histFeature.features.features.length === 0) continue;

      const sourceId = `water-movement-${type}-${histFeature.daysAgo}`;
      const fillLayerId = `${sourceId}-fill`;
      const outlineLayerId = `${sourceId}-outline`;

      // Add source
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: histFeature.features
      });
      this.sourceIds.push(sourceId);

      // Add fill layer with appropriate opacity
      this.map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': color,
          'fill-opacity': histFeature.opacity * 0.2 // Base opacity for fill
        }
      });
      this.layerIds.push(fillLayerId);

      // Add outline layer
      this.map.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': color,
          'line-width': histFeature.daysAgo === 0 ? 2 : 1,
          'line-opacity': histFeature.opacity,
          'line-dasharray': histFeature.daysAgo > 0 ? [2, 2] : [1, 0] // Dashed for historical
        }
      });
      this.layerIds.push(outlineLayerId);

      // Add label for current day features
      if (histFeature.daysAgo === 0) {
        const labelLayerId = `${sourceId}-label`;
        this.map.addLayer({
          id: labelLayerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'text-field': ['get', 'description'],
            'text-size': 10,
            'text-anchor': 'center',
            'text-offset': [0, -1]
          },
          paint: {
            'text-color': '#FFFFFF',
            'text-halo-color': '#000000',
            'text-halo-width': 1
          }
        });
        this.layerIds.push(labelLayerId);
      }
    }
  }

  /**
   * Clear all water movement layers from the map
   */
  private clearLayers(): void {
    // Remove layers
    for (const layerId of this.layerIds) {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    }
    this.layerIds = [];

    // Remove sources
    for (const sourceId of this.sourceIds) {
      if (this.map.getSource(sourceId)) {
        this.map.removeSource(sourceId);
      }
    }
    this.sourceIds = [];
  }

  /**
   * Animate the transition between days
   */
  async animateMovement(duration: number = 2000): Promise<void> {
    if (!this.enabled || this.historicalData.size === 0) return;

    const steps = 20;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;

      // Update opacity for each historical layer
      for (const [type, features] of this.historicalData) {
        for (const histFeature of features) {
          const baseOpacity = histFeature.opacity;
          const animatedOpacity = baseOpacity * (0.5 + 0.5 * Math.sin(progress * Math.PI));

          const fillLayerId = `water-movement-${type}-${histFeature.daysAgo}-fill`;
          const outlineLayerId = `water-movement-${type}-${histFeature.daysAgo}-outline`;

          if (this.map.getLayer(fillLayerId)) {
            this.map.setPaintProperty(fillLayerId, 'fill-opacity', animatedOpacity * 0.2);
          }
          if (this.map.getLayer(outlineLayerId)) {
            this.map.setPaintProperty(outlineLayerId, 'line-opacity', animatedOpacity);
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  }

  /**
   * Get summary statistics for water movement
   */
  getMovementStats(): {
    totalFeatures: number;
    movement: {
      edges: { count: number; avgDisplacement: number };
      filaments: { count: number; avgDisplacement: number };
      eddies: { count: number; avgDisplacement: number };
    };
  } {
    const stats = {
      totalFeatures: 0,
      movement: {
        edges: { count: 0, avgDisplacement: 0 },
        filaments: { count: 0, avgDisplacement: 0 },
        eddies: { count: 0, avgDisplacement: 0 }
      }
    };

    for (const [type, features] of this.historicalData) {
      const typeKey = type as 'edges' | 'filaments' | 'eddies';
      stats.movement[typeKey].count = features.reduce(
        (sum, f) => sum + f.features.features.length, 0
      );
      stats.totalFeatures += stats.movement[typeKey].count;

      // Calculate average displacement (simplified)
      if (features.length >= 2) {
        const currentFeatures = features[0].features.features;
        const oldFeatures = features[1].features.features;

        let totalDisplacement = 0;
        let matchCount = 0;

        for (const current of currentFeatures) {
          const currentCentroid = current.properties?.centroid;
          if (!currentCentroid) continue;

          // Find closest match in old features
          let minDistance = Infinity;
          for (const old of oldFeatures) {
            const oldCentroid = old.properties?.centroid;
            if (!oldCentroid) continue;

            const distance = Math.sqrt(
              Math.pow(currentCentroid[0] - oldCentroid[0], 2) +
              Math.pow(currentCentroid[1] - oldCentroid[1], 2)
            );

            if (distance < minDistance) {
              minDistance = distance;
            }
          }

          if (minDistance < Infinity) {
            totalDisplacement += minDistance;
            matchCount++;
          }
        }

        if (matchCount > 0) {
          // Convert to approximate kilometers
          stats.movement[typeKey].avgDisplacement =
            (totalDisplacement / matchCount) * 111; // Rough deg to km conversion
        }
      }
    }

    return stats;
  }

  /**
   * Clean up and destroy the visualization
   */
  destroy(): void {
    this.clearLayers();
    this.historicalData.clear();
  }
}

/**
 * React hook for water movement visualization
 */
export function useWaterMovement(map: mapboxgl.Map | null) {
  const visualizationRef = React.useRef<WaterMovementVisualization | null>(null);
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [stats, setStats] = React.useState<ReturnType<WaterMovementVisualization['getMovementStats']> | null>(null);

  React.useEffect(() => {
    if (!map) return;

    visualizationRef.current = new WaterMovementVisualization(map);

    return () => {
      visualizationRef.current?.destroy();
      visualizationRef.current = null;
    };
  }, [map]);

  const toggle = React.useCallback(async (enabled: boolean, options?: Partial<WaterMovementOptions>) => {
    if (!visualizationRef.current) return;

    const fullOptions: WaterMovementOptions = {
      enabled,
      currentDate: new Date(),
      showEdges: true,
      showFilaments: true,
      showEddies: true,
      ...options
    };

    await visualizationRef.current.toggle(fullOptions);
    setIsEnabled(enabled);

    if (enabled) {
      const newStats = visualizationRef.current.getMovementStats();
      setStats(newStats);
    } else {
      setStats(null);
    }
  }, []);

  const animate = React.useCallback(async () => {
    if (!visualizationRef.current || !isEnabled) return;
    await visualizationRef.current.animateMovement();
  }, [isEnabled]);

  return {
    isEnabled,
    toggle,
    animate,
    stats
  };
}

// Import React for the hook
import * as React from 'react';