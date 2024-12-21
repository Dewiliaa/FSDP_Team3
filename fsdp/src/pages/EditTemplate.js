import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { IoIosImage } from 'react-icons/io';
import AWS from '../aws-config';
import '../styles/edit.scss';

const s3 = new AWS.S3();

// Constants for resize handles
const HANDLE_SIZE = 8;
const RESIZE_HANDLES = ['nw', 'ne', 'se', 'sw'];

const DimensionModal = memo(({ dimensions, setDimensions, onSubmit }) => (
  <div className="dimension_modal">
    <form onSubmit={onSubmit}>
      <h2>Set Canvas Dimensions</h2>
      <label>
        Width:
        <input
          type="number"
          value={dimensions.width}
          onChange={(e) => setDimensions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
        />
      </label>
      <label>
        Height:
        <input
          type="number"
          value={dimensions.height}
          onChange={(e) => setDimensions(prev => ({ ...prev, height: parseInt(e.target.value) }))}
        />
      </label>
      <button type="submit">Create Canvas</button>
    </form>
  </div>
));

const Toolbar = memo(({ onAddShape, onImageUpload, newText, setNewText, onAddText, currentColor, setCurrentColor }) => (
  <div className="toolbar">
    <button onClick={() => onAddShape('rectangle')}>Add Rectangle</button>
    <button onClick={() => onAddShape('circle')}>Add Circle</button>
    <label>
      <IoIosImage /> Add Image
      <input type="file" accept="image/*" onChange={onImageUpload} />
    </label>
    <div className="text-tools">
      <input
        type="text"
        placeholder="Enter text"
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
      />
      <button onClick={onAddText}>Add Text</button>
    </div>
    <div className="color-picker">
      <label>
        Color:
        <input
          type="color"
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
        />
      </label>
    </div>
  </div>
));

const EditTemplate = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [showDimensionModal, setShowDimensionModal] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Use refs for mutable state
  const elementsRef = useRef({
    shapes: [],
    images: [],
    texts: []
  });
  
  const interactionStateRef = useRef({
    isMoving: false,
    isResizing: false,
    selectedElement: null,
    selectedHandle: null,
    startPos: { x: 0, y: 0 },
    originalElementState: null
  });

  const [newText, setNewText] = useState('');
  const [currentColor, setCurrentColor] = useState('#000000');

  // Initialize canvas
  const initializeCanvas = useCallback((width, height) => {
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctxRef.current = ctx;
    setShowDimensionModal(false);
  }, []);

  // Draw resize handles for selected element
  const drawResizeHandles = useCallback((element) => {
    const ctx = ctxRef.current;
    const { x, y, width: w, height: h } = element;
    
    ctx.fillStyle = '#000000';
    RESIZE_HANDLES.forEach(position => {
      let handleX, handleY;
      switch(position) {
        case 'nw': handleX = x - HANDLE_SIZE/2; handleY = y - HANDLE_SIZE/2; break;
        case 'ne': handleX = x + w - HANDLE_SIZE/2; handleY = y - HANDLE_SIZE/2; break;
        case 'se': handleX = x + w - HANDLE_SIZE/2; handleY = y + h - HANDLE_SIZE/2; break;
        case 'sw': handleX = x - HANDLE_SIZE/2; handleY = y + h - HANDLE_SIZE/2; break;
      }
      ctx.fillRect(handleX, handleY, HANDLE_SIZE, HANDLE_SIZE);
    });
  }, []);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    if (!ctxRef.current) return;
    
    requestAnimationFrame(() => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      
      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { shapes, images, texts } = elementsRef.current;
      const { selectedElement } = interactionStateRef.current;

      // Draw all elements
      [...shapes, ...images, ...texts].forEach(element => {
        if (element.type === 'rectangle') {
          ctx.fillStyle = element.color;
          ctx.fillRect(element.x, element.y, element.width, element.height);
        } else if (element.type === 'circle') {
          ctx.fillStyle = element.color;
          ctx.beginPath();
          ctx.arc(element.x + element.width/2, element.y + element.height/2, element.width/2, 0, 2 * Math.PI);
          ctx.fill();
        } else if (element.type === 'image') {
          ctx.drawImage(element.img, element.x, element.y, element.width, element.height);
        } else if (element.type === 'text') {
          ctx.font = `${element.fontSize}px Arial`;
          ctx.fillStyle = element.color;
          ctx.fillText(element.text, element.x, element.y + element.height);
        }
      });

      // Draw resize handles for selected element
      if (selectedElement) {
        drawResizeHandles(selectedElement);
      }
    });
  }, [drawResizeHandles]);

  // Add element helpers
  const addShape = useCallback((type) => {
    const newShape = {
      type,
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      color: currentColor
    };
    elementsRef.current.shapes.push(newShape);
    redrawCanvas();
  }, [currentColor, redrawCanvas]);

  const addText = useCallback(() => {
    if (newText.trim()) {
      const newTextElement = {
        type: 'text',
        text: newText,
        x: 150,
        y: 150,
        width: 100,
        height: 20,
        fontSize: 20,
        color: currentColor
      };
      elementsRef.current.texts.push(newTextElement);
      setNewText('');
      redrawCanvas();
    }
  }, [newText, currentColor, redrawCanvas]);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const newImage = {
          type: 'image',
          img,
          x: 50,
          y: 50,
          width: 100,
          height: 100 / aspectRatio
        };
        elementsRef.current.images.push(newImage);
        redrawCanvas();
      };
      img.src = URL.createObjectURL(file);
    }
  }, [redrawCanvas]);

  // Helper to find element under point
  const findElementAtPosition = useCallback((x, y) => {
    const { shapes, images, texts } = elementsRef.current;
    const elements = [...shapes, ...images, ...texts];
    
    // Check in reverse order (top-most first)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (x >= element.x && x <= element.x + element.width &&
          y >= element.y && y <= element.y + element.height) {
        return element;
      }
    }
    return null;
  }, []);

  // Helper to find resize handle under point
  const findResizeHandle = useCallback((x, y, element) => {
    if (!element) return null;
    
    for (const handle of RESIZE_HANDLES) {
      let handleX, handleY;
      switch(handle) {
        case 'nw': handleX = element.x; handleY = element.y; break;
        case 'ne': handleX = element.x + element.width; handleY = element.y; break;
        case 'se': handleX = element.x + element.width; handleY = element.y + element.height; break;
        case 'sw': handleX = element.x; handleY = element.y + element.height; break;
      }
      
      if (Math.abs(x - handleX) <= HANDLE_SIZE && Math.abs(y - handleY) <= HANDLE_SIZE) {
        return handle;
      }
    }
    return null;
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const element = findElementAtPosition(x, y);
    if (element) {
      const handle = findResizeHandle(x, y, element);
      if (handle) {
        // Start resizing
        interactionStateRef.current = {
          isResizing: true,
          isMoving: false,
          selectedElement: element,
          selectedHandle: handle,
          startPos: { x, y },
          originalElementState: { ...element }
        };
      } else {
        // Start moving
        interactionStateRef.current = {
          isMoving: true,
          isResizing: false,
          selectedElement: element,
          selectedHandle: null,
          startPos: { x, y },
          originalElementState: { ...element }
        };
      }
    } else {
      // Deselect
      interactionStateRef.current.selectedElement = null;
    }
    redrawCanvas();
  }, [findElementAtPosition, findResizeHandle, redrawCanvas]);

  const handleMouseMove = useCallback((e) => {
    const { isMoving, isResizing, selectedElement, selectedHandle, startPos, originalElementState } = interactionStateRef.current;
    if (!selectedElement || (!isMoving && !isResizing)) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const dx = x - startPos.x;
    const dy = y - startPos.y;

    if (isMoving) {
      selectedElement.x = originalElementState.x + dx;
      selectedElement.y = originalElementState.y + dy;
    } else if (isResizing) {
      const { x: origX, y: origY, width: origW, height: origH } = originalElementState;
      
      switch(selectedHandle) {
        case 'nw':
          selectedElement.x = origX + dx;
          selectedElement.y = origY + dy;
          selectedElement.width = origW - dx;
          selectedElement.height = origH - dy;
          break;
        case 'ne':
          selectedElement.y = origY + dy;
          selectedElement.width = origW + dx;
          selectedElement.height = origH - dy;
          break;
        case 'se':
          selectedElement.width = origW + dx;
          selectedElement.height = origH + dy;
          break;
        case 'sw':
          selectedElement.x = origX + dx;
          selectedElement.width = origW - dx;
          selectedElement.height = origH + dy;
          break;
      }

      // Ensure minimum size
      selectedElement.width = Math.max(20, selectedElement.width);
      selectedElement.height = Math.max(20, selectedElement.height);
    }

    redrawCanvas();
  }, [redrawCanvas]);

  const handleMouseUp = useCallback(() => {
    interactionStateRef.current = {
      ...interactionStateRef.current,
      isMoving: false,
      isResizing: false,
      startPos: { x: 0, y: 0 },
      originalElementState: null
    };
  }, []);

  return (
    <div className="template_editor">
      {showDimensionModal && (
        <DimensionModal
          dimensions={dimensions}
          setDimensions={setDimensions}
          onSubmit={(e) => {
            e.preventDefault();
            initializeCanvas(dimensions.width, dimensions.height);
          }}
        />
      )}

      <Toolbar
        onAddShape={addShape}
        onImageUpload={handleImageUpload}
        newText={newText}
        setNewText={setNewText}
        onAddText={addText}
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
      />

      <div className="canvas_container">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};

export default EditTemplate;