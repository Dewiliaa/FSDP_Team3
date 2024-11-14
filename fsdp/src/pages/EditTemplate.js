//EditTemplate.js
import React, { useEffect, useState } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { GrRotateLeft, GrRotateRight } from 'react-icons/gr';
import { CgMergeVertical, CgMergeHorizontal } from 'react-icons/cg';
import { IoMdUndo, IoMdRedo, IoIosImage } from 'react-icons/io';
import '../styles/edit.scss';
import { useLocation, useNavigate } from 'react-router-dom';
import AWS from '../aws-config';

const s3 = new AWS.S3();

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
    const location = useLocation();
    const [imageUrl, setImageUrl] = useState('');
    const [imageName, setImageName] = useState('');
    const [imageId, setImageId] = useState('');

    useEffect(() => {
        if (location.state) {
            setImageUrl(location.state.imageUrl);
            setImageName(location.state.imageName);
            setImageId(location.state.imageId);

            const img = new Image();
            img.src = location.state.imageUrl;
            img.onload = () => {
                setState(prev => ({
                    ...prev,
                    image: location.state.imageUrl
                }));
                setDetails(img);
            }
        }
    }, [location]);

    const [newImage, setNewImage] = useState(null);
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

    const [draggedImage, setDraggedImage] = useState({
        image: '',
        position: { x: 100, y: 100 },
        dragging: false
    });

    const navigate = useNavigate();

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

    const imageCrop = async () => {
        if (!crop || !details) return;

        const canvas = document.createElement('canvas');
        const scaleX = details.naturalWidth / details.width;
        const scaleY = details.naturalHeight / details.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        })

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

    const dataUrlToBlob = (dataUrl) => {
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const byteNumbers = new Uint8Array(byteString.length);
        
        for (let i = 0; i < byteString.length; i++) {
            byteNumbers[i] = byteString.charCodeAt(i);
        }
        
        return new Blob([byteNumbers], { type: mimeString });
    };

    const saveImage = async () => {
        try {
            const getNextEditNumber = () => {
                let maxNumber = 0;
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith('edited')) {
                        const number = parseInt(key.replace('edited', ''));
                        if (!isNaN(number) && number > maxNumber) {
                            maxNumber = number;
                        }
                    }
                }
                return maxNumber + 1;
            };
    
            const canvas = document.createElement('canvas');
            canvas.width = details.naturalWidth;
            canvas.height = details.naturalHeight;
            const ctx = canvas.getContext('2d');
    
            // Apply filters
            ctx.filter = `brightness(${state.brightness}%) grayscale(${state.grayscale}%) sepia(${state.sepia}%) saturate(${state.saturate}%) contrast(${state.contrast}%) hue-rotate(${state.hueRotate}deg)`;
    
            // Apply transformations
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(state.rotate * Math.PI / 180);
            ctx.scale(state.vertical, state.horizontal);
    
            // Draw main image
            ctx.drawImage(
                details,
                -canvas.width / 2,
                -canvas.height / 2,
                canvas.width,
                canvas.height
            );
    
            // Draw text if exists
            if (text) {
                ctx.font = `${textStyle.fontSize} Arial`;
                ctx.fillStyle = textStyle.color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const textX = (textPosition.x / 100) * canvas.width;
                const textY = (textPosition.y / 100) * canvas.height;
                ctx.fillText(text, textX, textY);
            }
    
            // Function to handle the final upload
            const uploadFinalImage = () => {
                return new Promise((resolve, reject) => {
                    const finalImage = canvas.toDataURL('image/jpeg', 0.8);
                    const editNumber = getNextEditNumber();
                    const blobData = dataUrlToBlob(finalImage);
    
                    // Ask user for name before upload
                    const imageName = prompt('Please enter a name for the edited image:');
                    if (!imageName) {
                        alert('Image name is required.');
                        return reject('Image name is required.');
                    }

                    // Log the bucket name and region being used
                    console.log('Using bucket:', process.env.REACT_APP_TEMPLATE_BUCKET);

                    const params = {
                        Bucket: 'mediastorage-bytefsdp',
                        Key: `media/${imageName}.jpg`,
                        Body: blobData,
                        ContentType: 'image/jpeg',
                    };
    
                    // Upload to S3
                    s3.upload(params, (err, data) => {
                        if (err) {
                            console.error('Detailed upload error:', err);
                            reject(err);
                        } else {
                            console.log('Upload successful:', data);
                            // Save to localStorage
                            localStorage.setItem(`edited${editNumber}`, finalImage);

                            // Save metadata to DynamoDB Ads table
                            const adsTableParams = {
                                TableName: 'Ads',
                                Item: {
                                    ad_id: newImage ? `media/${Date.now()}_${newImage.name}` : 'default_name',
                                    name: imageName,
                                    type: 'image',
                                    uploadDate: new Date().toISOString(),
                                    url: data.Location,
                                }
                            };
                            new AWS.DynamoDB.DocumentClient().put(adsTableParams, (err) => {
                                if (err) {
                                    console.error('Failed to save metadata to DynamoDB:', err);
                                } else {
                                    console.log('Successfully saved metadata to DynamoDB Ads table.');
                                }
                            });

                            resolve(data);
                        }
                    });
                });
            };
    
            // Handle dragged image if it exists
            if (draggedImage.image) {
                const img = new Image();
                img.src = draggedImage.image;
                await new Promise((resolve) => {
                    img.onload = () => {
                        ctx.drawImage(
                            img,
                            draggedImage.position.x,
                            draggedImage.position.y,
                            img.width,
                            img.height
                        );
                        resolve();
                    };
                });
            }
    
            // Perform the upload
            await uploadFinalImage();
            
            // Navigate only after successful upload
            navigate('/adManagement');
        } catch (error) {
            console.error('Error in saveImage:', error);
            alert(`Failed to upload image: ${error.message}`);
        }
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
        setDraggedImage({ image: '', position: { x: 100, y: 100 }, dragging: false });
    };

    const handleDragStart = (e) => {
        setDraggedImage(prev => ({ ...prev, dragging: true }));
    };

    const handleDragEnd = (e) => {
        setDraggedImage(prev => ({ ...prev, dragging: false }));
    };

    const handleDrag = (e) => {
        if (draggedImage.dragging) {
            setDraggedImage(prev => ({
                ...prev,
                position: {
                    x: e.clientX - e.target.offsetWidth / 2,
                    y: e.clientY - e.target.offsetHeight / 2
                }
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setNewImage(file);
    };

    const handleSaveChanges = () => {
        if (newImage) {
            console.log("New image selected:", newImage);
        }
    };

    const handleImageLayerChange = (e) => {
        if (e.target.files.length !== 0) {
            const reader = new FileReader();
            reader.onload = () => {
                setDraggedImage(prev => ({
                    ...prev,
                    image: reader.result
                }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
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
                                    {draggedImage.image && (
                                        <div
                                            className="draggable-layer"
                                            style={{
                                                position: 'absolute',
                                                top: draggedImage.position.y,
                                                left: draggedImage.position.x,
                                                cursor: 'move',
                                                userSelect: 'none'
                                            }}
                                            draggable
                                            onDragStart={handleDragStart}
                                            onDrag={handleDrag}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <img src={draggedImage.image} alt="Layer" />
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
                            <input onChange={handleImageLayerChange} type="file" accept="image/*" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditTemplate;
