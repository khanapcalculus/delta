import React, { useContext, useEffect, useRef } from 'react';
import { Circle, Image, Layer, Line, Rect, Stage, Transformer } from 'react-konva';
import { WhiteboardContext } from '../../context/WhiteboardContext';
import CircleTool from '../../tools/CircleTool';
import EraserTool from '../../tools/EraserTool';
import ImageTool from '../../tools/ImageTool';
import LineTool from '../../tools/LineTool';
import PanTool from '../../tools/PanTool';
import PenTool from '../../tools/PenTool';
import RectangleTool from '../../tools/RectangleTool';
import TransformTool from '../../tools/TransformTool';

const Canvas = () => {
  const context = useContext(WhiteboardContext);
  const {
    tool,
    selectedElement,
    setSelectedElement,
    scale,
    position,
    updateElement,
    pages,
    currentPage
  } = context;
  
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const transformerRef = useRef(null);
  
  const toolInstances = useRef({
    pen: null,
    eraser: null,
    rectangle: null,
    circle: null,
    line: null,
    transform: null,
    pan: null,
    image: null
  });
  
  // Test direct event listeners
  useEffect(() => {
    console.log('Canvas component mounted, stageRef:', stageRef.current);
    
    // Check Stage after a short delay to ensure it's mounted
    setTimeout(() => {
      if (stageRef.current) {
        const stage = stageRef.current;
        const container = stage.container();
        console.log('Stage container:', container);
        console.log('Stage size:', stage.width(), 'x', stage.height());
        console.log('Container style:', container.style.cssText);
        console.log('Container position:', container.getBoundingClientRect());
      }
    }, 1000);
  }, []);
  
  // Initialize tools
  useEffect(() => {
    console.log('Initializing tools with context:', context);
    if (context && Object.keys(context).length > 0 && !toolInstances.current.pen) {
      console.log('Context is valid, creating tool instances...');
      toolInstances.current = {
        pen: new PenTool(context),
        eraser: new EraserTool(context),
        rectangle: new RectangleTool(context),
        circle: new CircleTool(context),
        line: new LineTool(context),
        transform: new TransformTool(context),
        pan: new PanTool(context),
        image: new ImageTool(context)
      };
      console.log('Tool instances created:', Object.keys(toolInstances.current));
    } else if (toolInstances.current.pen) {
      console.log('Tools already exist, updating context references...');
      // Update context references without recreating tools
      Object.values(toolInstances.current).forEach(tool => {
        if (tool && tool.context) {
          tool.context = context;
        }
      });
    } else {
      console.log('Context is not ready yet:', context);
    }
  }, [context]);
  
  // Handle transformer
  useEffect(() => {
    if (selectedElement && transformerRef.current) {
      // Check if the selected element exists on the current page
      const currentPageElements = pages[currentPage] || [];
      const elementExistsOnCurrentPage = currentPageElements.find(el => el.id === selectedElement.id);
      
      if (!elementExistsOnCurrentPage) {
        console.log('Selected element not found on current page, clearing selection');
        setSelectedElement(null);
        return;
      }
      
      const node = layerRef.current.findOne(`#${selectedElement.id}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        console.log('Node not found for selected element, clearing selection');
        setSelectedElement(null);
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedElement, pages, currentPage, setSelectedElement]);
  
  const handleMouseDown = (e) => {
    console.log('Canvas handleMouseDown triggered!');
    console.log('Mouse down - current tool:', tool, 'toolInstances:', toolInstances.current);
    console.log('Event target:', e.target, 'Stage:', e.target.getStage());
    
    // Don't prevent default for transform tool interactions
    if (tool !== 'transform') {
      e.evt.preventDefault();
    }
    
    try {
      const currentTool = toolInstances.current[tool];
      if (currentTool) {
        console.log('Calling onMouseDown for tool:', tool);
        currentTool.onMouseDown(e);
      } else {
        console.log('No tool instance found for:', tool);
        console.log('Available tools:', Object.keys(toolInstances.current));
      }
    } catch (error) {
      console.error('Error in handleMouseDown:', error);
    }
  };
  
  const handleMouseMove = (e) => {
    try {
      const currentTool = toolInstances.current[tool];
      if (currentTool) {
        currentTool.onMouseMove(e);
      }
    } catch (error) {
      console.error('Error in handleMouseMove:', error);
    }
  };
  
  const handleMouseUp = (e) => {
    console.log('Canvas handleMouseUp triggered!');
    
    // Don't prevent default for transform tool interactions
    if (tool !== 'transform') {
      e.evt.preventDefault();
    }
    
    try {
      const currentTool = toolInstances.current[tool];
      if (currentTool) {
        console.log('Calling onMouseUp for tool:', tool);
        currentTool.onMouseUp(e);
      }
    } catch (error) {
      console.error('Error in handleMouseUp:', error);
    }
  };
  
  const handleWheel = (e) => {
    if (tool === 'pan') {
      const panTool = toolInstances.current.pan;
      if (panTool) {
        panTool.onWheel(e);
      }
    }
  };
  
  const handleTransformEnd = (e) => {
    console.log('Canvas handleTransformEnd called');
    const transformTool = toolInstances.current.transform;
    if (transformTool) {
      transformTool.onTransformEnd(e);
    }
  };
  
  const handleElementClick = (element) => {
    console.log('Element clicked:', element, 'current tool:', tool);
    if (tool === 'transform') {
      setSelectedElement(element);
    }
  };
  
  const renderElement = (element) => {
    console.log('Canvas: rendering element:', element.type, 'with dimensions:', 
               element.type === 'rectangle' ? `${element.width}x${element.height}` :
               element.type === 'circle' ? `radius: ${element.radius}` :
               element.type === 'line' ? `points: ${element.points}` : 'unknown');
    
    switch (element.type) {
      case 'line':
        return (
          <Line
            key={element.id}
            id={element.id}
            points={element.points}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            lineCap={element.lineCap}
            lineJoin={element.lineJoin}
            tension={element.tension}
            globalCompositeOperation={element.globalCompositeOperation}
            rotation={element.rotation || 0}
            onClick={() => handleElementClick(element)}
          />
        );
      case 'rectangle':
        return (
          <Rect
            key={element.id}
            id={element.id}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            fill={element.fill}
            rotation={element.rotation || 0}
            onClick={() => handleElementClick(element)}
            draggable={tool === 'transform' && selectedElement?.id === element.id}
            onDragEnd={(e) => {
              if (tool === 'transform') {
                const updatedElement = {
                  ...element,
                  x: e.target.x(),
                  y: e.target.y()
                };
                updateElement(updatedElement);
                if (context.saveToHistory) {
                  context.saveToHistory();
                }
              }
            }}
          />
        );
      case 'circle':
        return (
          <Circle
            key={element.id}
            id={element.id}
            x={element.x}
            y={element.y}
            radius={element.radius}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            fill={element.fill}
            rotation={element.rotation || 0}
            onClick={() => handleElementClick(element)}
            draggable={tool === 'transform' && selectedElement?.id === element.id}
            onDragEnd={(e) => {
              if (tool === 'transform') {
                const updatedElement = {
                  ...element,
                  x: e.target.x(),
                  y: e.target.y()
                };
                updateElement(updatedElement);
                if (context.saveToHistory) {
                  context.saveToHistory();
                }
              }
            }}
          />
        );
      case 'image':
        return (
          <Image
            key={element.id}
            id={element.id}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            rotation={element.rotation || 0}
            image={(() => {
              const img = new window.Image();
              img.src = element.src;
              return img;
            })()}
            onClick={() => handleElementClick(element)}
            draggable={tool === 'transform' && selectedElement?.id === element.id}
            onDragEnd={(e) => {
              if (tool === 'transform') {
                const updatedElement = {
                  ...element,
                  x: e.target.x(),
                  y: e.target.y()
                };
                updateElement(updatedElement);
                if (context.saveToHistory) {
                  context.saveToHistory();
                }
              }
            }}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="canvas-container">
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onClick={(e) => {
          console.log('🎯 Stage clicked!', e);
          console.log('Stage dimensions:', window.innerWidth, 'x', window.innerHeight);
          console.log('Click position:', e.evt.clientX, e.evt.clientY);
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onPointerDown={handleMouseDown}
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        listening={true}
        preventDefault={false}
        style={{ backgroundColor: 'rgba(0, 255, 0, 0.1)' }}
      >
        <Layer 
          ref={layerRef}
          listening={true}
        >
          {(pages[currentPage] || []).map(renderElement)}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            onTransformEnd={handleTransformEnd}
            enabledAnchors={[
              'top-left', 'top-center', 'top-right',
              'middle-right', 'middle-left',
              'bottom-left', 'bottom-center', 'bottom-right'
            ]}
            rotateEnabled={true}
            borderEnabled={true}
            anchorSize={8}
            anchorStroke="#666"
            anchorFill="#fff"
            anchorCornerRadius={2}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;