import React, { useState, useRef, useCallback, memo } from 'react';
import { IoIosImage } from 'react-icons/io';
import '../styles/edit.scss';

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
          onChange={(e) => setDimensions((prev) => ({ ...prev, width: parseInt(e.target.value, 10) }))}
        />
      </label>
      <label>
        Height:
        <input
          type="number"
          value={dimensions.height}
          onChange={(e) => setDimensions((prev) => ({ ...prev, height: parseInt(e.target.value, 10) }))}
        />
      </label>
      <button type="submit">Create Canvas</button>
    </form>
  </div>
));

const Toolbar = memo(({ onAddShape, onImageUpload, newText, setNewText, onAddText, currentColor, setCurrentColor, onUndo, onRedo, undoDisabled, redoDisabled, onDelete }) => (
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
    <button onClick={onUndo} disabled={undoDisabled}>Undo</button>
    <button onClick={onRedo} disabled={redoDisabled}>Redo</button>
    <button onClick={onDelete}>Delete</button>
  </div>
));

const EditTemplate = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [showDimensionModal, setShowDimensionModal] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [currentColor, setCurrentColor] = useState('#000000');
  const [newText, setNewText] = useState('');

  const [currentStateIndex, setCurrentStateIndex] = useState(-1);
  const stateHistory = useRef([]);
  const maxHistoryLength = 50;

  const currentState = useRef({
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

  const pushState = useCallback(() => {
    const newState = {
      shapes: JSON.parse(JSON.stringify(currentState.current.shapes)),
      texts: JSON.parse(JSON.stringify(currentState.current.texts)),
      images: currentState.current.images.map((img) => ({
        ...img,
        src: img.img.src
      }))
    };

    stateHistory.current = stateHistory.current.slice(0, currentStateIndex + 1);
    stateHistory.current.push(newState);

    if (stateHistory.current.length > maxHistoryLength) {
      stateHistory.current.shift();
    } else {
      setCurrentStateIndex(stateHistory.current.length - 1);
    }
  }, [currentStateIndex]);

  const redrawCanvas = useCallback(() => {
    if (!ctxRef.current) return;

    const ctx = ctxRef.current;
    const canvas = canvasRef.current;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const { shapes, images, texts } = currentState.current;
    const { selectedElement } = interactionStateRef.current;

    shapes.forEach((shape) => {
      ctx.fillStyle = shape.color;
      if (shape.shapeType === 'rectangle') {
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.shapeType === 'circle') {
        ctx.beginPath();
        ctx.arc(
          shape.x + shape.width / 2,
          shape.y + shape.height / 2,
          shape.width / 2,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    });

    texts.forEach((text) => {
      ctx.font = `${text.fontSize}px Arial`;
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, text.x, text.y + text.height);
    });

    images.forEach((image) => {
      if (image.img) {
        ctx.drawImage(image.img, image.x, image.y, image.width, image.height);
      }
    });

    if (selectedElement) {
      ctx.strokeStyle = 'blue';
      ctx.strokeRect(
        selectedElement.x,
        selectedElement.y,
        selectedElement.width,
        selectedElement.height
      );

      RESIZE_HANDLES.forEach((handle) => {
        let handleX, handleY;
        if (handle === 'nw') {
          handleX = selectedElement.x;
          handleY = selectedElement.y;
        } else if (handle === 'ne') {
          handleX = selectedElement.x + selectedElement.width;
          handleY = selectedElement.y;
        } else if (handle === 'se') {
          handleX = selectedElement.x + selectedElement.width;
          handleY = selectedElement.y + selectedElement.height;
        } else if (handle === 'sw') {
          handleX = selectedElement.x;
          handleY = selectedElement.y + selectedElement.height;
        }
        ctx.fillStyle = 'blue';
        ctx.fillRect(handleX - HANDLE_SIZE / 2, handleY - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      });
    }
  }, []);

  const applyState = useCallback((state) => {
    const imagesWithElements = state.images.map((imgData) => {
      const img = new Image();
      img.src = imgData.src;
      return { ...imgData, img };
    });

    currentState.current = {
      shapes: state.shapes,
      texts: state.texts,
      images: imagesWithElements
    };

    redrawCanvas();
  }, [redrawCanvas]);

  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const elements = [...currentState.current.shapes, ...currentState.current.texts, ...currentState.current.images];
    const { selectedElement } = interactionStateRef.current;

    if (selectedElement) {
      RESIZE_HANDLES.some((handle) => {
        let handleX, handleY;
        if (handle === 'nw') {
          handleX = selectedElement.x;
          handleY = selectedElement.y;
        } else if (handle === 'ne') {
          handleX = selectedElement.x + selectedElement.width;
          handleY = selectedElement.y;
        } else if (handle === 'se') {
          handleX = selectedElement.x + selectedElement.width;
          handleY = selectedElement.y + selectedElement.height;
        } else if (handle === 'sw') {
          handleX = selectedElement.x;
          handleY = selectedElement.y + selectedElement.height;
        }
        const withinHandle =
          Math.abs(x - handleX) <= HANDLE_SIZE / 2 && Math.abs(y - handleY) <= HANDLE_SIZE / 2;
        if (withinHandle) {
          interactionStateRef.current.isResizing = true;
          interactionStateRef.current.selectedHandle = handle;
          return true;
        }
        return false;
      });
    }

    if (!interactionStateRef.current.isResizing) {
      for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        if (
          x >= element.x &&
          x <= element.x + element.width &&
          y >= element.y &&
          y <= element.y + element.height
        ) {
          interactionStateRef.current.isMoving = true;
          interactionStateRef.current.selectedElement = element;
          interactionStateRef.current.startPos = { x, y };
          interactionStateRef.current.originalElementState = { ...element };
          redrawCanvas();
          return;
        }
      }
    }

    interactionStateRef.current.selectedElement = null;
    redrawCanvas();
  }, [redrawCanvas]);

  const handleMouseMove = useCallback((e) => {
    const { isMoving, isResizing, selectedElement, startPos, selectedHandle, originalElementState } =
      interactionStateRef.current;

    if (!isMoving && !isResizing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - startPos.x;
    const dy = y - startPos.y;

    if (isMoving && selectedElement) {
      selectedElement.x = originalElementState.x + dx;
      selectedElement.y = originalElementState.y + dy;
    } else if (isResizing && selectedElement) {
      if (selectedHandle === 'nw') {
        selectedElement.x = originalElementState.x + dx;
        selectedElement.y = originalElementState.y + dy;
        selectedElement.width = originalElementState.width - dx;
        selectedElement.height = originalElementState.height - dy;
      } else if (selectedHandle === 'ne') {
        selectedElement.y = originalElementState.y + dy;
        selectedElement.width = originalElementState.width + dx;
        selectedElement.height = originalElementState.height - dy;
      } else if (selectedHandle === 'se') {
        selectedElement.width = originalElementState.width + dx;
        selectedElement.height = originalElementState.height + dy;
      } else if (selectedHandle === 'sw') {
        selectedElement.x = originalElementState.x + dx;
        selectedElement.width = originalElementState.width - dx;
        selectedElement.height = originalElementState.height + dy;
      }

      selectedElement.width = Math.max(selectedElement.width, 20);
      selectedElement.height = Math.max(selectedElement.height, 20);
    }

    redrawCanvas();
  }, [redrawCanvas]);

  const handleMouseUp = useCallback(() => {
    const { isMoving, isResizing } = interactionStateRef.current;

    if (isMoving || isResizing) {
      pushState();
    }

    interactionStateRef.current.isMoving = false;
    interactionStateRef.current.isResizing = false;
    interactionStateRef.current.selectedHandle = null;
  }, [pushState]);

  const initializeCanvas = useCallback((width, height) => {
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    pushState();
    redrawCanvas();
    setShowDimensionModal(false);
  }, [pushState, redrawCanvas]);

  const undo = useCallback(() => {
    if (currentStateIndex > 0) {
      const newIndex = currentStateIndex - 1;
      setCurrentStateIndex(newIndex);
      applyState(stateHistory.current[newIndex]);
    }
  }, [currentStateIndex, applyState]);

  const redo = useCallback(() => {
    if (currentStateIndex < stateHistory.current.length - 1) {
      const newIndex = currentStateIndex + 1;
      setCurrentStateIndex(newIndex);
      applyState(stateHistory.current[newIndex]);
    }
  }, [currentStateIndex, applyState]);

  const deleteSelected = useCallback(() => {
    const { selectedElement } = interactionStateRef.current;
    if (!selectedElement) return;

    const type = selectedElement.type;
    const validTypes = ['shapes', 'texts', 'images'];

    if (!validTypes.includes(type)) {
      console.error(`Invalid type: ${type}`);
      return;
    }

    currentState.current[type] = currentState.current[type].filter((el) => el !== selectedElement);

    interactionStateRef.current.selectedElement = null;
    pushState();
    redrawCanvas();
  }, [pushState, redrawCanvas]);

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
        onAddShape={(shapeType) => {
          const shape = {
            type: 'shapes',
            shapeType,
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            color: currentColor,
          };
          currentState.current.shapes.push(shape);
          pushState();
          redrawCanvas();
        }}
        onImageUpload={(e) => {
          const file = e.target.files[0];
          if (file) {
            const img = new Image();
            img.onload = () => {
              const aspectRatio = img.width / img.height;
              const newImage = {
                type: 'images',
                img,
                src: img.src,
                x: 50,
                y: 50,
                width: 100,
                height: 100 / aspectRatio,
              };
              currentState.current.images.push(newImage);
              pushState();
              redrawCanvas();
            };
            img.src = URL.createObjectURL(file);
          }
        }}
        newText={newText}
        setNewText={setNewText}
        onAddText={() => {
          if (newText.trim()) {
            const textElement = {
              type: 'texts',
              text: newText,
              x: 150,
              y: 150,
              width: 100,
              height: 20,
              fontSize: 20,
              color: currentColor,
            };
            currentState.current.texts.push(textElement);
            pushState();
            redrawCanvas();
            setNewText('');
          }
        }}
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        onUndo={undo}
        onRedo={redo}
        undoDisabled={currentStateIndex <= 0}
        redoDisabled={currentStateIndex >= stateHistory.current.length - 1}
        onDelete={deleteSelected}
      />

      <div
        className="canvas_container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default EditTemplate;
