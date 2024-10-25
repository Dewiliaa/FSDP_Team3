import React, { useState, useRef } from 'react';
import { fabric } from 'fabric'; // For canvas manipulation
import './ManageAds.css'; // Import your CSS

const ManageAds = () => {
    const canvasRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [textInput, setTextInput] = useState('');
    const [selectedText, setSelectedText] = useState(null);

    // Initialize the canvas and load the template
    const initCanvas = () => {
        const newCanvas = new fabric.Canvas('ad-canvas', {
            height: 500,
            width: 400,
        });
        setCanvas(newCanvas);

        // Load image template
        fabric.Image.fromURL('/path/to/template-image.png', (img) => {
            img.set({ selectable: false });
            newCanvas.add(img);
        });
    };

    // Add text to the canvas
    const addTextToCanvas = () => {
        const text = new fabric.Textbox(textInput, {
            left: 50,
            top: 50,
            fontSize: 20,
            fill: '#000000',
        });
        canvas.add(text);
        setSelectedText(text);
    };

    // Update selected text
    const updateText = (e) => {
        if (selectedText) {
            selectedText.text = e.target.value;
            canvas.renderAll();
        }
    };

    // Handle image upload
    const handleImageUpload = (e) => {
        const reader = new FileReader();
        reader.onload = (f) => {
            const imgObj = new Image();
            imgObj.src = f.target.result;
            imgObj.onload = () => {
                const img = new fabric.Image(imgObj);
                img.scaleToWidth(200);
                canvas.add(img);
            };
        };
        reader.readAsDataURL(e.target.files[0]);
    };

    // Initialize the canvas on component mount
    React.useEffect(() => {
        initCanvas();
    }, []);

    return (
        <div className="manageAds">
            <h2 className="page-title">Manage Ads</h2>
            <div className="canvas-container">
                <canvas id="ad-canvas" ref={canvasRef}></canvas>
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
                    {/* Add color picker, font size, etc. */}
                </div>
            )}
        </div>
    );
};

export default ManageAds;
