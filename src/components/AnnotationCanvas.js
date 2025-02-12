import React, { useEffect, useRef, useState } from 'react';

import { fabric } from 'fabric';
import { FormControlLabel, Switch, Slider, AppBar, Toolbar, Box, Tooltip, IconButton } from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import ExportIcon from '@mui/icons-material/GetApp';
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal';
import { HuePicker } from 'react-color';

const AnnotationCanvas = () => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [brushSize, setBrushSize] = useState(5);
  const [mode, setMode] = useState('brush'); // 'brush' or 'polygon'
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current);

      // Initialize canvas settings
      fabricCanvasRef.current.isDrawingMode = true;
      if (fabricCanvasRef.current.freeDrawingBrush) {
        fabricCanvasRef.current.freeDrawingBrush.color = 'red';
        fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
      }

      // Save initial state
      setHistory([fabricCanvasRef.current.toJSON()]);

      // Add event listener to save state after each drawing
      fabricCanvasRef.current.on('path:created', () => {
        setHistory((prevHistory) => [...prevHistory, fabricCanvasRef.current.toJSON()]);
      });

      console.log('Canvas initialized:', fabricCanvasRef.current);
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [brushSize]);

  useEffect(() => {
    const handleResize = () => {
      console.log('Resizing canvas...');
      if (fabricCanvasRef.current) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        fabricCanvasRef.current.setWidth(screenWidth);
        fabricCanvasRef.current.setHeight(screenHeight - 66);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleMode = () => {
    if (mode === 'brush') {
      setMode('polygon');
      fabricCanvasRef.current.isDrawingMode = false;
    } else {
      setMode('brush');
      fabricCanvasRef.current.isDrawingMode = true;
      // Ensure brush settings are reapplied
      if (fabricCanvasRef.current.freeDrawingBrush) {
        fabricCanvasRef.current.freeDrawingBrush.color = 'red';
        fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
      }
    }
  };

  const handleBrushSizeChange = (event, newValue) => {
    setBrushSize(newValue);
    if (fabricCanvasRef.current.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.width = newValue;
    }
  };

  const handleUndo = () => {
    if (history.length > 1) {
      history.pop();
      const previousState = history[history.length - 1];
      fabricCanvasRef.current.loadFromJSON(previousState, fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current));
    }
  };

  const handleEraser = () => {
    fabricCanvasRef.current.isDrawingMode = false;
    fabricCanvasRef.current.on('mouse:down', (opt) => {
      const target = fabricCanvasRef.current.findTarget(opt.e);
      if (target) {
        fabricCanvasRef.current.remove(target);
      }
    });
  };

  const exportToCOCO = () => {
    const canvasJSON = fabricCanvasRef.current.toJSON();
    const cocoFormat = {
      images: [],
      annotations: [],
      categories: []
    };

    // Convert canvas JSON to COCO format
    canvasJSON.objects.forEach((obj, index) => {
      cocoFormat.annotations.push({
        id: index + 1,
        image_id: 1,
        category_id: 1,
        segmentation: [],
        area: obj.width * obj.height,
        bbox: [obj.left, obj.top, obj.width, obj.height],
        iscrowd: 0
      });
    });

    cocoFormat.images.push({
      id: 1,
      width: fabricCanvasRef.current.width,
      height: fabricCanvasRef.current.height,
      file_name: 'canvas.png'
    });

    cocoFormat.categories.push({
      id: 1,
      name: 'annotation',
      supercategory: 'shape'
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cocoFormat));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "annotations.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };


  const [brushColor, setBrushColor] = useState('red');
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

  const handleColorChange = (color) => {
    setBrushColor(color.hex);
    if (fabricCanvasRef.current.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.color = color.hex;
    }
  };


  return (
    <>
      <canvas ref={canvasRef} />

      <AppBar position="fixed" style={{ top: 0, bottom: 'auto' }}>
        <Toolbar>
          
          <Tooltip title={`${mode === 'brush' ? 'Switch to Polygon Mode' : 'Switch to Brush Mode'}`}>
            <FormControlLabel
              control={
                <Switch
                  checked={mode === 'brush'}
                  onChange={toggleMode}
                  name="modeSwitch"
                  color="primary"
                />
              }
              label={`${mode === 'brush' ? 'Brush' : 'Polygon'}`}
            />
          </Tooltip>

          {mode === 'brush' && (
            <div className="brush-size-slider" style={{ display: 'flex', alignItems: 'center', width: '150px' }}>
              <Tooltip title="Brush Size">
                <Slider
                  value={brushSize}
                  onChange={handleBrushSizeChange}
                  aria-labelledby="brush-size-slider"
                  step={5}
                  min={1}
                  max={100}
                  sx={{ mr: 2 }}
                />
              </Tooltip>
            </div>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Box>
            <Tooltip title="Eraser">
              <IconButton
                size="small"
                edge="start"
                color="inherit"
                sx={{ mr: 2 }}
                onClick={handleEraser}
              >
                <AutoFixNormalIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Undo">
              <IconButton
                size="small"
                edge="start"
                color="inherit"
                sx={{ mr: 2 }}
                onClick={handleUndo}
              >
                <UndoIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Export">
              <IconButton
                size="small"
                edge="start"
                color="inherit"
                sx={{ mr: 2 }}
                onClick={exportToCOCO}
              >
                <ExportIcon />
              </IconButton>
            </Tooltip>

          </Box>

        </Toolbar>

      </AppBar>

      <div >
        <HuePicker color={brushColor} onChange={handleColorChange} size="small" />
      </div>


    </>
  );
};

export default AnnotationCanvas;