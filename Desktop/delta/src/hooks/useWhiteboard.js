import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRealtime } from './useRealtime';

export const useWhiteboard = () => {
  const [whiteboardState, setWhiteboardState] = useState({
    pages: {
      'page-1': {
        objects: [],
        background: 'white'
      }
    },
    currentPage: 'page-1'
  });
  
  const [tool, setTool] = useState('select');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  
  const lineRef = useRef(null);
  const stageRef = useRef(null);
  
  const {
    isConnected,
    emitObjectAdded,
    emitObjectModified,
    emitObjectRemoved,
    emitClearPage,
    emitAddPage,
    emitChangePage,
    emitUndo,
    emitRedo
  } = useRealtime(setWhiteboardState);
  
  const getCurrentPageId = useCallback(() => whiteboardState.currentPage, [whiteboardState.currentPage]);
  
  const getCurrentPageObjects = useCallback(() => {
    const pageId = getCurrentPageId();
    return whiteboardState.pages[pageId]?.objects || [];
  }, [whiteboardState.pages, getCurrentPageId]);
  
  const handleMouseDown = useCallback((e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const pageId = getCurrentPageId();
    
    // Adjust position based on stage position and scale
    const adjustedPos = {
      x: (pos.x - stagePos.x) / stageScale,
      y: (pos.y - stagePos.y) / stageScale
    };
    
    if (tool === 'pan') {
      setIsPanning(true);
      return;
    }
    
    if (tool === 'select') {
      // Deselect when clicking on empty area
      setSelectedObject(null);
      return;
    }
    
    if (tool === 'pen') {
      setIsDrawing(true);
      const newLine = {
        id: uuidv4(),
        tool: 'pen',
        points: [adjustedPos.x, adjustedPos.y],
        stroke: color,
        strokeWidth: strokeWidth,
        lineCap: 'round',
        lineJoin: 'round',
        tension: 0.5
      };
      
      lineRef.current = newLine;
      
      setWhiteboardState(prevState => {
        const newState = { ...prevState };
        if (!newState.pages[pageId]) {
          newState.pages[pageId] = { objects: [], background: 'white' };
        }
        newState.pages[pageId].objects = [...newState.pages[pageId].objects, newLine];
        return newState;
      });
    }
  }, [tool, color, strokeWidth, getCurrentPageId, stagePos, stageScale]);
  
  const handleMouseMove = useCallback((e) => {
    if (!isDrawing && !isPanning) return;
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const pageId = getCurrentPageId();
    
    if (isPanning) {
      // Handle panning
      const dx = pos.x - stage.getPointerPosition().x;
      const dy = pos.y - stage.getPointerPosition().y;
      
      setStagePos({
        x: stagePos.x - dx,
        y: stagePos.y - dy
      });
      return;
    }
    
    if (tool === 'pen' && isDrawing) {
      // Adjust position based on stage position and scale
      const adjustedPos = {
        x: (pos.x - stagePos.x) / stageScale,
        y: (pos.y - stagePos.y) / stageScale
      };
      
      const newPoints = [...lineRef.current.points, adjustedPos.x, adjustedPos.y];
      
      setWhiteboardState(prevState => {
        const newState = { ...prevState };
        const objects = [...newState.pages[pageId].objects];
        const index = objects.findIndex(obj => obj.id === lineRef.current.id);
        
        if (index !== -1) {
          objects[index] = {
            ...objects[index],
            points: newPoints
          };
          newState.pages[pageId].objects = objects;
        }
        
        return newState;
      });
      
      lineRef.current.points = newPoints;
    }
  }, [isDrawing, isPanning, tool, getCurrentPageId, stagePos, stageScale]);
  
  const handleMouseUp = useCallback(() => {
    const pageId = getCurrentPageId();
    
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (isDrawing && tool === 'pen') {
      setIsDrawing(false);
      
      if (lineRef.current) {
        // Emit the new object to other clients
        emitObjectAdded(pageId, lineRef.current);
        lineRef.current = null;
      }
    }
  }, [isDrawing, isPanning, tool, getCurrentPageId, emitObjectAdded]);
  
  const handleObjectSelect = useCallback((object) => {
    setSelectedObject(object);
  }, []);
  
  const handleObjectModify = useCallback((modifiedObject) => {
    const pageId = getCurrentPageId();
    
    setWhiteboardState(prevState => {
      const newState = { ...prevState };
      const objects = [...newState.pages[pageId].objects];
      const index = objects.findIndex(obj => obj.id === modifiedObject.id);
      
      if (index !== -1) {
        objects[index] = modifiedObject;
        newState.pages[pageId].objects = objects;
      }
      
      return newState;
    });
    
    // Emit the modified object to other clients
    emitObjectModified(pageId, modifiedObject);
  }, [getCurrentPageId, emitObjectModified]);
  
  const handleDeleteSelected = useCallback(() => {
    if (!selectedObject) return;
    
    const pageId = getCurrentPageId();
    
    setWhiteboardState(prevState => {
      const newState = { ...prevState };
      newState.pages[pageId].objects = newState.pages[pageId].objects.filter(
        obj => obj.id !== selectedObject.id
      );
      return newState;
    });
    
    // Emit the deleted object to other clients
    emitObjectRemoved(pageId, selectedObject.id);
    setSelectedObject(null);
  }, [selectedObject, getCurrentPageId, emitObjectRemoved]);
  
  const handleClearPage = useCallback(() => {
    const pageId = getCurrentPageId();
    
    setWhiteboardState(prevState => {
      const newState = { ...prevState };
      if (newState.pages[pageId]) {
        newState.pages[pageId].objects = [];
      }
      return newState;
    });
    
    // Emit clear page to other clients
    emitClearPage(pageId);
    setSelectedObject(null);
  }, [getCurrentPageId, emitClearPage]);
  
  const handleAddPage = useCallback(() => {
    const newPageId = `page-${Object.keys(whiteboardState.pages).length + 1}`;
    
    setWhiteboardState(prevState => {
      const newState = { ...prevState };
      newState.pages[newPageId] = { objects: [], background: 'white' };
      newState.currentPage = newPageId;
      return newState;
    });
    
    // Emit add page to other clients
    emitAddPage(newPageId);
    emitChangePage(newPageId);
  }, [whiteboardState.pages, emitAddPage, emitChangePage]);
  
  const handleChangePage = useCallback((pageId) => {
    setWhiteboardState(prevState => ({
      ...prevState,
      currentPage: pageId
    }));
    
    // Emit change page to other clients
    emitChangePage(pageId);
  }, [emitChangePage]);
  
  const handleUndo = useCallback(() => {
    const pageId = getCurrentPageId();
    emitUndo(pageId);
  }, [getCurrentPageId, emitUndo]);
  
  const handleRedo = useCallback(() => {
    const pageId = getCurrentPageId();
    emitRedo(pageId);
  }, [getCurrentPageId, emitRedo]);
  
  const handleImageUpload = useCallback((imageUrl) => {
    const pageId = getCurrentPageId();
    const newImage = {
      id: uuidv4(),
      tool: 'image',
      src: imageUrl,
      x: 100,
      y: 100,
      width: 200,
      height: 200
    };
    
    setWhiteboardState(prevState => {
      const newState = { ...prevState };
      if (!newState.pages[pageId]) {
        newState.pages[pageId] = { objects: [], background: 'white' };
      }
      newState.pages[pageId].objects = [...newState.pages[pageId].objects, newImage];
      return newState;
    });
    
    // Emit the new object to other clients
    emitObjectAdded(pageId, newImage);
  }, [getCurrentPageId, emitObjectAdded]);
  
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale
    };
    
    // Zoom in/out
    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    
    // Limit scale
    const limitedScale = Math.max(0.1, Math.min(newScale, 5));
    
    setStageScale(limitedScale);
    
    // Adjust stage position to zoom towards mouse position
    const newPos = {
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale
    };
    
    setStagePos(newPos);
  }, [stageScale, stagePos]);
  
  const togglePalette = useCallback(() => {
    setIsPaletteOpen(!isPaletteOpen);
  }, [isPaletteOpen]);
  
  return {
    whiteboardState,
    tool,
    setTool,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    selectedObject,
    stagePos,
    stageScale,
    isPaletteOpen,
    isConnected,
    stageRef,
    getCurrentPageId,
    getCurrentPageObjects,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleObjectSelect,
    handleObjectModify,
    handleDeleteSelected,
    handleClearPage,
    handleAddPage,
    handleChangePage,
    handleUndo,
    handleRedo,
    handleImageUpload,
    handleWheel,
    togglePalette
  };
};