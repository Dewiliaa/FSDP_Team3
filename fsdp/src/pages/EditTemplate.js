import React, { useState } from 'react';
import '../styles/edit.scss';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { GrRotateLeft, GrRotateRight } from 'react-icons/gr';
import { CgMergeVertical, CgMergeHorizontal } from 'react-icons/cg';
import { IoMdUndo, IoMdRedo, IoIosImage } from 'react-icons/io';
import storeData from '../components/LinkedList';

const EditTemplate = () => {
  const filterElement = [
    {
      name: 'brightness',
      maxValue: 200
    },
    {
      name: 'grayscale',
      maxValue: 200
    },
    {
      name: 'sepia',
      maxValue: 200
    },
    {
      name: 'saturate',
      maxValue: 200
    },
    {
      name: 'contrast',
      maxValue: 200
    },
    {
      name: 'hueRotate'
    }
  ];

  const [property, setProperty] = useState({
    name: 'brightness',
    maxValue: 200
  });
  const [details, setDetails] = useState('');
  const [crop, setCrop] = useState('');
  const [state, setState] = useState({
    image: '',
    layers: [],
    brightness: 100,
    grayscale: 0,
    sepia: 0,
    saturate: 100,
    contrast: 100,
    hueRotate: 0,
    rotate: 0,
    vartical: 1,
    horizental: 1
  });

  // Handle input range change (filter values)
  const inputHandle = (e) => {
    setState({
      ...state,
      [e.target.name]: e.target.value
    });
  };

  // Handle rotate left
  const leftRotate = () => {
    setState({
      ...state,
      rotate: state.rotate - 90
    });
    const stateData = { ...state, rotate: state.rotate - 90 };
    storeData.insert(stateData);
  };

  // Handle rotate right
  const rightRotate = () => {
    setState({
      ...state,
      rotate: state.rotate + 90
    });
    const stateData = { ...state, rotate: state.rotate + 90 };
    storeData.insert(stateData);
  };

  // Handle vertical flip
  const varticalFlip = () => {
    setState({
      ...state,
      vartical: state.vartical === 1 ? -1 : 1
    });
    const stateData = { ...state, vartical: state.vartical === 1 ? -1 : 1 };
    storeData.insert(stateData);
  };

  // Handle horizontal flip
  const horizentalFlip = () => {
    setState({
      ...state,
      horizental: state.horizental === 1 ? -1 : 1
    });
    const stateData = { ...state, horizental: state.horizental === 1 ? -1 : 1 };
    storeData.insert(stateData);
  };

  // Handle undo
  const undo = () => {
    const data = storeData.undoEdit();
    if (data) {
      setState(data);
    }
  };

  // Handle redo
  const redo = () => {
    const data = storeData.redoEdit();
    if (data) {
      setState(data);
    }
  };

  // Handle image input (base image)
  const imageHandle = (e) => {
    if (e.target.files.length !== 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setState({
          ...state,
          image: reader.result
        });
        const stateData = {
          image: reader.result,
          brightness: 100,
          grayscale: 0,
          sepia: 0,
          saturate: 100,
          contrast: 100,
          hueRotate: 0,
          rotate: 0,
          vartical: 1,
          horizental: 1,
          layers: []
        };
        storeData.insert(stateData);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Add text layer
  const addTextLayer = (text, fontSize = 30, color = "#000", x = 100, y = 100) => {
    const newLayer = {
      type: 'text',
      content: text,
      fontSize,
      color,
      x,
      y
    };
    setState((prevState) => ({
      ...prevState,
      layers: [...prevState.layers, newLayer]
    }));
  };

  // Handle adding text (prompt user)
  const handleAddText = () => {
    const text = prompt("Enter text:");
    if (text) {
      addTextLayer(text, 30, "#ff0000", 150, 150); // Example text position and size
    }
  };

  // Add image layer
  const addImageLayer = (imageUrl, x = 100, y = 100, width = 100, height = 100) => {
    const newLayer = {
      type: 'image',
      imageUrl,
      x,
      y,
      width,
      height
    };
    setState((prevState) => ({
      ...prevState,
      layers: [...prevState.layers, newLayer]
    }));
  };

  // Handle adding image (upload)
  const handleAddImage = (e) => {
    if (e.target.files.length !== 0) {
      const reader = new FileReader();
      reader.onload = () => {
        addImageLayer(reader.result, 100, 100, 150, 150); // Example image position and size
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Handle cropping image
  const imageCrop = () => {
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

    const base64Url = canvas.toDataURL('image/jpg');
    setState({
      ...state,
      image: base64Url
    });
  };

  // Save final image with layers
  const saveImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size based on the details
    canvas.width = details.naturalWidth;
    canvas.height = details.naturalHeight;

    // Apply filters and transformations
    ctx.filter = `brightness(${state.brightness}%) grayscale(${state.grayscale}%) sepia(${state.sepia}%) saturate(${state.saturate}%) contrast(${state.contrast}%) hue-rotate(${state.hueRotate}deg)`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(state.rotate * Math.PI / 180);
    ctx.scale(state.vartical, state.horizental);

    // Draw the base image
    ctx.drawImage(details, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

    // Draw all layers (images and text)
    state.layers.forEach((layer) => {
      if (layer.type === 'image') {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
        };
        img.src = layer.imageUrl;
      } else if (layer.type === 'text') {
        ctx.font = `${layer.fontSize}px Arial`;
        ctx.fillStyle = layer.color;
        ctx.fillText(layer.content, layer.x, layer.y);
      }
    });

    // Save the image
    const link = document.createElement('a');
    link.download = 'image_edit.jpg';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="image_editor">
      <div className="card">
        <div className="card_header">
          <h2>Edit Your Image</h2>
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
                  <label htmlFor="range">Adjust {property.name}</label>
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
                <label htmlFor="">Rotate & Flip</label>
                <div className="icon">
                  <div onClick={leftRotate}><GrRotateLeft /></div>
                  <div onClick={rightRotate}><GrRotateRight /></div>
                  <div onClick={varticalFlip}><CgMergeVertical /></div>
                  <div onClick={horizentalFlip}><CgMergeHorizontal /></div>
                </div>
              </div>
            </div>
            <div className="reset">
              <button>Reset</button>
              <button onClick={saveImage} className="save">Save Image</button>
            </div>
          </div>

          <div className="image_section">
            <div className="image">
              {state.image ? (
                <ReactCrop crop={crop} onChange={(c) => setCrop(c)}>
                  <img
                    onLoad={(e) => setDetails(e.currentTarget)}
                    style={{
                      filter: `brightness(${state.brightness}%) grayscale(${state.grayscale}%) sepia(${state.sepia}%) saturate(${state.saturate}%) contrast(${state.contrast}%) hue-rotate(${state.hueRotate}deg)`,
                      transform: `rotate(${state.rotate}deg) scale(${state.vartical},${state.horizental})`
                    }}
                    src={state.image}
                    alt="editing"
                  />
                </ReactCrop>
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
              <input onChange={imageHandle} type="file" id="choose" />
              <button onClick={handleAddText}>Add Text</button>../
              <input onChange={handleAddImage} type="file" id="add-image" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTemplate;
