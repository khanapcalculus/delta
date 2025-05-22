import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Image, Transformer, Group } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client';

const Canvas = () => {
  // Socket connection
  const socketRef = useRef(null);
  
  // Canvas state
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const transformerRef = useRef(null);
  
  // Tool states
  const [tool, setTool] = useState('pen'); // pen, eraser, select, pan, image
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  
  // Drawing states
  const [lines, setLines] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);
  
  // Page management
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState([{ lines: [], images: [] }]);
  
  // Pan and zoom state
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
  // Colors and stroke widths options
  const colorOptions = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFFFFF', '#808080', '#800000', 
    '#808000', '#008000', '#800080', '#008080', '#000080', '#FFA500'
  ];
  
  const strokeWidthOptions = [1, 3, 5, 8, 12, 16, 20, 24];

  // Initialize socket connection
  useEffect(() => {
    // Replace with your socket server URL when deploying
    socketRef.current = io('http://localhost:3001');
    
    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
    });
    
    socketRef.current.on('canvas-data', (data) => {
      if (data.page === currentPage) {
        handleRemoteUpdate(data);
      }
    });
    
    socketRef.current.on('page-change', (pageIndex) => {
      setCurrentPage(pageIndex);
    });
    
    return () => {
      socketRef.current.disconnect();
    };
  }, []);
  
  // Load current page data
  useEffect(() => {
    if (pages[currentPage]) {
      setLines(pages[currentPage].lines);
      setImages(pages[currentPage].images);
    }
  }, [currentPage, pages]);
  
  // Save current page data when lines or images change
  useEffect(() => {
    const newPages = [...pages];
    newPages[currentPage] = { lines, images };
    setPages(newPages);
    
    // Add to history for undo/redo
    if (lines.length > 0 || images.length > 0) {
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push({ lines: [...lines], images: [...images] });
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    }
  }, [lines, images]);
  
  // Handle remote updates from other users
  const handleRemoteUpdate = (data) => {
    if (data.type === 'line') {
      setLines(prevLines => {
        const lineExists = prevLines.find(line => line.id === data.line.id);
        if (lineExists) {
          return prevLines.map(line => line.id === data.line.id ? data.line : line);
        } else {
          return [...prevLines, data.line];
        }
      });
    } else if (data.type === 'image') {
      setImages(prevImages => {
        const imageExists = prevImages.find(img => img.id === data.image.id);
        if (imageExists) {
          return prevImages.map(img => img.id === data.image.id ? data.image : img);
        } else {
          return [...prevImages, data.image];
        }
      });
    } else if (data.type === 'delete') {
      if (data.objectType === 'line') {
        setLines(prevLines => prevLines.filter(line => line.id !== data.id));
      } else if (data.objectType === 'image') {
        setImages(prevImages => prevImages.filter(img => img.id !== data.id));
      }
    }
  };
  
  // Emit changes to socket server
  const emitCanvasData = (data) => {
    if (socketRef.current) {
      socketRef.current.emit('canvas-data', { ...data, page: currentPage });
    }
  };
  
  // Handle mouse down event
  const handleMouseDown = (e) => {
    if (tool === 'select') {
      // Deselect when clicked on empty area
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedId(null);
      }
      return;
    }
    
    if (tool === 'pan') {
      setIsDragging(true);
      return;
    }
    
    if (tool === 'pen' || tool === 'eraser') {
      const pos = e.target.getStage().getPointerPosition();
      const newLine = {
        id: uuidv4(),
        tool,
        points: [pos.x, pos.y],
        color: tool === 'pen' ? color : '#ffffff',
        strokeWidth: strokeWidth,
      };
      
      setLines([...lines, newLine]);
      emitCanvasData({ type: 'line', line: newLine });
    }
  };
  
  // Handle mouse move event
  const handleMouseMove = (e) => {
    if (tool === 'pan' && isDragging) {
      const newPos = {
        x: e.target.getStage().x() + e.evt.movementX,
        y: e.target.getStage().y() + e.evt.movementY
      };
      setStagePos(newPos);
      return;
    }
    
    if ((tool === 'pen' || tool === 'eraser') && lines.length) {
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      const lastLine = lines[lines.length - 1];
      
      // Add point to last line
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      
      // Replace last line
      const newLines = [...lines.slice(0, lines.length - 1), lastLine];
      setLines(newLines);
      emitCanvasData({ type: 'line', line: lastLine });
    }
  };
  
  // Handle mouse up event
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle object selection
  const handleSelect = (id, type) => {
    setSelectedId({ id, type });
  };
  
  // Handle object transformation
  const handleTransform = (e, id, type) => {
    if (type === 'image') {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = node.rotation();
      
      const updatedImages = images.map(img => {
        if (img.id === id) {
          return {
            ...img,
            x: node.x(),
            y: node.y(),
            scaleX,
            scaleY,
            rotation
          };
        }
        return img;
      });
      
      setImages(updatedImages);
      const updatedImage = updatedImages.find(img => img.id === id);
      emitCanvasData({ type: 'image', image: updatedImage });
    }
  };
  
  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.src = reader.result;
        img.onload = () => {
          const imageObj = {
            id: uuidv4(),
            image: reader.result,
            x: 100,
            y: 100,
            width: img.width,
            height: img.height,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
          };
          setImages([...images, imageObj]);
          emitCanvasData({ type: 'image', image: imageObj });
        };
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle object deletion
  const handleDelete = () => {
    if (selectedId) {
      if (selectedId.type === 'line') {
        const newLines = lines.filter(line => line.id !== selectedId.id);
        setLines(newLines);
        emitCanvasData({ type: 'delete', objectType: 'line', id: selectedId.id });
      } else if (selectedId.type === 'image') {
        const newImages = images.filter(img => img.id !== selectedId.id);
        setImages(newImages);
        emitCanvasData({ type: 'delete', objectType: 'image', id: selectedId.id });
      }
      setSelectedId(null);
    }
  };
  
  // Handle undo
  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      const previousState = history[newStep];
      setLines(previousState.lines);
      setImages(previousState.images);
      setHistoryStep(newStep);
    }
  };
  
  // Handle redo
  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      const nextState = history[newStep];
      setLines(nextState.lines);
      setImages(nextState.images);
      setHistoryStep(newStep);
    }
  };
  
  // Handle page navigation
  const handlePageChange = (direction) => {
    let newPage;
    if (direction === 'next') {
      newPage = currentPage + 1;
      if (newPage >= pages.length) {
        // Create a new page if we're at the end
        setPages([...pages, { lines: [], images: [] }]);
      }
    } else {
      newPage = Math.max(0, currentPage - 1);
    }
    
    setCurrentPage(newPage);
    if (socketRef.current) {
      socketRef.current.emit('page-change', newPage);
    }
  };
  
  // Handle zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    
    const pointerPos = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
    };
    
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    setStageScale(newScale);
    setStagePos({
      x: -(pointerPos.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(pointerPos.y - stage.getPointerPosition().y / newScale) * newScale
    });
  };
  
  // Toggle color palette
  const togglePalette = () => {
    setIsPaletteOpen(!isPaletteOpen);
  };

  return (
    <div className="canvas-container">
      <div className="toolbar">
        <button onClick={() => setTool('pen')} className={tool === 'pen' ? 'active' : ''}>
          Pen
        </button>
        <button onClick={() => setTool('eraser')} className={tool === 'eraser' ? 'active' : ''}>
          Eraser
        </button>
        <button onClick={() => setTool('select')} className={tool === 'select' ? 'active' : ''}>
          Select
        </button>
        <button onClick={() => setTool('pan')} className={tool === 'pan' ? 'active' : ''}>
          Pan
        </button>
        <label className="image-upload">
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          Image
        </label>
        <button onClick={handleDelete} disabled={!selectedId}>
          Delete
        </button>
        <button onClick={handleUndo} disabled={historyStep <= 0}>
          Undo
        </button>
        <button onClick={handleRedo} disabled={historyStep >= history.length - 1}>
          Redo
        </button>
        <div className="color-picker">
          <button 
            onClick={togglePalette} 
            className="color-button" 
            style={{ backgroundColor: color }}
          ></button>
          {isPaletteOpen && (
            <div className="color-palette">
              {colorOptions.map((c) => (
                <div 
                  key={c} 
                  className="color-option" 
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    setColor(c);
                    setIsPaletteOpen(false);
                  }}
                ></div>
              ))}
              <div className="stroke-options">
                {strokeWidthOptions.map((width) => (
                  <div 
                    key={width} 
                    className={`stroke-option ${strokeWidth === width ? 'active' : ''}`}
                    onClick={() => {
                      setStrokeWidth(width);
                      setIsPaletteOpen(false);
                    }}
                  >
                    <div style={{ height: width, backgroundColor: color }}></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="page-navigation">
        <button onClick={() => handlePageChange('prev')} disabled={currentPage === 0}>
          Previous Page
        </button>
        <span>Page {currentPage + 1} of {pages.length}</span>
        <button onClick={() => handlePageChange('next')}>
          Next Page
        </button>
      </div>
      
      <div className="canvas-wrapper">
        <Stage
          width={window.innerWidth}
          height={window.innerHeight - 100}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
          ref={stageRef}
          position={stagePos}
          scale={{ x: stageScale, y: stageScale }}
        >
          <Layer ref={layerRef}>
            {lines.map((line, i) => (
              <Line
                key={line.id}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
                onClick={() => handleSelect(line.id, 'line')}
                onTap={() => handleSelect(line.id, 'line')}
                perfectDrawEnabled={false}
              />
            ))}
            
            {images.map((img) => {
              return (
                <Image
                  key={img.id}
                  id={img.id}
                  image={new window.Image()}
                  x={img.x}
                  y={img.y}
                  width={img.width}
                  height={img.height}
                  scaleX={img.scaleX}
                  scaleY={img.scaleY}
                  rotation={img.rotation}
                  draggable={tool === 'select'}
                  onClick={() => handleSelect(img.id, 'image')}
                  onTap={() => handleSelect(img.id, 'image')}
                  onDragEnd={(e) => handleTransform(e, img.id, 'image')}
                  onTransformEnd={(e) => handleTransform(e, img.id, 'image')}
                  ref={(node) => {
                    if (node && !node.getAttr('imageLoaded')) {
                      const imageObj = new window.Image();
                      imageObj.src = img.image;
                      imageObj.onload = () => {
                        node.setAttr('image', imageObj);
                        node.setAttr('imageLoaded', true);
                        layerRef.current.batchDraw();
                      };
                    }
                  }}
                />
              );
            })}
            
            {selectedId && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit resize
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
                onTransformEnd={(e) => {
                  if (selectedId.type === 'image') {
                    handleTransform(e, selectedId.id, 'image');
                  }
                }}
                attachTo={{
                  node: stageRef.current?.findOne(`#${selectedId.id}`),
                }}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default Canvas;