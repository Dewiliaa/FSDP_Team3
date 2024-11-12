import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import '../styles/edit.scss';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { GrRotateLeft, GrRotateRight } from 'react-icons/gr';
import { CgMergeVertical, CgMergeHorizontal } from 'react-icons/cg';
import { IoMdUndo, IoMdRedo, IoIosImage } from 'react-icons/io';
import storeData from '../components/LinkedList';

const DraggableLayer = ({ id, layer, index, moveLayer, updateLayerPosition }) => {
  const ref = useRef(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'LAYER',
    item: { id, index, type: 'LAYER' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'LAYER',
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveLayer(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  const layerStyle = {
    position: 'absolute',
    left: layer.x,
    top: layer.y,
    cursor: 'move',
    opacity: isDragging ? 0.5 : 1,
    border: '1px dashed #666',
    padding: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    userSelect: 'none',
  };

  return (
    <div
      ref={ref}
      style={layerStyle}
      onMouseDown={(e) => {
        const startX = e.clientX - layer.x;
        const startY = e.clientY - layer.y;

        const handleMouseMove = (e) => {
          updateLayerPosition(index, {
            x: e.clientX - startX,
            y: e.clientY - startY,
          });
        };

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }}
    >
      {layer.type === 'text' ? (
        <div style={{ fontSize: `${layer.fontSize}px`, color: layer.color }}>
          {layer.content}
        </div>
      ) : (
        <img
          src={layer.imageUrl}
          alt="layer"
          style={{ width: layer.width, height: layer.height }}
        />
      )}
    </div>
  );
};

const EditTemplate = () => {
  const filterElement = [
    { name: 'brightness', maxValue: 200 },
    { name: 'grayscale', maxValue: 200 },
    { name: 'sepia', maxValue: 200 },
    { name: 'saturate', maxValue: 200 },
    { name: 'contrast', maxValue: 200 },
    { name: 'hueRotate' }
  ];

  const [property, setProperty] = useState({
    name: 'brightness',
    maxValue: 200
  });
  
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
  
  const [crop, setCrop] = useState({ aspect: 16 / 9 });
  const [details, setDetails] = useState(null);

  const moveLayer = (dragIndex, hoverIndex) => {
    setState((prevState) => {
      const newLayers = [...prevState.layers];
      const dragLayer = newLayers[dragIndex];
      newLayers.splice(dragIndex, 1);
      newLayers.splice(hoverIndex, 0, dragLayer);
      return { ...prevState, layers: newLayers };
    });
  };

  const updateLayerPosition = (index, position) => {
    setState((prevState) => {
      const newLayers = [...prevState.layers];
      newLayers[index] = {
        ...newLayers[index],
        x: position.x,
        y: position.y,
      };
      return { ...prevState, layers: newLayers };
    });
  };

  // Add your existing handlers here
  const inputHandle = (e) => {
    setState({
      ...state,
      [e.target.name]: e.target.value
    });
  };

  const leftRotate = () => {
    setState({
      ...state,
      rotate: state.rotate - 90
    });
    const stateData = { ...state, rotate: state.rotate - 90 };
    storeData.insert(stateData);
  };

  const rightRotate = () => {
    setState({
      ...state,
      rotate: state.rotate + 90
    });
    const stateData = { ...state, rotate: state.rotate + 90 };
    storeData.insert(stateData);
  };

  const varticalFlip = () => {
    setState({
      ...state,
      vartical: state.vartical === 1 ? -1 : 1
    });
    const stateData = { ...state, vartical: state.vartical === 1 ? -1 : 1 };
    storeData.insert(stateData);
  };

  const horizentalFlip = () => {
    setState({
      ...state,
      horizental: state.horizental === 1 ? -1 : 1
    });
    const stateData = { ...state, horizental: state.horizental === 1 ? -1 : 1 };
    storeData.insert(stateData);
  };

  const addTextLayer = () => {
    const text = prompt('Enter text:', 'Sample Text');
    if (text) {
      const newLayer = {
        type: 'text',
        content: text,
        fontSize: 30,
        color: '#000000',
        x: 100,
        y: 100,
      };
      setState((prevState) => ({
        ...prevState,
        layers: [...prevState.layers, newLayer],
      }));
    }
  };

  const addImageLayer = (e) => {
    if (e.target.files.length !== 0) {
      const reader = new FileReader();
      reader.onload = () => {
        const newLayer = {
          type: 'image',
          imageUrl: reader.result,
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        };
        setState((prevState) => ({
          ...prevState,
          layers: [...prevState.layers, newLayer],
        }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

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

  const saveImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = details.naturalWidth;
    canvas.height = details.naturalHeight;

    ctx.filter = `brightness(${state.brightness}%) grayscale(${state.grayscale}%) sepia(${state.sepia}%) saturate(${state.saturate}%) contrast(${state.contrast}%) hue-rotate(${state.hueRotate}deg)`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(state.rotate * Math.PI / 180);
    ctx.scale(state.vartical, state.horizental);

    ctx.drawImage(details, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

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

    const link = document.createElement('a');
    link.download = 'image_edit.jpg';
    link.href = canvas.toDataURL();
    link.click();
  };

  const undo = () => {
    const data = storeData.undoEdit();
    if (data) {
      setState(data);
    }
  };

  const redo = () => {
    const data = storeData.redoEdit();
    if (data) {
      setState(data);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
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
              <div className="image" style={{ position: 'relative' }}>
                {state.image ? (
                  <>
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
                    {state.layers.map((layer, index) => (
                      <DraggableLayer
                        key={index}
                        id={index}
                        layer={layer}
                        index={index}
                        moveLayer={moveLayer}
                        updateLayerPosition={updateLayerPosition}
                      />
                    ))}
                  </>
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
                <button onClick={addTextLayer}>Add Text</button>
                <label htmlFor="add-image">Add Image Layer</label>
                <input onChange={addImageLayer} type="file" id="add-image" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default EditTemplate;