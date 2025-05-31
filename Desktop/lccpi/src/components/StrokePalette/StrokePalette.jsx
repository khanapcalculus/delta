import React, { useState, useContext, useRef, useEffect } from 'react';
import { WhiteboardContext } from '../../context/WhiteboardContext';
import './StrokePalette.css';

const StrokePalette = () => {
  const { strokeWidth, setStrokeWidth } = useContext(WhiteboardContext);
  const [isOpen, setIsOpen] = useState(false);
  const paletteRef = useRef(null);
  
  const strokeWidths = [
    1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32
  ];
  
  const handleStrokeClick = (selectedWidth) => {
    setStrokeWidth(selectedWidth);
    setIsOpen(false);
  };
  
  const togglePalette = () => {
    setIsOpen(!isOpen);
  };
  
  // Close palette when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (paletteRef.current && !paletteRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="stroke-palette-container" ref={paletteRef}>
      <button 
        className="stroke-button"
        onClick={togglePalette}
      >
        <div className="stroke-indicator" style={{ height: Math.min(strokeWidth, 20) }}></div>
      </button>
      
      {isOpen && (
        <div className="stroke-grid">
          {strokeWidths.map((width, index) => (
            <div 
              key={index}
              className="stroke-option"
              onClick={() => handleStrokeClick(width)}
            >
              <div 
                className="stroke-preview" 
                style={{ height: Math.min(width, 20) }}
              ></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StrokePalette;