export default class RectangleTool {
  constructor(context) {
    this.context = context;
    this.isDrawing = false;
    this.startPoint = null;
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
    const { color, strokeWidth, setIsDrawing } = this.context;
    const pos = this.getTransformedPointerPosition(e.target.getStage());
    
    this.isDrawing = true;
    this.startPoint = pos;
    
    const newElement = {
      type: 'rectangle',
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      stroke: color,
      strokeWidth: strokeWidth,
      fill: 'transparent'
    };
    
    this.context.addElement(newElement);
    setIsDrawing(true);
  }

  onMouseMove(e) {
    if (!this.isDrawing) return;
    
    const { pages, currentPage, updateElement } = this.context; // Destructure pages and currentPage
    const stage = e.target.getStage();
    const point = this.getTransformedPointerPosition(stage);
    
    const currentPageElements = pages[currentPage] || []; // Access elements for the current page
    const lastElement = currentPageElements[currentPageElements.length - 1];
    if (lastElement && lastElement.type === 'rectangle') {
      updateElement({
        ...lastElement,
        width: point.x - this.startPoint.x,
        height: point.y - this.startPoint.y
      });
    }
  }

  onMouseUp() {
    this.isDrawing = false;
    this.context.setIsDrawing(false);
  }
}