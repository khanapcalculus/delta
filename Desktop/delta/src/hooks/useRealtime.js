import { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';

export const useRealtime = (onStateUpdate) => {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const socket = getSocket();
    
    socket.on('connect', () => {
      setIsConnected(true);
    });
    
    socket.on('disconnect', () => {
      setIsConnected(false);
    });
    
    socket.on('initialState', (state) => {
      onStateUpdate(state);
    });
    
    socket.on('objectAdded', (data) => {
      onStateUpdate((prevState) => {
        const newState = { ...prevState };
        if (!newState.pages[data.pageId]) {
          newState.pages[data.pageId] = { objects: [], background: 'white' };
        }
        newState.pages[data.pageId].objects.push(data.object);
        return newState;
      });
    });
    
    socket.on('objectModified', (data) => {
      onStateUpdate((prevState) => {
        const newState = { ...prevState };
        if (newState.pages[data.pageId]) {
          const index = newState.pages[data.pageId].objects.findIndex(obj => obj.id === data.object.id);
          if (index !== -1) {
            newState.pages[data.pageId].objects[index] = data.object;
          }
        }
        return newState;
      });
    });
    
    socket.on('objectRemoved', (data) => {
      onStateUpdate((prevState) => {
        const newState = { ...prevState };
        if (newState.pages[data.pageId]) {
          newState.pages[data.pageId].objects = newState.pages[data.pageId].objects.filter(
            obj => obj.id !== data.objectId
          );
        }
        return newState;
      });
    });
    
    socket.on('clearPage', (pageId) => {
      onStateUpdate((prevState) => {
        const newState = { ...prevState };
        if (newState.pages[pageId]) {
          newState.pages[pageId].objects = [];
        }
        return newState;
      });
    });
    
    socket.on('addPage', (pageId) => {
      onStateUpdate((prevState) => {
        const newState = { ...prevState };
        if (!newState.pages[pageId]) {
          newState.pages[pageId] = { objects: [], background: 'white' };
        }
        return newState;
      });
    });
    
    socket.on('changePage', (pageId) => {
      onStateUpdate((prevState) => ({
        ...prevState,
        currentPage: pageId
      }));
    });
    
    socket.on('updateState', ({ pageId, state }) => {
      onStateUpdate((prevState) => {
        const newState = { ...prevState };
        newState.pages[pageId] = state;
        return newState;
      });
    });
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('initialState');
      socket.off('objectAdded');
      socket.off('objectModified');
      socket.off('objectRemoved');
      socket.off('clearPage');
      socket.off('addPage');
      socket.off('changePage');
      socket.off('updateState');
    };
  }, [onStateUpdate]);
  
  const emitObjectAdded = (pageId, object) => {
    const socket = getSocket();
    socket.emit('objectAdded', { pageId, object });
  };
  
  const emitObjectModified = (pageId, object) => {
    const socket = getSocket();
    socket.emit('objectModified', { pageId, object });
  };
  
  const emitObjectRemoved = (pageId, objectId) => {
    const socket = getSocket();
    socket.emit('objectRemoved', { pageId, objectId });
  };
  
  const emitClearPage = (pageId) => {
    const socket = getSocket();
    socket.emit('clearPage', pageId);
  };
  
  const emitAddPage = (pageId) => {
    const socket = getSocket();
    socket.emit('addPage', pageId);
  };
  
  const emitChangePage = (pageId) => {
    const socket = getSocket();
    socket.emit('changePage', pageId);
  };
  
  const emitUndo = (pageId) => {
    const socket = getSocket();
    socket.emit('undo', pageId);
  };
  
  const emitRedo = (pageId) => {
    const socket = getSocket();
    socket.emit('redo', pageId);
  };
  
  return {
    isConnected,
    emitObjectAdded,
    emitObjectModified,
    emitObjectRemoved,
    emitClearPage,
    emitAddPage,
    emitChangePage,
    emitUndo,
    emitRedo
  };
};