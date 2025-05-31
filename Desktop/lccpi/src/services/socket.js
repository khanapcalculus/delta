import { io } from 'socket.io-client';

let socket;

export const initSocket = () => {
  const serverUrl = process.env.NODE_ENV === 'production' 
    ? window.location.origin  // Use same origin in production
    : 'http://192.168.31.158:5000';
    
  console.log('Initializing socket connection to:', serverUrl);
    
  socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: 10,
    randomizationFactor: 0.5,
    upgrade: true,
    rememberUpgrade: true
  });
  
  socket.on('connect', () => {
    console.log('✅ Socket connected successfully:', socket.id);
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
    console.error('Error details:', error.message);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server disconnected, try to reconnect
      socket.connect();
    }
  });
  
  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
  });
  
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('🔄 Reconnection attempt:', attemptNumber);
  });
  
  socket.on('reconnect_error', (error) => {
    console.error('❌ Reconnection error:', error);
  });
  
  socket.on('reconnect_failed', () => {
    console.error('❌ Failed to reconnect after maximum attempts');
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket || socket.disconnected) {
    console.log('No existing socket or socket disconnected, creating new one...');
    return initSocket();
  }
  console.log('Returning existing socket:', socket.id);
  return socket;
};