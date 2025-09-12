// Rectangle drawing mode for Mapbox Draw with drag behavior
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
    this.activateUIButton();
    this.setActionableState({
      trash: true
    });
    return { 
      rectangle,
      startPoint: null,
      isDrawing: false
    };
  },

  onMouseDown: function(state, e) {
    // Prevent default map dragging
    e.preventDefault();
    
    // Start drawing on mouse down
    state.startPoint = [e.lngLat.lng, e.lngLat.lat];
    state.isDrawing = true;
    this.updateUIClasses({ mouse: 'add' });
  },

  onDrag: function(state, e) {
    if (!state.isDrawing || !state.startPoint) return;
    
    // Update rectangle while dragging
    const startPoint = state.startPoint;
    const currentPoint = [e.lngLat.lng, e.lngLat.lat];
    
    // Create rectangle coordinates
    const rectangleCoordinates = [
      startPoint,
      [startPoint[0], currentPoint[1]],
      currentPoint,
      [currentPoint[0], startPoint[1]],
      startPoint
    ];
    
    // Update the rectangle geometry
    state.rectangle.updateCoordinate('0', startPoint[0], startPoint[1]);
    state.rectangle.updateCoordinate('1', startPoint[0], currentPoint[1]);
    state.rectangle.updateCoordinate('2', currentPoint[0], currentPoint[1]);
    state.rectangle.updateCoordinate('3', currentPoint[0], startPoint[1]);
    state.rectangle.updateCoordinate('4', startPoint[0], startPoint[1]);
  },

  onMouseUp: function(state, e) {
    if (!state.isDrawing || !state.startPoint) return;
    
    // Finish drawing on mouse up
    const endPoint = [e.lngLat.lng, e.lngLat.lat];
    
    // Check if rectangle has area (not just a click)
    const dx = Math.abs(endPoint[0] - state.startPoint[0]);
    const dy = Math.abs(endPoint[1] - state.startPoint[1]);
    
    if (dx > 0.00001 || dy > 0.00001) {
      // Valid rectangle
      this.updateUIClasses({ mouse: 'pointer' });
      this.map.fire('draw.create', {
        features: [state.rectangle.toGeoJSON()]
      });
      this.changeMode('simple_select', { featureIds: [state.rectangle.id] });
    } else {
      // Too small, reset
      state.startPoint = null;
      state.isDrawing = false;
      state.rectangle.updateCoordinate('0', 0, 0);
      state.rectangle.updateCoordinate('1', 0, 0);
      state.rectangle.updateCoordinate('2', 0, 0);
      state.rectangle.updateCoordinate('3', 0, 0);
      state.rectangle.updateCoordinate('4', 0, 0);
    }
  },

  onKeyUp: function(state, e) {
    if (e.keyCode === 27) { // Escape
      this.deleteFeature([state.rectangle.id], { silent: true });
      this.changeMode('simple_select');
    }
  },

  onStop: function(state) {
    this.updateUIClasses({ mouse: 'none' });
    this.deactivateUIButton();
    if (this.getFeature(state.rectangle.id) !== undefined) {
      if (state.rectangle.isValid()) {
        // Already fired in onMouseUp
      } else {
        this.deleteFeature([state.rectangle.id], { silent: true });
        this.changeMode('simple_select', {}, { silent: true });
      }
    }
  },

  toDisplayFeatures: function(state, geojson, display) {
    const isActive = geojson.properties.id === state.rectangle.id;
    geojson.properties.active = isActive ? 'true' : 'false';
    display(geojson);
  },

  onTrash: function(state) {
    this.deleteFeature([state.rectangle.id], { silent: true });
    this.changeMode('simple_select');
  }
};

export default DrawRectangle;