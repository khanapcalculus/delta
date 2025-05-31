# RTC Whiteboard

A real-time collaborative whiteboard application built with React, Konva, and Socket.IO.

## Features

- ✨ Real-time collaboration
- 🎨 Multiple drawing tools (pen, eraser, shapes)
- 📱 Mobile-friendly
- 🔄 Multi-page support
- ↩️ Undo/Redo functionality
- 🖼️ Image upload support
- 🔧 Transform tool for resizing and rotating

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/khanapcalculus/lccpi.git
cd lccpi
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run dev-full
```

This will start both the React development server (port 3000) and the Socket.IO server (port 5000).

## Deployment on Render.com

### Automatic Deployment

1. Fork this repository to your GitHub account
2. Connect your GitHub account to Render.com
3. Create a new Web Service
4. Select this repository
5. Use these settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
   - **Plan**: Free (or higher)

### Manual Deployment

1. Push your code to GitHub
2. In Render.com dashboard:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `rtc-whiteboard`
     - Environment: `Node`
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
     - Auto-Deploy: Yes

### Environment Variables

Set these environment variables in Render.com:
- `NODE_ENV`: `production`
- `CLIENT_URL`: Your Render app URL (e.g., `https://your-app-name.onrender.com`)

## Technology Stack

- **Frontend**: React, Konva, React-Konva
- **Backend**: Node.js, Express, Socket.IO
- **Real-time Communication**: WebSockets
- **Deployment**: Render.com

## License

MIT License
