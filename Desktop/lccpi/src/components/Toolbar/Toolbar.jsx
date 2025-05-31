import React, { useContext, useEffect, useRef, useState } from 'react';
import { WhiteboardContext } from '../../context/WhiteboardContext';
import { getSocket } from '../../services/socket';
import ImageTool from '../../tools/ImageTool';
import ColorPalette from '../ColorPalette/ColorPalette.jsx';
import StrokePalette from '../StrokePalette/StrokePalette.jsx';
import './Toolbar.css';

const Toolbar = () => {
  const context = useContext(WhiteboardContext);
  const { 
    tool, 
    setTool, 
    clearPage, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = context;
  
  const fileInputRef = useRef(null);
  const toolInstances = useRef({});
  const [socketConnected, setSocketConnected] = useState(false);
  
  useEffect(() => {
    toolInstances.current = {
      image: new ImageTool(context)
    };
  }, [context]);
  
  useEffect(() => {
    const socket = getSocket();
    
    const updateConnectionStatus = () => {
      setSocketConnected(socket.connected);
    };
    
    socket.on('connect', updateConnectionStatus);
    socket.on('disconnect', updateConnectionStatus);
    socket.on('reconnect', updateConnectionStatus);
    
    // Initial status
    updateConnectionStatus();
    
    return () => {
      socket.off('connect', updateConnectionStatus);
      socket.off('disconnect', updateConnectionStatus);
      socket.off('reconnect', updateConnectionStatus);
    };
  }, []);
  
  const testSocketConnection = () => {
    const socket = getSocket();
    console.log('🧪 Testing socket connection...');
    console.log('Socket connected?', socket.connected);
    console.log('Socket ID:', socket.id);
    
    if (socket.connected) {
      // Test emit
      socket.emit('element-update', {
        type: 'test',
        message: 'Test message from client',
        timestamp: Date.now(),
        userId: 'test-user'
      });
      console.log('✅ Test message emitted');
    } else {
      console.error('❌ Socket not connected');
    }
  };
  
  const handleImageUpload = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageToolInstance = toolInstances.current.image;
      if (imageToolInstance) {
        imageToolInstance.uploadImage(file);
      }
      // Reset file input
      e.target.value = null;
    }
  };
  
  return (
    <div className="toolbar">
      <div className="tool-group">
        <div 
          className="connection-status"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '5px 10px',
            backgroundColor: socketConnected ? '#28a745' : '#dc3545',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            marginRight: '10px'
          }}
        >
          <div 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'white',
              marginRight: '5px'
            }}
          />
          {socketConnected ? 'RTC Connected' : 'RTC Disconnected'}
        </div>
      </div>
      
      <div className="tool-group">
        <button 
          className={`tool-button ${tool === 'pen' ? 'active' : ''}`}
          onClick={() => {
            console.log('Toolbar: Setting tool to pen');
            setTool('pen');
          }}
          title="Pen"
        >
          <i className="fas fa-pen"></i>
        </button>
        
        <button 
          className={`tool-button ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => {
            console.log('Toolbar: Setting tool to eraser');
            setTool('eraser');
          }}
          title="Eraser"
        >
          <i className="fas fa-eraser"></i>
        </button>
        
        <button 
          className={`tool-button ${tool === 'rectangle' ? 'active' : ''}`}
          onClick={() => {
            console.log('Toolbar: Setting tool to rectangle');
            setTool('rectangle');
          }}
          title="Rectangle"
        >
          <i className="fas fa-square"></i>
        </button>
        
        <button 
          className={`tool-button ${tool === 'circle' ? 'active' : ''}`}
          onClick={() => setTool('circle')}
          title="Circle"
        >
          <i className="fas fa-circle"></i>
        </button>
        
        <button 
          className={`tool-button ${tool === 'line' ? 'active' : ''}`}
          onClick={() => setTool('line')}
          title="Line"
        >
          <i className="fas fa-slash"></i>
        </button>
        
        <button 
          className={`tool-button ${tool === 'transform' ? 'active' : ''}`}
          onClick={() => setTool('transform')}
          title="Transform"
        >
          <i className="fas fa-arrows-alt"></i>
        </button>
        
        <button 
          className={`tool-button ${tool === 'pan' ? 'active' : ''}`}
          onClick={() => setTool('pan')}
          title="Pan"
        >
          <i className="fas fa-hand-paper"></i>
        </button>
        
        <button 
          className="tool-button"
          onClick={handleImageUpload}
          title="Upload Image"
        >
          <i className="fas fa-image"></i>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </div>
      
      <div className="tool-group">
        <ColorPalette />
        <StrokePalette />
      </div>
      
      <div className="tool-group">
        <button 
          className="tool-button"
          onClick={undo}
          disabled={!canUndo}
          title="Undo"
        >
          <i className="fas fa-undo"></i>
        </button>
        
        <button 
          className="tool-button"
          onClick={redo}
          disabled={!canRedo}
          title="Redo"
        >
          <i className="fas fa-redo"></i>
        </button>
        
        <button 
          className="tool-button"
          onClick={clearPage}
          title="Clear Page"
        >
          <i className="fas fa-trash"></i>
        </button>
        
        <button 
          className="tool-button"
          onClick={testSocketConnection}
          title="Test Socket Connection"
          style={{ backgroundColor: '#007bff', color: 'white' }}
        >
          🧪 Test RTC
        </button>
      </div>
    </div>
  );
};

export default Toolbar;