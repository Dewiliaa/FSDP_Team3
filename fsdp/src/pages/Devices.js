// Devices.js (Frontend)
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import '../App.css';
import DeviceSwitch from '../components/DeviceSwitch';
import { FaTabletAlt, FaPlus, FaBullhorn } from 'react-icons/fa';

// Connect to the backend server via socket.io
const socket = io.connect('http://192.168.248.1:3001'); // Replace with your server's IP address and port

const Devices = () => {
  const [isDevicesSelected, setIsDevicesSelected] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdConfirmModalOpen, setIsAdConfirmModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceName, setDeviceName] = useState('');
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [adImage, setAdImage] = useState(null);  // State for ad image path

  // When the component mounts, listen for device list updates
  useEffect(() => {
    // Listen for updates to the list of connected devices
    socket.on('device_list', (devices) => {
      setConnectedDevices(devices);
    });

    // Listen for ad display event
    socket.on('display_ad', (adImagePath) => {
      if (adImagePath === null) {
        setAdImage(null); // If adImagePath is null, stop the ad
      } else {
        setAdImage(adImagePath); // Set the ad image
      }
    });

    // Cleanup event listeners when the component unmounts
    return () => {
      socket.off('device_list');
      socket.off('display_ad');
    };
  }, []);

  // Toggle between "Devices" and "Groups" view
  const handleToggle = () => {
    setIsDevicesSelected(!isDevicesSelected);
  };

  // Open modal to add a new device
  const openModal = () => setIsModalOpen(true);

  // Close modal and reset form
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
    setDeviceName('');
  };

  // Confirm device addition
  const confirmDevice = () => {
    if (deviceName) {
      socket.emit('add_device', deviceName); // Send device name to the server
      closeModal();
    }
  };

  // Update device status
  const handleDeviceStatusUpdate = (deviceName, status) => {
    socket.emit('update_device_status', deviceName, status);
  };

  // Open the ad confirmation modal
  const handleShowAdClick = () => {
    setIsAdConfirmModalOpen(true);
  };

  // Confirm and trigger ad
  const confirmShowAd = () => {
    const adImagePath = 'https://rare-gallery.com/uploads/posts/191349-rin-tohsaka-1920x1152.jpg'; // Example ad image
    socket.emit('trigger_ad', adImagePath); // Send ad image to the server
    setIsAdConfirmModalOpen(false);
  };

  // Stop showing the ad
  const handleStopAdClick = () => {
    console.log('Stopping ad...');
    setAdImage(null);  // Clear the ad image locally
    socket.emit('stop_ad');  // Notify the server to stop showing the ad
  };

  return (
    <div className="devices">
      <h2 className="page-title">{isDevicesSelected ? 'Devices' : 'Groups'}</h2>

      <div className="switch-container">
        <DeviceSwitch isDevicesSelected={isDevicesSelected} onToggle={handleToggle} />
      </div>

      <div className="button-container">
        <button className="select-button">
          <FaTabletAlt className="icon" />
          {isDevicesSelected ? 'Select Devices' : 'Select Groups'}
        </button>
        <button className="add-button" onClick={openModal}>
          <FaPlus className="icon" />
          {isDevicesSelected ? 'Add Device' : 'Add Group'}
        </button>
        <button className="ad-button" onClick={handleShowAdClick}>
          <FaBullhorn className="icon" />
          Show Ad
        </button>

        {/* Stop Ad Button always visible */}
        <button className="stop-ad-button" onClick={handleStopAdClick}>
          Stop Showing Ad
        </button>
      </div>

      {connectedDevices.length === 0 ? (
        <div className="no-devices-message">There are currently no devices added.</div>
      ) : (
        <div className="device-grid">
          {connectedDevices.map((device, index) => (
            <div key={index} className="device-container">
              {device.name} - {device.status}
              <button onClick={() => handleDeviceStatusUpdate(device.name, 'Connected')}>
                Set to Connected
              </button>
              <button onClick={() => handleDeviceStatusUpdate(device.name, 'Disconnected')}>
                Set to Disconnected
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Display ad if there is an ad image */}
      {adImage && (
        <div className="ad-overlay">
          <img src={adImage} alt="Ad" />
        </div>
      )}

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Select a Device</h3>
            <ul className="device-list">
              {['Device 1', 'Device 2', 'Device 3'].map((device, index) => (
                <li 
                  key={index} 
                  onClick={() => setSelectedDevice(device)}
                  className={selectedDevice === device ? 'selected' : ''}>
                  {device}
                </li>
              ))}
            </ul>
            {selectedDevice && (
              <input
                className="device-name-input"
                type="text"
                placeholder="Enter device name"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            )}
            <div className="modal-buttons">
              <button onClick={confirmDevice}>Confirm</button>
              <button onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal for displaying the ad */}
      {isAdConfirmModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Display Ad to All Screens?</h3>
            <p>Are you sure you want to display the ad to all connected devices?</p>
            <div className="modal-buttons">
              <button onClick={confirmShowAd}>Yes</button>
              <button onClick={() => setIsAdConfirmModalOpen(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
