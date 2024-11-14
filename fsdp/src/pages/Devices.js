import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import AWS from '../aws-config';
import '../styles/devices.css';
import DeviceSwitch from '../components/DeviceSwitch';
import { FaTabletAlt, FaPlus, FaBullhorn } from 'react-icons/fa';

// Connect to the backend server via socket.io
const socket = io.connect('http://192.168.86.32:3001'); // Replace with your server's IP address and port
// Initialize DynamoDB Document Client
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const Devices = () => {
  const [isDevicesSelected, setIsDevicesSelected] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdConfirmModalOpen, setIsAdConfirmModalOpen] = useState(false);
  const [isAdShowingModalOpen, setIsAdShowingModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceName, setDeviceName] = useState('');
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [ads, setAds] = useState([]); // State to store ads from DynamoDB
  const [selectedAd, setSelectedAd] = useState(null); // State for selected ad in gallery

  useEffect(() => {
    socket.on('device_list', (devices) => {
      setConnectedDevices(devices);
    });

    socket.on('display_ad', (adImagePath) => {
      console.log("Received adImagePath:", adImagePath);
      setSelectedAd({ url: adImagePath }); // Expecting adImagePath to be a string URL
    });

    socket.on('ad_confirmed', () => {
      setIsAdShowingModalOpen(true);
    });

    return () => {
      socket.off('device_list');
      socket.off('display_ad');
      socket.off('ad_confirmed');
    };
  }, []);

  // Fetch ads from DynamoDB Ads table
  useEffect(() => {
    const fetchAdsFromDynamoDB = async () => {
      const params = {
        TableName: 'Ads',
      };

      try {
        const data = await dynamoDb.scan(params).promise();
        const retrievedAds = data.Items.map(ad => ({
          id: ad.ad_id,
          name: ad.name,
          type: ad.type,
          url: ad.url,
        }));
        console.log("Retrieved ads from DynamoDB:", retrievedAds);
        setAds(retrievedAds);
      } catch (error) {
        console.error("Error fetching ads from DynamoDB:", error);
      }
    };

    fetchAdsFromDynamoDB();
  }, []);

  const handleToggle = () => {
    setIsDevicesSelected(!isDevicesSelected);
  };

  const openModal = () => setIsModalOpen(true);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
    setDeviceName('');
  };

  const confirmDevice = () => {
    if (deviceName) {
      socket.emit('add_device', deviceName);
      closeModal();
    }
  };

  const handleDeviceStatusUpdate = (deviceName, status) => {
    socket.emit('update_device_status', deviceName, status);
  };

  const handleShowAdClick = () => {
    setIsAdConfirmModalOpen(true);
  };

  const confirmShowAd = () => {
    if (selectedAd && selectedAd.url) { // Ensure selectedAd and its URL are defined
      console.log("Emitting ad URL:", selectedAd.url);
      socket.emit('trigger_ad', selectedAd.url); // Use the selected ad's URL from DynamoDB
      setIsAdConfirmModalOpen(false);
      setIsAdShowingModalOpen(true); // Set state for showing ad confirmation modal
    } else {
      alert("Please select an ad to display.");
    }
  };
  
  const handleStopAdClick = () => {
    setSelectedAd(null); // Clear selected ad
    socket.emit('stop_ad');
    setIsAdShowingModalOpen(false); // Close ad showing modal
    alert('The ad has stopped showing.');
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

      {/* Gallery of Ads */}
      <div className="ad-gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '20px' }}>
        {ads.map((ad) => (
          <div
            key={ad.id}
            className={`ad-item ${selectedAd && selectedAd.id === ad.id ? 'selected' : ''}`}
            onClick={() => setSelectedAd(ad)}
            style={{
              border: selectedAd && selectedAd.id === ad.id ? '2px solid #6a4fe7' : '1px solid #ccc',
              borderRadius: '5px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: selectedAd && selectedAd.id === ad.id ? '#f0f4ff' : 'white',
              boxShadow: selectedAd && selectedAd.id === ad.id ? '0px 0px 8px rgba(106, 79, 231, 0.5)' : 'none',
            }}
          >
            <img
              src={ad.url}
              alt={ad.name}
              style={{
                width: '100%',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '5px',
                marginBottom: '5px'
              }}
            />
            <p style={{ fontWeight: 'bold', textAlign: 'center', color: selectedAd && selectedAd.id === ad.id ? '#6a4fe7' : 'black' }}>{ad.name}</p>
          </div>
        ))}
      </div>

      {/* Ad Modals */}
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

      {isAdConfirmModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Display Selected Ad?</h3>
            <p>Are you sure you want to display the selected ad to all connected devices?</p>
            <div className="modal-buttons">
              <button onClick={confirmShowAd}>Yes</button>
              <button onClick={() => setIsAdConfirmModalOpen(false)}>No</button>
            </div>
          </div>
        </div>
      )}

      {isAdShowingModalOpen && (
        <div className="ad-container">
          <div className="ad-content">
            <h3>An Ad is currently displaying</h3>
            <button className="stop-ad-button" onClick={handleStopAdClick}>Stop Showing Ad</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
