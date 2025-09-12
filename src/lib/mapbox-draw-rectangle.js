// Rectangle drawing mode for Mapbox Draw
const DrawRectangle = {
  onSetup: function(opts) {
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
    return {
      rectangle,
      startPoint: null,
      currentPoint: null
    };
  },

  onClick: function(state, e) {
    // First click sets the start point
    if (!state.startPoint) {
      state.startPoint = [e.lngLat.lng, e.lngLat.lat];
      state.currentPoint = state.startPoint;
      this.updateUIClasses({ mouse: 'add' });
    } 
    // Second click completes the rectangle
    else {
      state.currentPoint = [e.lngLat.lng, e.lngLat.lat];
      this.updateUIClasses({ mouse: 'pointer' });
      
      // Update final rectangle
      const startPoint = state.startPoint;
      const endPoint = state.currentPoint;
      
      state.rectangle.updateCoordinate('0', startPoint[0], startPoint[1]);
      state.rectangle.updateCoordinate('1', startPoint[0], endPoint[1]);
      state.rectangle.updateCoordinate('2', endPoint[0], endPoint[1]);
      state.rectangle.updateCoordinate('3', endPoint[0], startPoint[1]);
      state.rectangle.updateCoordinate('4', startPoint[0], startPoint[1]);
      
      // Fire create event and switch to select mode
      this.map.fire('draw.create', {
        features: [state.rectangle.toGeoJSON()]
      });
      this.changeMode('simple_select', { featureIds: [state.rectangle.id] });
    }
  },

  onMouseMove: function(state, e) {
    // Update the rectangle preview while moving
    if (state.startPoint && !state.currentPoint) {
      const startPoint = state.startPoint;
      const currentPoint = [e.lngLat.lng, e.lngLat.lat];
      
      // Update rectangle coordinates for preview
      state.rectangle.updateCoordinate('0', startPoint[0], startPoint[1]);
      state.rectangle.updateCoordinate('1', startPoint[0], currentPoint[1]);
      state.rectangle.updateCoordinate('2', currentPoint[0], currentPoint[1]);
      state.rectangle.updateCoordinate('3', currentPoint[0], startPoint[1]);
      state.rectangle.updateCoordinate('4', startPoint[0], startPoint[1]);
    }
  },

  onKeyUp: function(state, e) {
    if (e.keyCode === 27) { // Escape key
      this.deleteFeature([state.rectangle.id], { silent: true });
      this.changeMode('simple_select');
    }
  },

  onStop: function(state) {
    this.updateUIClasses({ mouse: 'none' });
    if (this.getFeature(state.rectangle.id) !== undefined) {
      if (state.rectangle.isValid()) {
        // Feature already created in onClick
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
    
    // Only display if we have at least a start point
    if (state.startPoint) {
      return display(geojson);
    }
  },

  onTrash: function(state) {
    this.deleteFeature([state.rectangle.id], { silent: true });
    this.changeMode('simple_select');
  }
};

export default DrawRectangle;