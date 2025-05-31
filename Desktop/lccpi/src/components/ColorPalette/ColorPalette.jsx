import React, { useState, useContext, useRef, useEffect } from 'react';
import { WhiteboardContext } from '../../context/WhiteboardContext';
import './ColorPalette.css';

const ColorPalette = () => {
  const { color, setColor } = useContext(WhiteboardContext);
  const [isOpen, setIsOpen] = useState(false);
  const paletteRef = useRef(null);
  
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF',
    '#FFA500', '#800080', '#008000', '#800000',
    '#808080', '#A52A2A', '#FFC0CB', '#FFD700'
  ];
  
  const handleColorClick = (selectedColor) => {
    setColor(selectedColor);
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
    <div className="color-palette-container" ref={paletteRef}>
      <button 
        className="color-button"
        onClick={togglePalette}
        style={{ backgroundColor: color }}
      >
        <span className="color-indicator" style={{ backgroundColor: color }}></span>
      </button>
      
      {isOpen && (
        <div className="color-grid">
          {colors.map((c, index) => (
            <div 
              key={index}
              className="color-option"
              style={{ backgroundColor: c }}
              onClick={() => handleColorClick(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPalette;