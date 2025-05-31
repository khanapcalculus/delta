export default class EraserTool {
  constructor(context) {
    this.context = context;
    this.isErasing = false;
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
    const { strokeWidth, setIsDrawing } = this.context;
    const pos = this.getTransformedPointerPosition(e.target.getStage());
    
    this.isErasing = true;
    this.points = [pos.x, pos.y];
    
    const newElement = {
      type: 'line',
      points: this.points,
      stroke: 'rgba(0,0,0,1)',
      strokeWidth: strokeWidth * 2,
      lineCap: 'round',
      lineJoin: 'round',
      tension: 0.5,
      globalCompositeOperation: 'destination-out'
    };
    
    this.context.addElement(newElement);
    setIsDrawing(true);
  }

  onMouseMove(e) {
    if (!this.isErasing) return;
    
    const { pages, currentPage, updateElement } = this.context; // Destructure pages and currentPage
    const stage = e.target.getStage();
    const point = this.getTransformedPointerPosition(stage);
    
    this.points = [...this.points, point.x, point.y];
    
    const currentPageElements = pages[currentPage] || []; // Access elements for the current page
    const lastElement = currentPageElements[currentPageElements.length - 1];
    if (lastElement && lastElement.type === 'line' && lastElement.globalCompositeOperation === 'destination-out') {
      updateElement({
        ...lastElement,
        points: this.points
      });
    }
  }

  onMouseUp() {
    this.isErasing = false;
    this.context.setIsDrawing(false);
  }
}