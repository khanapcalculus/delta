import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-render-domain.onrender.com' 
  : 'http://localhost:5000';

let socket;

export const initSocket = () => {
  socket = io(SOCKET_URL);
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};