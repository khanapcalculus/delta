import React from 'react';
import './App.css';
import Canvas from './components/Canvas/Canvas.jsx';
import PageNavigation from './components/PageNavigation/PageNavigation.jsx';
import Toolbar from './components/Toolbar/Toolbar.jsx';
import { WhiteboardProvider } from './context/WhiteboardContext';

function App() {
  return (
    <WhiteboardProvider>
      <div className="App">
        <Toolbar />
        <Canvas />
        <PageNavigation />
      </div>
    </WhiteboardProvider>
  );
}

export default App;
