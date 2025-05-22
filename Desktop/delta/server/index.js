const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://your-render-domain.onrender.com' 
      : 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Store whiteboard state
let whiteboardState = {
  pages: {
    'page-1': {
      objects: [],
      background: 'white'
    }
  },
  currentPage: 'page-1'
};

// Store history for undo/redo
let history = {};
let historyPointer = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Send current state to new client
  socket.emit('initialState', whiteboardState);
  
  // Handle drawing events
  socket.on('objectAdded', (data) => {
    const { pageId, object } = data;
    
    if (!whiteboardState.pages[pageId]) {
      whiteboardState.pages[pageId] = { objects: [], background: 'white' };
    }
    
    whiteboardState.pages[pageId].objects.push(object);
    
    // Add to history
    if (!history[pageId]) {
      history[pageId] = [JSON.parse(JSON.stringify(whiteboardState.pages[pageId]))];
      historyPointer[pageId] = 0;
    } else {
      // Remove any future states if we're not at the end of history
      history[pageId] = history[pageId].slice(0, historyPointer[pageId] + 1);
      history[pageId].push(JSON.parse(JSON.stringify(whiteboardState.pages[pageId])));
      historyPointer[pageId] = history[pageId].length - 1;
    }
    
    // Broadcast to all other clients
    socket.broadcast.emit('objectAdded', data);
  });
  
  socket.on('objectModified', (data) => {
    const { pageId, object } = data;
    
    if (whiteboardState.pages[pageId]) {
      const index = whiteboardState.pages[pageId].objects.findIndex(obj => obj.id === object.id);
      if (index !== -1) {
        whiteboardState.pages[pageId].objects[index] = object;
        
        // Add to history
        history[pageId] = history[pageId].slice(0, historyPointer[pageId] + 1);
        history[pageId].push(JSON.parse(JSON.stringify(whiteboardState.pages[pageId])));
        historyPointer[pageId] = history[pageId].length - 1;
        
        // Broadcast to all other clients
        socket.broadcast.emit('objectModified', data);
      }
    }
  });
  
  socket.on('objectRemoved', (data) => {
    const { pageId, objectId } = data;
    
    if (whiteboardState.pages[pageId]) {
      whiteboardState.pages[pageId].objects = whiteboardState.pages[pageId].objects.filter(obj => obj.id !== objectId);
      
      // Add to history
      history[pageId] = history[pageId].slice(0, historyPointer[pageId] + 1);
      history[pageId].push(JSON.parse(JSON.stringify(whiteboardState.pages[pageId])));
      historyPointer[pageId] = history[pageId].length - 1;
      
      // Broadcast to all other clients
      socket.broadcast.emit('objectRemoved', data);
    }
  });
  
  socket.on('clearPage', (pageId) => {
    if (whiteboardState.pages[pageId]) {
      whiteboardState.pages[pageId].objects = [];
      
      // Add to history
      history[pageId] = history[pageId].slice(0, historyPointer[pageId] + 1);
      history[pageId].push(JSON.parse(JSON.stringify(whiteboardState.pages[pageId])));
      historyPointer[pageId] = history[pageId].length - 1;
      
      // Broadcast to all other clients
      socket.broadcast.emit('clearPage', pageId);
    }
  });
  
  socket.on('addPage', (pageId) => {
    if (!whiteboardState.pages[pageId]) {
      whiteboardState.pages[pageId] = { objects: [], background: 'white' };
      history[pageId] = [JSON.parse(JSON.stringify(whiteboardState.pages[pageId]))];
      historyPointer[pageId] = 0;
      
      // Broadcast to all other clients
      socket.broadcast.emit('addPage', pageId);
    }
  });
  
  socket.on('changePage', (pageId) => {
    whiteboardState.currentPage = pageId;
    socket.broadcast.emit('changePage', pageId);
  });
  
  socket.on('undo', (pageId) => {
    if (history[pageId] && historyPointer[pageId] > 0) {
      historyPointer[pageId]--;
      whiteboardState.pages[pageId] = JSON.parse(JSON.stringify(history[pageId][historyPointer[pageId]]));
      
      // Broadcast to all other clients
      io.emit('updateState', { pageId, state: whiteboardState.pages[pageId] });
    }
  });
  
  socket.on('redo', (pageId) => {
    if (history[pageId] && historyPointer[pageId] < history[pageId].length - 1) {
      historyPointer[pageId]++;
      whiteboardState.pages[pageId] = JSON.parse(JSON.stringify(history[pageId][historyPointer[pageId]]));
      
      // Broadcast to all other clients
      io.emit('updateState', { pageId, state: whiteboardState.pages[pageId] });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});