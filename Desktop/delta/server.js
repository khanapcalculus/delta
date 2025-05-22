const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle any requests that don't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('canvas-data', (data) => {
    // Broadcast to all clients except the sender
    socket.broadcast.emit('canvas-data', data);
  });
  
  socket.on('page-change', (pageIndex) => {
    // Broadcast to all clients except the sender
    socket.broadcast.emit('page-change', pageIndex);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});