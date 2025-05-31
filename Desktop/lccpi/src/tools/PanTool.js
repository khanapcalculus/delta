export default class PanTool {
  constructor(context) {
    this.context = context;
    this.isPanning = false;
    this.lastPosition = null;
  }

  onMouseDown(e) {
    const pos = e.target.getStage().getPointerPosition();
    this.isPanning = true;
    this.lastPosition = pos;
  }

  onMouseMove(e) {
    if (!this.isPanning) return;
    
    const { position, setPosition } = this.context;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    setPosition({
      x: position.x + (point.x - this.lastPosition.x),
      y: position.y + (point.y - this.lastPosition.y)
    });
    
    this.lastPosition = point;
  }

  onMouseUp() {
    this.isPanning = false;
  }

  onWheel(e) {
    e.evt.preventDefault();
    
    const { scale, setScale, position, setPosition } = this.context;
    const stage = e.target.getStage();
    const oldScale = scale;
    
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale
    };
    
    // Calculate new scale
    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    
    // Limit scale
    const limitedScale = Math.max(0.1, Math.min(newScale, 5));
    
    setScale(limitedScale);
    
    // Calculate new position
    const newPos = {
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale
    };
    
    setPosition(newPos);
  }
}