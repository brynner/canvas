import React, { useRef } from 'react';
import AnnotationCanvas from './components/AnnotationCanvas';
import './App.css';

const App = () => {
    const fabricCanvasRef = useRef(null);

    return (
        <div className="app">
            <AnnotationCanvas ref={fabricCanvasRef} />
        </div>
    );
};

export default App;