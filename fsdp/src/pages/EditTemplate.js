import React, { useState } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { GrRotateLeft, GrRotateRight } from 'react-icons/gr';
import { CgMergeVertical, CgMergeHorizontal } from 'react-icons/cg';
import { IoMdUndo, IoMdRedo, IoIosImage } from 'react-icons/io';
import '../styles/edit.scss'
import { useImage } from '../components/ImageContext';
import { useNavigate } from 'react-router-dom';

// LinkedList implementation for undo/redo functionality
class Node {
    constructor(data = null, next = null, prev = null) {
        this.data = data;
        this.next = next;
        this.prev = prev;
    }
}

class LinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.current = null;
    }

    insert(data) {
        const node = new Node(data);
        if (!this.head) {
            this.head = node;
            this.tail = node;
            this.current = node;
            return;
        }
        
        if (this.current.next) {
            this.current.next = node;
            node.prev = this.current;
            this.tail = node;
        } else {
            this.tail.next = node;
            node.prev = this.tail;
            this.tail = node;
        }
        this.current = node;
    }

    undoEdit() {
        if (this.current && this.current.prev) {
            this.current = this.current.prev;
            return this.current.data;
        }
        return null;
    }

    redoEdit() {
        if (this.current && this.current.next) {
            this.current = this.current.next;
            return this.current.data;
        }
        return null;
    }
}

const storeData = new LinkedList();

const EditTemplate = () => {
    const filterElement = [
        { name: 'brightness', maxValue: 200 },
        { name: 'grayscale', maxValue: 200 },
        { name: 'sepia', maxValue: 200 },
        { name: 'saturate', maxValue: 200 },
        { name: 'contrast', maxValue: 200 },
        { name: 'hueRotate', maxValue: 360 }
    ];

    const [property, setProperty] = useState(filterElement[0]);
    const [details, setDetails] = useState('');
    const [crop, setCrop] = useState(null);
    const [showTextPopup, setShowTextPopup] = useState(false);
    const [text, setText] = useState('');
    const { setEditedImage } = useImage();
    const navigate = useNavigate();
    const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
    const [textStyle, setTextStyle] = useState({
        fontSize: '20px',
        color: '#ffffff',
        fontWeight: 'bold'
    });
    
    const [state, setState] = useState({
        image: '',
        brightness: 100,
        grayscale: 0,
        sepia: 0,
        saturate: 100,
        contrast: 100,
        hueRotate: 0,
        rotate: 0,
        vertical: 1,
        horizontal: 1
    });

    const handleTextInput = (e) => setText(e.target.value);

    const handleTextColorChange = (e) => {
        setTextStyle(prev => ({ ...prev, color: e.target.value }));
    };

    const handleFontSizeChange = (e) => {
        setTextStyle(prev => ({ ...prev, fontSize: `${e.target.value}px` }));
    };

    const handleMouseDown = (e) => {
        const imageContainer = e.currentTarget.parentElement;
        const rect = imageContainer.getBoundingClientRect();
        
        const handleMouseMove = (moveEvent) => {
            const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
            const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;
            setTextPosition({
                x: Math.min(Math.max(0, x), 100),
                y: Math.min(Math.max(0, y), 100)
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const inputHandle = (e) => {
        setState({
            ...state,
            [e.target.name]: e.target.value
        });
        storeData.insert({ ...state, [e.target.name]: e.target.value });
    };

    const leftRotate = () => {
        setState(prev => {
            const newState = { ...prev, rotate: prev.rotate - 90 };
            storeData.insert(newState);
            return newState;
        });
    };

    const rightRotate = () => {
        setState(prev => {
            const newState = { ...prev, rotate: prev.rotate + 90 };
            storeData.insert(newState);
            return newState;
        });
    };

    const verticalFlip = () => {
        setState(prev => {
            const newState = { ...prev, vertical: prev.vertical === 1 ? -1 : 1 };
            storeData.insert(newState);
            return newState;
        });
    };

    const horizontalFlip = () => {
        setState(prev => {
            const newState = { ...prev, horizontal: prev.horizontal === 1 ? -1 : 1 };
            storeData.insert(newState);
            return newState;
        });
    };

    const undo = () => {
        const data = storeData.undoEdit();
        if (data) setState(data);
    };

    const redo = () => {
        const data = storeData.redoEdit();
        if (data) setState(data);
    };

    const imageHandle = (e) => {
        if (e.target.files.length !== 0) {
            const reader = new FileReader();
            reader.onload = () => {
                const newState = {
                    ...state,
                    image: reader.result
                };
                setState(newState);
                storeData.insert(newState);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const imageCrop = () => {
        if (!crop || !details) return;

        const canvas = document.createElement('canvas');
        const scaleX = details.naturalWidth / details.width;
        const scaleY = details.naturalHeight / details.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            details,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        const base64Url = canvas.toDataURL('image/jpeg');
        setState(prev => {
            const newState = { ...prev, image: base64Url };
            storeData.insert(newState);
            return newState;
        });
        setCrop(null);
    };

    const saveImage = () => {
        const canvas = document.createElement('canvas');
        canvas.width = details.naturalWidth;
        canvas.height = details.naturalHeight;
        const ctx = canvas.getContext('2d');

        ctx.filter = `brightness(${state.brightness}%) grayscale(${state.grayscale}%) sepia(${state.sepia}%) saturate(${state.saturate}%) contrast(${state.contrast}%) hue-rotate(${state.hueRotate}deg)`;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(state.rotate * Math.PI / 180);
        ctx.scale(state.vertical, state.horizontal);

        ctx.drawImage(
            details,
            -canvas.width / 2,
            -canvas.height / 2,
            canvas.width,
            canvas.height
        );

        if (text) {
            ctx.font = `${textStyle.fontSize} Arial`;
            ctx.fillStyle = textStyle.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const textX = (textPosition.x / 100) * canvas.width;
            const textY = (textPosition.y / 100) * canvas.height;
            ctx.fillText(text, textX, textY);
        }

        const editedImageUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        setEditedImage(editedImageUrl);

        const link = document.createElement('a');
        link.download = 'edited_image.jpg';
        link.href = editedImageUrl;
        link.click();

        setTimeout(() => {
          navigate('/ManageAds');
        }, 100);
    };

    const resetImage = () => {
        setState({
            ...state,
            brightness: 100,
            grayscale: 0,
            sepia: 0,
            saturate: 100,
            contrast: 100,
            hueRotate: 0,
            rotate: 0,
            vertical: 1,
            horizontal: 1
        });
        setText('');
        setTextPosition({ x: 50, y: 50 });
        setTextStyle({
            fontSize: '20px',
            color: '#ffffff',
            fontWeight: 'bold'
        });
    };

    return (
        <div className="image_editor">
            <div className="card">
                <div className="card_header">
                    <h2>Image Editor</h2>
                </div>
                <div className="card_body">
                    <div className="sidebar">
                        <div className="side_body">
                            <div className="filter_section">
                                <span>Filters</span>
                                <div className="filter_key">
                                    {filterElement.map((v, i) => (
                                        <button
                                            className={property.name === v.name ? 'active' : ''}
                                            onClick={() => setProperty(v)}
                                            key={i}
                                        >
                                            {v.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="filter_slider">
                                <div className="label_bar">
                                    <label htmlFor="range">{property.name}</label>
                                    <span>{state[property.name]}%</span>
                                </div>
                                <input
                                    name={property.name}
                                    onChange={inputHandle}
                                    value={state[property.name]}
                                    max={property.maxValue}
                                    type="range"
                                />
                            </div>
                            <div className="rotate">
                                <label>Rotate & Flip</label>
                                <div className="icon">
                                    <div onClick={leftRotate}><GrRotateLeft /></div>
                                    <div onClick={rightRotate}><GrRotateRight /></div>
                                    <div onClick={verticalFlip}><CgMergeVertical /></div>
                                    <div onClick={horizontalFlip}><CgMergeHorizontal /></div>
                                </div>
                            </div>
                        </div>

                        <div className="text_controls_section">
                            <button
                                className="text_button"
                                onClick={() => setShowTextPopup(!showTextPopup)}
                            >
                                Add Text
                            </button>
                            {showTextPopup && (
                                <div className="text-popup">
                                    <div className="text-controls">
                                        <input
                                            type="text"
                                            className="text-input"
                                            placeholder="Enter text"
                                            value={text}
                                            onChange={handleTextInput}
                                        />
                                        <input
                                            type="color"
                                            className="color-picker"
                                            value={textStyle.color}
                                            onChange={handleTextColorChange}
                                        />
                                        <input
                                            type="range"
                                            min="12"
                                            max="72"
                                            value={parseInt(textStyle.fontSize)}
                                            onChange={handleFontSizeChange}
                                        />
                                        <button
                                            className="close-button"
                                            onClick={() => setShowTextPopup(false)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="reset">
                            <button onClick={resetImage}>Reset</button>
                            <button onClick={saveImage} className="save">Save Image</button>
                        </div>
                    </div>
                    <div className="image_section">
                        <div className="image">
                            {state.image ? (
                                <div className="image-container">
                                    <ReactCrop crop={crop} onChange={c => setCrop(c)}>
                                        <img
                                            onLoad={(e) => setDetails(e.currentTarget)}
                                            style={{
                                                filter: `brightness(${state.brightness}%) grayscale(${state.grayscale}%) sepia(${state.sepia}%) saturate(${state.saturate}%) contrast(${state.contrast}%) hue-rotate(${state.hueRotate}deg)`,
                                                transform: `rotate(${state.rotate}deg) scale(${state.vertical},${state.horizontal})`
                                            }}
                                            src={state.image}
                                            alt="Editor"
                                        />
                                    </ReactCrop>
                                    {text && (
                                        <div
                                            className="text-overlay"
                                            style={{
                                                position: 'absolute',
                                                left: `${textPosition.x}%`,
                                                top: `${textPosition.y}%`,
                                                transform: 'translate(-50%, -50%)',
                                                ...textStyle,
                                                cursor: 'move',
                                                userSelect: 'none',
                                                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                                            }}
                                            onMouseDown={handleMouseDown}
                                        >
                                            {text}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <label htmlFor="choose">
                                    <IoIosImage />
                                    <span>Choose Image</span>
                                </label>
                            )}
                        </div>
                        <div className="image_select">
                            <button onClick={undo} className="undo"><IoMdUndo /></button>
                            <button onClick={redo} className="redo"><IoMdRedo /></button>
                            {crop && <button onClick={imageCrop} className="crop">Crop Image</button>}
                            <label htmlFor="choose">Choose Image</label>
                            <input onChange={imageHandle} type="file" id="choose" accept="image/*" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditTemplate;