import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Canvas, Image, Textbox } from 'fabric';

const EditTemplate = () => {
    const { state } = useLocation();
    const template = state?.template;
    const canvasRef = useRef(null);  // Reference to the canvas element
    const fabricCanvasRef = useRef(null);  // Reference to the Fabric.js canvas instance
    const [textInput, setTextInput] = useState('');
    const [selectedText, setSelectedText] = useState(null);

    useEffect(() => {
        // Initialize Fabric canvas only if it has not been initialized already
        if (!fabricCanvasRef.current && canvasRef.current) {
            const fabricCanvas = new Canvas(canvasRef.current, {
                height: 500,
                width: 400,
            });
            fabricCanvasRef.current = fabricCanvas;

            // Load selected template image if available
            if (template?.image) {
                Image.fromURL(template.image, (img) => {
                    img.set({ selectable: false });
                    fabricCanvas.add(img);
                    fabricCanvas.sendToBack(img);
                });
            }
        }

        // Cleanup function to dispose of the Fabric canvas on component unmount
        return () => {
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose();
                fabricCanvasRef.current = null;  // Clear the reference
            }
        };
    }, [template]);

    const addTextToCanvas = () => {
        const text = new Textbox(textInput, {
            left: 50,
            top: 50,
            fontSize: 20,
            fill: '#000000',
        });
        fabricCanvasRef.current.add(text);
        setSelectedText(text);
    };

    const updateText = (e) => {
        if (selectedText) {
            selectedText.text = e.target.value;
            fabricCanvasRef.current.renderAll();
        }
    };

    const handleImageUpload = (e) => {
        const reader = new FileReader();
        reader.onload = (f) => {
            const imgObj = new Image();
            imgObj.src = f.target.result;
            imgObj.onload = () => {
                const img = new Image(imgObj);
                img.scaleToWidth(200);
                fabricCanvasRef.current.add(img);
            };
        };
        reader.readAsDataURL(e.target.files[0]);
    };

    return (
        <div className="edit-template">
            <h2>Edit {template?.name}</h2>
            <div className="canvas-container">
                <canvas id="template-canvas" ref={canvasRef}></canvas>
            </div>

            <div className="controls">
                <input
                    type="text"
                    placeholder="Enter text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                />
                <button onClick={addTextToCanvas}>Add Text</button>
                <input type="file" onChange={handleImageUpload} />
            </div>

            {selectedText && (
                <div className="text-editing">
                    <input
                        type="text"
                        value={selectedText.text}
                        onChange={updateText}
                    />
                </div>
            )}
        </div>
    );
};

export default EditTemplate;
