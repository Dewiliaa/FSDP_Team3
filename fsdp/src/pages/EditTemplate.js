import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { IoIosImage } from 'react-icons/io';
import '../styles/edit.scss';
import AWS from '../aws-config';
import LibraryPanel from './Librarypanel';

// AWS S3 and DynamoDB setup
const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Constants for resize handles and default canvas size
const HANDLE_SIZE = 8;
const RESIZE_HANDLES = ['nw', 'ne', 'se', 'sw'];

// Helper function to add a new element (shape, text, or image) with a zIndex
const addNewElement = (type, elementData, currentState) => {
  const newElement = {
    ...elementData,
    zIndex: currentState.current[type].length, // Set initial zIndex to the last index
  };
  currentState.current[type].push(newElement);
};

const EditTemplate = () => {
  // Canvas and UI state management
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [showDimensionModal, setShowDimensionModal] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [currentFont, setCurrentFont] = useState('Arial');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [newText, setNewText] = useState('');
  const [currentStateIndex, setCurrentStateIndex] = useState(-1);
  const stateHistory = useRef([]);
  const maxHistoryLength = 50;
  const [isSaving, setIsSaving] = useState(false);
  const [showLibrary, setShowLibrary] = useState(true);

  const currentState = useRef({
    shapes: [],
    images: [],
    texts: [],
  });

  const interactionStateRef = useRef({
    isMoving: false,
    isResizing: false,
    selectedElement: null,
    selectedHandle: null,
    startPos: { x: 0, y: 0 },
    originalElementState: null
  });

  // Redrawing the canvas with the sorted elements
  const redrawCanvas = useCallback(() => {
    if (!ctxRef.current) return;

    const ctx = ctxRef.current;
    const canvas = canvasRef.current;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Combine and sort elements based on zIndex
    const allElements = [
      ...currentState.current.shapes,
      ...currentState.current.texts,
      ...currentState.current.images,
    ];

    allElements.sort((a, b) => a.zIndex - b.zIndex); // Sort by zIndex

    // Render elements on the canvas
    allElements.forEach((element) => {
      if (element.type === 'shapes') {
        ctx.fillStyle = element.color;
        ctx.beginPath();
        if (element.shapeType === 'rectangle') {
          ctx.fillRect(element.x, element.y, element.width, element.height);
        } else if (element.shapeType === 'circle') {
          ctx.arc(element.x + element.width / 2, element.y + element.height / 2, element.width / 2, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.closePath();
      } else if (element.type === 'texts') {
        ctx.font = `${element.fontSize}px ${element.font}`;
        ctx.fillStyle = element.color;
        ctx.fillText(element.text, element.x, element.y + element.height);
      } else if (element.type === 'images' && element.img) {
        ctx.drawImage(element.img, element.x, element.y, element.width, element.height);
      }
    });

    // Draw selection box for selected element (if any)
    const { selectedElement } = interactionStateRef.current;
    if (selectedElement) {
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.strokeRect(selectedElement.x, selectedElement.y, selectedElement.width, selectedElement.height);
    }
  }, []);

  // DimensionModal Component for setting canvas dimensions
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

  // Toolbar Component for adding shapes, text, colors, and images
  const Toolbar = memo(({
    onAddShape,
    onImageUpload,
    newText,
    setNewText,
    onAddText,
    currentColor,
    setCurrentColor,
    onUndo,
    onRedo,
    undoDisabled,
    redoDisabled,
    onDelete,
    onChangeFontSize,
    onChangeFont,
    selectedFont,
    selectedElement
  }) => {
    const textInputRef = useRef(null);
  
    useEffect(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }, [newText]);
  
    return (
      <div className="toolbar">
        {/* Shape Buttons */}
        <button onClick={() => onAddShape('rectangle')}>Add Rectangle</button>
        <button onClick={() => onAddShape('circle')}>Add Circle</button>
  
        {/* Image Upload */}
        <label>
          <IoIosImage /> Add Image
          <input type="file" accept="image/*" onChange={onImageUpload} />
        </label>
  
        {/* Text Input */}
        <div className="text-tools">
          <input
            ref={textInputRef}
            type="text"
            placeholder="Enter text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
          <button onClick={onAddText}>Add Text</button>
          <button 
          onClick={() => onChangeFontSize('increase')}
          disabled={!selectedElement || selectedElement.type !== 'texts'}
        >
          A+
        </button>
        <button 
          onClick={() => onChangeFontSize('decrease')}
          disabled={!selectedElement || selectedElement.type !== 'texts'}
        >
          A-
        </button>
      </div>
  
        {/* Font Picker */}
        <div className="font-picker">
          <label>
            Font:
            <select value={selectedFont} onChange={(e) => onChangeFont(e.target.value)}>
              <option value="Arial">Arial</option>
              <option value="Verdana">Verdana</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Helvetica">Helvetica</option>
            </select>
          </label>
        </div>
  
        {/* 🎨 Color Picker */}
        <div className="color-picker">
          <label>
            Color:
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              onClick={(e) => e.stopPropagation()} 
              onWheel={(e) => e.stopPropagation()} 
            />
          </label>
        </div>
  
        {/* Undo/Redo/Delete */}
        <button onClick={onUndo} disabled={undoDisabled}>Undo</button>
        <button onClick={onRedo} disabled={redoDisabled}>Redo</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    );
  });

  // Define pushState, initializeCanvas, undo, redo, deleteSelected, changeFontSize, handleFontChange, saveToS3, handleImageSelect
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

  const changeFontSize = useCallback((action) => {
    const { selectedElement } = interactionStateRef.current;
    if (!selectedElement || selectedElement.type !== 'texts') return;

    const MIN_FONT_SIZE = 8;
    const MAX_FONT_SIZE = 72;
    const STEP_SIZE = 2;

    let newFontSize = selectedElement.fontSize;
    if (action === 'increase') {
      newFontSize = Math.min(selectedElement.fontSize + STEP_SIZE, MAX_FONT_SIZE);
    } else if (action === 'decrease') {
      newFontSize = Math.max(selectedElement.fontSize - STEP_SIZE, MIN_FONT_SIZE);
    }

    if (newFontSize !== selectedElement.fontSize) {
      selectedElement.fontSize = newFontSize;
      // Adjust height proportionally to font size change
      selectedElement.height = newFontSize + 4; // Add small padding
      pushState();
      redrawCanvas();
    }
  }, [pushState, redrawCanvas]);

  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
  
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
  
    const elements = [...currentState.current.shapes, ...currentState.current.texts, ...currentState.current.images];
    let selectedElement = null;
  
    // Check for resize handles first
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      for (const handle of RESIZE_HANDLES) {
        let handleX, handleY;
  
        switch (handle) {
          case 'nw':
            handleX = element.x;
            handleY = element.y;
            break;
          case 'ne':
            handleX = element.x + element.width;
            handleY = element.y;
            break;
          case 'se':
            handleX = element.x + element.width;
            handleY = element.y + element.height;
            break;
          case 'sw':
            handleX = element.x;
            handleY = element.y + element.height;
            break;
          default:
            continue;
        }
  
        if (
          Math.abs(x - handleX) <= HANDLE_SIZE / 2 &&
          Math.abs(y - handleY) <= HANDLE_SIZE / 2
        ) {
          interactionStateRef.current = {
            isResizing: true,
            selectedHandle: handle,
            selectedElement: element,
            startPos: { x, y },
            originalElementState: { ...element }
          };
          return;
        }
      }
    }
  
    // If no resize handle is selected, check for element selection
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (
        x >= element.x &&
        x <= element.x + element.width &&
        y >= element.y &&
        y <= element.y + element.height
      ) {
        selectedElement = element;
        break;
      }
    }
  
    if (selectedElement) {
      interactionStateRef.current = {
        isMoving: !selectedElement.locked,
        selectedElement,
        startPos: { x, y },
        originalElementState: { ...selectedElement }
      };
      redrawCanvas();
    } else {
      interactionStateRef.current = {
        isMoving: false,
        isResizing: false,
        selectedElement: null
      };
      redrawCanvas();
    }
  }, [redrawCanvas]);
  
  const handleMouseMove = useCallback((e) => {
    const { isMoving, isResizing, selectedElement, startPos, selectedHandle, originalElementState } =
      interactionStateRef.current;
  
    if (!isMoving && !isResizing) return;
    if (!selectedElement || !originalElementState) return;
  
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
  
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
  
    const dx = x - startPos.x;
    const dy = y - startPos.y;
  
    if (isMoving) {
      selectedElement.x = originalElementState.x + dx;
      selectedElement.y = originalElementState.y + dy;
    } else if (isResizing) {
      const minSize = 20;
      let newWidth, newHeight, newX, newY;
  
      switch (selectedHandle) {
        case 'nw':
          newWidth = Math.max(originalElementState.width - dx, minSize);
          newHeight = Math.max(originalElementState.height - dy, minSize);
          newX = originalElementState.x + originalElementState.width - newWidth;
          newY = originalElementState.y + originalElementState.height - newHeight;
  
          selectedElement.x = newX;
          selectedElement.y = newY;
          selectedElement.width = newWidth;
          selectedElement.height = newHeight;
          break;
  
        case 'ne':
          newWidth = Math.max(originalElementState.width + dx, minSize);
          newHeight = Math.max(originalElementState.height - dy, minSize);
          newY = originalElementState.y + originalElementState.height - newHeight;
  
          selectedElement.y = newY;
          selectedElement.width = newWidth;
          selectedElement.height = newHeight;
          break;
  
        case 'se':
          selectedElement.width = Math.max(originalElementState.width + dx, minSize);
          selectedElement.height = Math.max(originalElementState.height + dy, minSize);
          break;
  
        case 'sw':
          newWidth = Math.max(originalElementState.width - dx, minSize);
          newX = originalElementState.x + originalElementState.width - newWidth;
  
          selectedElement.x = newX;
          selectedElement.width = newWidth;
          selectedElement.height = Math.max(originalElementState.height + dy, minSize);
          break;
      }
    }
  
    redrawCanvas();
  }, [redrawCanvas]);
  
  const handleMouseUp = useCallback(() => {
    if (interactionStateRef.current.isMoving || interactionStateRef.current.isResizing) {
      pushState();
    }
  
    interactionStateRef.current = {
      ...interactionStateRef.current,
      isMoving: false,
      isResizing: false,
      selectedHandle: null,
      startPos: { x: 0, y: 0 },
      originalElementState: null
    };
  }, [pushState]);
  
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
  
    try {
      const data = e.dataTransfer.getData("application/json");
      if (!data) {
        console.error("🚨 No data received in drag event!");
        return;
      }
  
      const imageData = JSON.parse(data);
      if (!imageData.url) {
        console.error("🚨 Invalid image data:", imageData);
        return;
      }
  
      console.log("Dropped image:", imageData);
  
      // Fetch image as a blob to avoid CORS issue
      const response = await fetch(imageData.url, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
  
      const img = new Image();
      img.crossOrigin = "anonymous"; // Fix CORS issue
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const newImage = {
          type: "images",
          img,
          src: blobUrl, // Use blob URL instead of direct S3 URL
          x: 100, // Adjust drop position
          y: 100,
          width: 100,
          height: 100 / aspectRatio,
          zIndex: Math.max(
            ...[...currentState.current.shapes, ...currentState.current.texts, ...currentState.current.images].map(el => el.zIndex)
          ) + 1, // Set zIndex to the maximum of existing elements
        };
  
        currentState.current.images.push(newImage);
        pushState();  // Store new state
        redrawCanvas();
      };
  
      img.src = blobUrl; // Use blob URL
    } catch (error) {
      console.error("🚨 Error handling dropped image:", error);
    }
  }, [pushState, redrawCanvas]);

  const handleFontChange = useCallback((font) => {
    setCurrentFont(font);
    const { selectedElement } = interactionStateRef.current;
    if (selectedElement && selectedElement.type === 'texts') {
      selectedElement.font = font;
      pushState();
      redrawCanvas();
    }
  }, [pushState, redrawCanvas]);

  const saveToS3 = useCallback(async () => {
    try {
        setIsSaving(true);
        const canvas = canvasRef.current;

        // Convert canvas to blob
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Canvas toBlob failed!"));
            }, 'image/png');
        });

        if (!blob) throw new Error("Blob creation failed!");

        // Generate unique filename
        const filename = `ad_${Date.now()}.png`;

        // S3 upload parameters
        const params = {
          Bucket: "mediastorage-bytefsdp",
          Key: `media/${filename}`,
          Body: blob,
          ContentType: "image/png",
          ACL: "public-read" // 🔥 Make public
      };
      

        console.log("Uploading to S3...", params);

        // Upload to S3
        const data = await s3.upload(params).promise();
        console.log("S3 Upload Success:", data);

        // Save metadata to DynamoDB
        const dynamoParams = {
            TableName: "Ads",
            Item: {
                ad_id: data.Key,
                name: filename,
                type: "image",
                uploadDate: new Date().toISOString(),
                url: data.Location,
            },
        };

        await dynamoDb.put(dynamoParams).promise();
        console.log("DynamoDB Save Success:", dynamoParams);

        alert("Ad saved successfully!");
    } catch (error) {
        console.error("❌ Error saving ad:", error);
        alert("Error saving ad. Please check the console.");
    } finally {
        setIsSaving(false);
    }
  }, []);

  const handleImageSelect = useCallback(async (imageData) => {
    try {
      const response = await fetch(imageData.url, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
  
      const img = new Image();
      img.crossOrigin = "anonymous"; // ✅ Fix CORS
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const newImage = {
          type: "images",
          img,
          src: blobUrl, // ✅ Use blob URL instead of direct S3 URL
          x: 100,
          y: 100,
          width: 100,
          height: 100 / aspectRatio,
        };
        currentState.current.images.push(newImage);
        pushState();
        redrawCanvas();
      };
      img.src = blobUrl; // ✅ Use blob URL
    } catch (error) {
      console.error("🚨 Error loading image as blob:", error);
    }
  }, [pushState, redrawCanvas]);

  const bringToFront = useCallback(() => {
    const { selectedElement } = interactionStateRef.current;
    if (!selectedElement) return;
  
    // Adjust zIndex of selected element
    selectedElement.zIndex = Math.max(
      ...[...currentState.current.shapes, ...currentState.current.texts, ...currentState.current.images].map(el => el.zIndex)
    ) + 1;
  
    pushState();
    redrawCanvas();
  }, [pushState, redrawCanvas]);
  
  const sendToBack = useCallback(() => {
    const { selectedElement } = interactionStateRef.current;
    if (!selectedElement) return;
  
    // Adjust zIndex of selected element
    selectedElement.zIndex = Math.min(
      ...[...currentState.current.shapes, ...currentState.current.texts, ...currentState.current.images].map(el => el.zIndex)
    ) - 1;
  
    pushState();
    redrawCanvas();
  }, [pushState, redrawCanvas]);
  
  const toggleLock = useCallback(() => {
    const { selectedElement } = interactionStateRef.current;
    if (!selectedElement) return;
  
    selectedElement.locked = !selectedElement.locked;
    pushState();
    redrawCanvas();
  }, [pushState, redrawCanvas]);  

  // Final component return JSX
  return (
    <div className="template_editor">
      {/* Canvas Dimension Modal */}
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

      {/* Toolbar Section */}
      <Toolbar
        onAddShape={(shapeType) => {
          const newShape = {
            type: 'shapes',
            shapeType,
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            color: currentColor,
            locked: false,
          };
          addNewElement('shapes', newShape, currentState);
          pushState();
          redrawCanvas();
        }}
        onImageUpload={(e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.crossOrigin = "anonymous"; // Allow CORS
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
                addNewElement('images', newImage, currentState);
                pushState();
                redrawCanvas();
              };
              img.src = event.target.result;
            };
            reader.readAsDataURL(file);
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
              height: 24,
              fontSize: 20,
              font: currentFont,
              color: currentColor,
            };
            addNewElement('texts', textElement, currentState);
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
        onChangeFontSize={changeFontSize}
        onChangeFont={handleFontChange}
        selectedFont={currentFont}
        selectedElement={interactionStateRef.current.selectedElement}
      />

      <div className="parent-selector">
        <button className="save-button" onClick={saveToS3} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Ad'}
        </button>

        <button className="toggle-library-button" onClick={() => setShowLibrary(!showLibrary)}>
          {showLibrary ? 'Hide Library' : 'Show Library'}
        </button>
      </div>


      {/* Canvas Section */}
      <div
        className="canvas_container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={handleDrop} 
      >
        <canvas ref={canvasRef} />
      </div>

      {/* Library Panel - Only visible when toggled */}
      {showLibrary && <LibraryPanel onImageSelect={handleImageSelect} />}
    
      {/* Layer Control Buttons */}
      <div className="layer-tools">
        <button onClick={bringToFront} disabled={!interactionStateRef.current.selectedElement}>
          Bring to Front
        </button>
        <button onClick={sendToBack} disabled={!interactionStateRef.current.selectedElement}>
          Send to Back
        </button>
        <button onClick={toggleLock} disabled={!interactionStateRef.current.selectedElement}>
          {interactionStateRef.current.selectedElement?.locked ? 'Unlock' : 'Lock'}
        </button>
      </div>
    </div>
  );
}

export default EditTemplate;