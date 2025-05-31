import React, { createContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getSocket } from '../services/socket';

export const WhiteboardContext = createContext();

export const WhiteboardProvider = ({ children }) => {
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [history, setHistory] = useState([{ pages: { 1: [] }, currentPage: 1 }]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState({ 1: [] });
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const socket = useRef(null);
  const userId = useRef(uuidv4());

  useEffect(() => {
    console.log('WhiteboardContext: Initializing socket connection...');
    let keepAliveInterval;
    
    try {
      socket.current = getSocket();
      
      if (!socket.current) {
        console.error('WhiteboardContext: Failed to get socket instance');
        return;
      }
      
      console.log('WhiteboardContext: Socket instance created:', socket.current);
      
      socket.current.on('connect', () => {
        console.log('WhiteboardContext: Connected to server with ID:', socket.current.id);
        console.log('WhiteboardContext: Socket connected successfully!');
      });

      socket.current.on('connect_error', (error) => {
        console.error('WhiteboardContext: Socket connection error:', error);
        console.error('WhiteboardContext: Error details:', error.message);
        console.error('WhiteboardContext: Error type:', error.type);
      });

      socket.current.on('disconnect', (reason) => {
        console.log('WhiteboardContext: Socket disconnected:', reason);
      });

      socket.current.on('element-update', (data) => {
        console.log('WhiteboardContext: Received element-update:', data);
        if (data.userId !== userId.current) {
          console.log('WhiteboardContext: Processing element update from another user');
          updateElementsFromSocket(data);
        } else {
          console.log('WhiteboardContext: Ignoring own element update');
        }
      });

      socket.current.on('page-change', (data) => {
        console.log('WhiteboardContext: Received page-change:', data);
        if (data.userId !== userId.current) {
          console.log('WhiteboardContext: Processing page change from another user');
          // Only update the pages data, don't force current user to change pages
          setPages(prevPages => {
            const updatedPages = { ...prevPages };
            // Merge the received pages with existing pages
            Object.keys(data.pages).forEach(pageNum => {
              updatedPages[pageNum] = data.pages[pageNum];
            });
            return updatedPages;
          });
        } else {
          console.log('WhiteboardContext: Ignoring own page change');
        }
      });

      // Keep-alive ping for mobile devices
      keepAliveInterval = setInterval(() => {
        if (socket.current && socket.current.connected) {
          socket.current.emit('ping');
        }
      }, 25000); // Ping every 25 seconds

      // Test socket connection with more detailed logging
      setTimeout(() => {
        if (socket.current) {
          console.log('WhiteboardContext: Socket connection test...');
          console.log('WhiteboardContext: Socket exists?', !!socket.current);
          console.log('WhiteboardContext: Socket connected?', socket.current.connected);
          console.log('WhiteboardContext: Socket ID:', socket.current.id);
          console.log('WhiteboardContext: User ID:', userId.current);
          
          if (socket.current.connected) {
            console.log('WhiteboardContext: Socket connection test - ✅ CONNECTED');
          } else {
            console.error('WhiteboardContext: Socket connection test - ❌ NOT CONNECTED');
            console.log('WhiteboardContext: Attempting to reconnect...');
            socket.current.connect();
          }
        } else {
          console.error('WhiteboardContext: Socket instance is null');
        }
      }, 2000);
      
    } catch (error) {
      console.error('WhiteboardContext: Error initializing socket:', error);
    }

    return () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
      if (socket.current) {
        console.log('WhiteboardContext: Disconnecting socket...');
        socket.current.disconnect();
      }
    };
  }, []);

  const updateElementsFromSocket = (data) => {
    console.log('WhiteboardContext: updateElementsFromSocket called with:', data);
    
    if (data.type === 'add') {
      setPages(prevPages => {
        const updatedPages = { ...prevPages };
        // Ensure the page exists
        if (!updatedPages[data.page]) {
          updatedPages[data.page] = [];
        }
        // Check if element already exists on this page to prevent duplicates
        const elementExists = updatedPages[data.page].some(el => el.id === data.element.id);
        if (!elementExists) {
          updatedPages[data.page] = [...updatedPages[data.page], data.element];
          console.log('WhiteboardContext: Added element to page', data.page);
        } else {
          console.log('WhiteboardContext: Element already exists on page', data.page, 'skipping add');
        }
        return updatedPages;
      });
    } else if (data.type === 'update') {
      setPages(prevPages => {
        const updatedPages = { ...prevPages };
        // Ensure the page exists
        if (!updatedPages[data.page]) {
          updatedPages[data.page] = [];
        }
        // Only update if element exists on this page
        const elementIndex = updatedPages[data.page].findIndex(el => el.id === data.element.id);
        if (elementIndex !== -1) {
          updatedPages[data.page] = updatedPages[data.page].map(el => 
            el.id === data.element.id ? data.element : el
          );
          console.log('WhiteboardContext: Updated element on page', data.page);
        } else {
          console.log('WhiteboardContext: Element not found on page', data.page, 'for update');
        }
        return updatedPages;
      });
    } else if (data.type === 'delete') {
      setPages(prevPages => {
        const updatedPages = { ...prevPages };
        if (updatedPages[data.page]) {
          updatedPages[data.page] = updatedPages[data.page].filter(el => el.id !== data.elementId);
          console.log('WhiteboardContext: Deleted element from page', data.page);
        }
        return updatedPages;
      });
    } else if (data.type === 'clear') {
      setPages(prevPages => {
        const updatedPages = { ...prevPages };
        if (updatedPages[data.page]) {
          updatedPages[data.page] = [];
          console.log('WhiteboardContext: Cleared page', data.page);
        }
        return updatedPages;
      });
    }
  };

  const addElement = (element) => {
    console.log('WhiteboardContext: addElement called with:', element);
    const newElement = { ...element, id: uuidv4() };
    console.log('WhiteboardContext: Created new element with ID:', newElement.id);
    
    setPages(prevPages => {
      const updatedPages = { ...prevPages };
      
      // Ensure current page exists
      if (!updatedPages[currentPage]) {
        updatedPages[currentPage] = [];
      }
      
      // Check if element with same ID already exists (shouldn't happen with uuidv4, but safety check)
      const elementExists = updatedPages[currentPage].some(el => el.id === newElement.id);
      if (!elementExists) {
        updatedPages[currentPage] = [...updatedPages[currentPage], newElement];
        console.log('WhiteboardContext: Added element to current page:', currentPage);
      } else {
        console.log('WhiteboardContext: Element with same ID already exists, skipping add');
        return prevPages; // Return unchanged if duplicate
      }
      
      console.log('WhiteboardContext: Updated pages:', updatedPages);
      
      // Add to history
      const newHistory = [...history.slice(0, historyIndex + 1), {
        pages: updatedPages,
        currentPage
      }];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      // Emit to socket
      if (socket.current) {
        console.log('WhiteboardContext: Emitting element-update to socket');
        console.log('WhiteboardContext: Socket connected?', socket.current.connected);
        console.log('WhiteboardContext: Emitting data:', {
          type: 'add',
          page: currentPage,
          element: newElement,
          userId: userId.current
        });
        socket.current.emit('element-update', {
          type: 'add',
          page: currentPage,
          element: newElement,
          userId: userId.current
        });
        console.log('WhiteboardContext: Element-update emitted successfully');
      } else {
        console.error('WhiteboardContext: Socket not available for emit');
      }
      
      return updatedPages;
    });
    
    // Return the new element with ID
    return newElement;
  };

  const updateElement = (updatedElement) => {
    console.log('WhiteboardContext: updateElement called with:', updatedElement);
    setPages(prevPages => {
      const updatedPages = { ...prevPages };
      const oldElement = updatedPages[currentPage].find(el => el.id === updatedElement.id);
      console.log('WhiteboardContext: updating element from:', oldElement, 'to:', updatedElement);
      
      updatedPages[currentPage] = updatedPages[currentPage].map(el => 
        el.id === updatedElement.id ? updatedElement : el
      );
      
      console.log('WhiteboardContext: updated pages:', updatedPages);
      
      // Don't add to history during drawing - only when drawing is complete
      
      // Emit to socket
      if (socket.current && socket.current.connected) {
        console.log('WhiteboardContext: Emitting element update to socket:', updatedElement.id);
        socket.current.emit('element-update', {
          type: 'update',
          page: currentPage,
          element: updatedElement,
          userId: userId.current
        });
      } else {
        console.error('WhiteboardContext: Socket not connected for element update');
      }
      
      return updatedPages;
    });
  };

  // Add to history when an action is complete (like finishing a drawing)
  const saveToHistory = () => {
    const newHistory = [...history.slice(0, historyIndex + 1), {
      pages: { ...pages },
      currentPage
    }];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    console.log('WhiteboardContext: Saved to history, index:', newHistory.length - 1);
  };

  const deleteElement = (elementId) => {
    setPages(prevPages => {
      const updatedPages = { ...prevPages };
      updatedPages[currentPage] = updatedPages[currentPage].filter(el => el.id !== elementId);
      
      // Add to history
      const newHistory = [...history.slice(0, historyIndex + 1), {
        pages: updatedPages,
        currentPage
      }];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      // Emit to socket
      socket.current.emit('element-update', {
        type: 'delete',
        page: currentPage,
        elementId,
        userId: userId.current
      });
      
      return updatedPages;
    });
  };

  const clearPage = () => {
    setPages(prevPages => {
      const updatedPages = { ...prevPages };
      updatedPages[currentPage] = [];
      
      // Add to history
      const newHistory = [...history.slice(0, historyIndex + 1), {
        pages: updatedPages,
        currentPage
      }];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      // Emit to socket
      socket.current.emit('element-update', {
        type: 'clear',
        page: currentPage,
        userId: userId.current
      });
      
      return updatedPages;
    });
  };

  const changePage = (pageNumber) => {
    console.log('WhiteboardContext: changing page from', currentPage, 'to', pageNumber);
    console.log('WhiteboardContext: current page elements before change:', pages[currentPage]);
    console.log('WhiteboardContext: target page elements before change:', pages[pageNumber]);
    
    // Clear selected element when changing pages
    setSelectedElement(null);
    
    if (!pages[pageNumber]) {
      setPages(prevPages => {
        const updatedPages = { ...prevPages, [pageNumber]: [] };
        
        // Emit to socket
        socket.current.emit('page-change', {
          pages: updatedPages,
          userId: userId.current
        });
        
        return updatedPages;
      });
    }
    
    setCurrentPage(pageNumber);
    
    // Log elements after page change
    setTimeout(() => {
      console.log('WhiteboardContext: elements after page change:', pages[pageNumber]);
    }, 100);
  };

  const undo = () => {
    console.log('WhiteboardContext: undo called, historyIndex:', historyIndex, 'history length:', history.length);
    if (historyIndex > 0) {
      // Clear selected element before undo
      setSelectedElement(null);
      
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevState = history[newIndex];
      console.log('WhiteboardContext: undoing to state:', prevState);
      setPages(prevState.pages);
      setCurrentPage(prevState.currentPage);
      
      // Emit to socket
      socket.current.emit('page-change', {
        pages: prevState.pages,
        userId: userId.current
      });
    } else {
      console.log('WhiteboardContext: cannot undo, at beginning of history');
    }
  };

  const redo = () => {
    console.log('WhiteboardContext: redo called, historyIndex:', historyIndex, 'history length:', history.length);
    if (historyIndex < history.length - 1) {
      // Clear selected element before redo
      setSelectedElement(null);
      
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextState = history[newIndex];
      console.log('WhiteboardContext: redoing to state:', nextState);
      setPages(nextState.pages);
      setCurrentPage(nextState.currentPage);
      
      // Emit to socket
      socket.current.emit('page-change', {
        pages: nextState.pages,
        userId: userId.current
      });
    } else {
      console.log('WhiteboardContext: cannot redo, at end of history');
    }
  };

  return (
    <WhiteboardContext.Provider
      value={{
        tool,
        setTool,
        color,
        setColor,
        strokeWidth,
        setStrokeWidth,
        elements: pages[currentPage] || [],
        addElement,
        updateElement,
        deleteElement,
        clearPage,
        currentPage,
        changePage,
        pages,
        undo,
        redo,
        saveToHistory,
        isDrawing,
        setIsDrawing,
        selectedElement,
        setSelectedElement,
        scale,
        setScale,
        position,
        setPosition,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1
      }}
    >
      {children}
    </WhiteboardContext.Provider>
  );
};