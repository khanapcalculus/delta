export default class PenTool {
  constructor(context) {
    this.context = context;
    this.isDrawing = false;
    this.points = [];
  }

  // Helper function to get transformed mouse position accounting for pan and zoom
  getTransformedPointerPosition(stage) {
    const { position, scale } = this.context;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    
    // Transform the pointer position to account for canvas pan and zoom
    const transformedX = (pointer.x - position.x) / scale;
    const transformedY = (pointer.y - position.y) / scale;
    
    return { x: transformedX, y: transformedY };
  }

  onMouseDown(e) {
    console.log('PenTool onMouseDown', this.context);
    try {
      const { color, strokeWidth, setIsDrawing, addElement } = this.context;
      const stage = e.target.getStage();
      if (!stage) return;
      
      const pos = this.getTransformedPointerPosition(stage);
      if (!pos) return;
      
      this.isDrawing = true;
      this.points = [pos.x, pos.y];
      
      const newElement = {
        type: 'line',
        points: this.points,
        stroke: color,
        strokeWidth: strokeWidth,
        lineCap: 'round',
        lineJoin: 'round',
        tension: 0.5,
        globalCompositeOperation: 'source-over'
      };
      
      // Store reference to the element returned by addElement (which has the ID)
      this.currentElement = addElement(newElement);
      console.log('PenTool onMouseDown - stored currentElement:', this.currentElement);
      setIsDrawing(true);
    } catch (error) {
      console.error('PenTool onMouseDown error:', error);
    }
  }

  onMouseMove(e) {
    console.log('PenTool onMouseMove called - isDrawing:', this.isDrawing, 'currentElement:', !!this.currentElement);
    
    if (!this.isDrawing || !this.currentElement) {
      console.log('PenTool onMouseMove - early return. isDrawing:', this.isDrawing, 'currentElement:', !!this.currentElement);
      return;
    }

    const stage = e.target.getStage();
    const point = this.getTransformedPointerPosition(stage);
    
    console.log('PenTool onMouseMove - drawing! Point:', point);
    
    if (point) {
      // Update the points array
      this.points = [...this.points, point.x, point.y];
      
      const updatedElement = {
        ...this.currentElement,
        points: this.points
      };
      
      console.log('PenTool onMouseMove - updating element with points:', this.points.length / 2, 'points');
      
      this.currentElement = updatedElement;
      this.context.updateElement(updatedElement);
    }
  }

  onMouseUp() {
    console.log('PenTool onMouseUp');
    this.isDrawing = false;
    this.currentElement = null;
    this.points = [];
    this.context.setIsDrawing(false);
    
    // Save to history when drawing is complete
    if (this.context.saveToHistory) {
      this.context.saveToHistory();
    }
  }
}