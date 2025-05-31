const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();

// CORS configuration for production and development
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL || 'https://your-app-name.onrender.com'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.31.158:3000', 'http://192.168.31.158:3001'],
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('RTC Whiteboard Server is running!');
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('element-update', (data) => {
    console.log('Received element-update:', data.type, data.userId);
    if (data.type === 'test') {
      console.log('🧪 Test message received:', data.message);
    }
    socket.broadcast.emit('element-update', data);
  });
  
  socket.on('page-change', (data) => {
    console.log('Received page-change from user:', data.userId);
    socket.broadcast.emit('page-change', data);
  });
  
  socket.on('ping', () => {
    socket.emit('pong');
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});