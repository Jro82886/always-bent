// Rectangle drawing mode for Mapbox Draw
const DrawRectangle = {
  onSetup: function() {
    const rectangle = this.newFeature({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[]]
      }
    });
    this.addFeature(rectangle);
    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: 'add' });
    this.setActionableState({
      trash: true
    });
    return { rectangle };
  },

  onClick: function(state, e) {
    if (state.startPoint && !state.endPoint) {
      state.endPoint = [e.lngLat.lng, e.lngLat.lat];
      this.updateUIClasses({ mouse: 'pointer' });
      const startPoint = state.startPoint;
      const endPoint = state.endPoint;
      const rectangleCoordinates = [
        startPoint,
        [startPoint[0], endPoint[1]],
        endPoint,
        [endPoint[0], startPoint[1]],
        startPoint
      ];
      state.rectangle.updateCoordinate('0', startPoint[0], startPoint[1]);
      state.rectangle.updateCoordinate('1', startPoint[0], endPoint[1]);
      state.rectangle.updateCoordinate('2', endPoint[0], endPoint[1]);
      state.rectangle.updateCoordinate('3', endPoint[0], startPoint[1]);
      state.rectangle.updateCoordinate('4', startPoint[0], startPoint[1]);
      this.map.fire('draw.create', {
        features: [state.rectangle.toGeoJSON()]
      });
      this.changeMode('simple_select', { featureIds: [state.rectangle.id] });
    } else if (!state.startPoint) {
      state.startPoint = [e.lngLat.lng, e.lngLat.lat];
    }
  },

  onMouseMove: function(state, e) {
    if (state.startPoint && !state.endPoint) {
      const startPoint = state.startPoint;
      const currentPoint = [e.lngLat.lng, e.lngLat.lat];
      state.rectangle.updateCoordinate('0', startPoint[0], startPoint[1]);
      state.rectangle.updateCoordinate('1', startPoint[0], currentPoint[1]);
      state.rectangle.updateCoordinate('2', currentPoint[0], currentPoint[1]);
      state.rectangle.updateCoordinate('3', currentPoint[0], startPoint[1]);
      state.rectangle.updateCoordinate('4', startPoint[0], startPoint[1]);
    }
  },

  onKeyUp: function(state, e) {
    if (e.keyCode === 27) { // Escape
      this.changeMode('simple_select');
    }
  },

  onStop: function(state) {
    this.updateUIClasses({ mouse: 'none' });
    if (this.getFeature(state.rectangle.id) !== undefined) {
      if (state.rectangle.isValid()) {
        this.map.fire('draw.create', {
          features: [state.rectangle.toGeoJSON()]
        });
      } else {
        this.deleteFeature([state.rectangle.id], { silent: true });
        this.changeMode('simple_select', {}, { silent: true });
      }
    }
  },

  toDisplayFeatures: function(state, geojson, display) {
    const isActive = geojson.properties.id === state.rectangle.id;
    geojson.properties.active = isActive ? 'true' : 'false';
    if (!isActive) return display(geojson);
    return display(geojson);
  },

  onTrash: function(state) {
    this.deleteFeature([state.rectangle.id], { silent: true });
    this.changeMode('simple_select');
  }
};

export default DrawRectangle;
