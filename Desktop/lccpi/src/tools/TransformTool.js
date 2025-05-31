export default class TransformTool {
  constructor(context) {
    this.context = context;
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
    console.log('TransformTool onMouseDown', e.target);
    
    // Don't interfere if clicking on transformer handles
    if (e.target.getClassName() === 'Transformer') {
      console.log('TransformTool: clicked on transformer, letting it handle');
      return;
    }
    
    const { setSelectedElement, pages, currentPage } = this.context;
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty) {
      console.log('TransformTool: clicked on empty area, deselecting');
      setSelectedElement(null);
      return;
    }
    
    const id = e.target.id();
    console.log('TransformTool: clicked on element with id:', id);
    if (id) {
      const currentPageElements = pages[currentPage] || [];
      const element = currentPageElements.find(el => el.id === id);
      if (element) {
        console.log('TransformTool: selecting element:', element);
        setSelectedElement(element);
      } else {
        console.log('TransformTool: element not found in current page');
      }
    }
  }

  onMouseMove(e) {
    // Don't interfere with transformer's mouse move
    if (e.target.getClassName() === 'Transformer') {
      return;
    }
    // Transform is handled by Konva's Transformer component
  }

  onMouseUp(e) {
    console.log('TransformTool onMouseUp');
    // Don't interfere with transformer's mouse up
    if (e.target.getClassName() === 'Transformer') {
      return;
    }
    // Don't update here - let onTransformEnd handle it
  }

  onTransformEnd(e) {
    console.log('TransformTool onTransformEnd', e.target);
    const { selectedElement, updateElement, saveToHistory } = this.context;
    if (selectedElement) {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      console.log('TransformTool: transform end for element:', selectedElement.type);
      console.log('Node position:', node.x(), node.y());
      console.log('Node scale:', scaleX, scaleY);
      console.log('Node rotation:', node.rotation());
      console.log('Node size:', node.width(), node.height());
      console.log('Selected element current dimensions:', selectedElement);
      
      const updatedElement = {
        ...selectedElement,
        x: node.x(),
        y: node.y(),
        rotation: node.rotation()
      };
      
      if (selectedElement.type === 'rectangle') {
        // For rectangles, apply scale to the current element's width and height
        const newWidth = Math.abs(selectedElement.width * scaleX);
        const newHeight = Math.abs(selectedElement.height * scaleY);
        
        console.log('Rectangle scaling: original:', selectedElement.width, 'x', selectedElement.height, 
                   'scale:', scaleX, 'x', scaleY, 'new:', newWidth, 'x', newHeight);
        
        updatedElement.width = newWidth;
        updatedElement.height = newHeight;
        
        // Reset the node's scale after applying it to dimensions
        node.scaleX(1);
        node.scaleY(1);
        node.width(newWidth);
        node.height(newHeight);
        
      } else if (selectedElement.type === 'circle') {
        // For circles, apply scale to the current element's radius
        const newRadius = Math.abs(selectedElement.radius * Math.max(scaleX, scaleY));
        
        console.log('Circle scaling: original radius:', selectedElement.radius, 
                   'scale:', Math.max(scaleX, scaleY), 'new radius:', newRadius);
        
        updatedElement.radius = newRadius;
        
        // Reset the node's scale after applying it to radius
        node.scaleX(1);
        node.scaleY(1);
        node.radius(newRadius);
        
      } else if (selectedElement.type === 'line') {
        // For lines, we need to scale all points relative to the line's position
        const newPoints = [];
        for (let i = 0; i < selectedElement.points.length; i += 2) {
          newPoints.push(
            selectedElement.points[i] * scaleX,
            selectedElement.points[i + 1] * scaleY
          );
        }
        
        console.log('Line scaling: original points:', selectedElement.points, 
                   'scale:', scaleX, 'x', scaleY, 'new points:', newPoints);
        
        updatedElement.points = newPoints;
        
        // Reset the node's scale
        node.scaleX(1);
        node.scaleY(1);
        
      } else if (selectedElement.type === 'image') {
        // For images, apply scale to the current element's width and height
        const newWidth = Math.abs(selectedElement.width * scaleX);
        const newHeight = Math.abs(selectedElement.height * scaleY);
        
        console.log('Image scaling: original:', selectedElement.width, 'x', selectedElement.height, 
                   'scale:', scaleX, 'x', scaleY, 'new:', newWidth, 'x', newHeight);
        
        updatedElement.width = newWidth;
        updatedElement.height = newHeight;
        
        // Reset the node's scale after applying it to dimensions
        node.scaleX(1);
        node.scaleY(1);
        node.width(newWidth);
        node.height(newHeight);
      }
      
      console.log('TransformTool: updating element to:', updatedElement);
      updateElement(updatedElement);
      
      // Save to history after transformation
      if (saveToHistory) {
        saveToHistory();
      }
    }
  }
}