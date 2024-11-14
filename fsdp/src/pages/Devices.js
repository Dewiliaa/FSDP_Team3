import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import AWS from '../aws-config';
import '../styles/devices.css';
import DeviceSwitch from '../components/DeviceSwitch';
import { FaTabletAlt, FaPlus, FaBullhorn } from 'react-icons/fa';

const socket = io.connect('http://192.168.86.32:3001'); // Replace with your server's IP address and port
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const Devices = () => {
  const [isDevicesSelected, setIsDevicesSelected] = useState(true);
  const [isAdConfirmModalOpen, setIsAdConfirmModalOpen] = useState(false);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false); // State for Add Device modal
  const [deviceName, setDeviceName] = useState(''); // State to store the device name input
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [ads, setAds] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [adImage, setAdImage] = useState(null);
  const isServerSite = window.location.hostname === 'localhost';

  useEffect(() => {
    socket.on('device_list', (devices) => setConnectedDevices(devices));

    // Display ad only on non-localhost clients
    socket.on('display_ad', (adImagePath) => {
      if (!isServerSite) {
        setAdImage(adImagePath);
      }
    });

    // Confirm ad is showing for localhost
    socket.on('ad_confirmed', () => setIsAdConfirmModalOpen(false));

    return () => {
      socket.off('device_list');
      socket.off('display_ad');
      socket.off('ad_confirmed');
    };
  }, []);

  useEffect(() => {
    const fetchAdsFromDynamoDB = async () => {
      const params = { TableName: 'Ads' };

      try {
        const data = await dynamoDb.scan(params).promise();
        setAds(data.Items.map(ad => ({
          id: ad.ad_id,
          name: ad.name,
          url: ad.url,
        })));
      } catch (error) {
        console.error("Error fetching ads from DynamoDB:", error);
      }
    };

    fetchAdsFromDynamoDB();
  }, []);

  const handleShowAdClick = () => setIsAdConfirmModalOpen(true);

  const confirmShowAd = () => {
    if (selectedAd && selectedAd.url) {
      socket.emit('trigger_ad', selectedAd.url);
      setIsAdConfirmModalOpen(false);
    } else {
      alert("Please select an ad to display.");
    }
  };

  const handleStopAdClick = () => {
    setAdImage(null);
    socket.emit('stop_ad');
    alert('The ad has stopped showing.');
  };

  const openAddDeviceModal = () => setIsAddDeviceModalOpen(true);

  const closeAddDeviceModal = () => {
    setIsAddDeviceModalOpen(false);
    setDeviceName('');
  };

  const confirmAddDevice = () => {
    if (deviceName) {
      socket.emit('add_device', deviceName); // Emit device name to the server
      closeAddDeviceModal(); // Close modal and reset input
    } else {
      alert("Please enter a device name.");
    }
  };

  return (
    <div className="devices">
      <h2 className="page-title">{isDevicesSelected ? 'Devices' : 'Groups'}</h2>

      <div className="switch-container">
        <DeviceSwitch isDevicesSelected={isDevicesSelected} onToggle={() => setIsDevicesSelected(!isDevicesSelected)} />
      </div>

      <div className="button-container">
        <button className="select-button">
          <FaTabletAlt className="icon" />
          {isDevicesSelected ? 'Select Devices' : 'Select Groups'}
        </button>
        <button className="add-button" onClick={openAddDeviceModal}>
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
              }}
            />
            <p style={{ textAlign: 'center', fontWeight: 'bold', color: selectedAd && selectedAd.id === ad.id ? '#6a4fe7' : 'black' }}>{ad.name}</p>
          </div>
        ))}
      </div>

      {/* Full-Screen Ad Display for Clients */}
    {adImage && (
      <div className="full-screen-ad" style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: '#000', // Opaque black background
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1000
        }}>
      <img src={adImage} alt="Advertisement" style={{ maxWidth: '100%', maxHeight: '95%', borderRadius: '10px' }} />
    </div>
    )}

      {/* Ad Confirmation Modal */}
      {isAdConfirmModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Confirm Ad Display</h3>
            <p>Do you want to display the selected ad?</p>
            <button onClick={confirmShowAd}>Confirm</button>
            <button onClick={() => setIsAdConfirmModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {isAddDeviceModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Device</h3>
            <input
              type="text"
              placeholder="Enter device name"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <button onClick={confirmAddDevice}>Confirm</button>
            <button onClick={closeAddDeviceModal}>Cancel</button>
          </div>
        </div>
      )}

      {/* Always-Visible Stop Ad Button for Localhost Only */}
      {isServerSite && (
        <button
          onClick={handleStopAdClick}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#6a4fe7',
            color: 'white',
            borderRadius: '5px',
            padding: '10px 15px',
            fontSize: '14px',
            cursor: 'pointer',
            zIndex: 1100,
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          Stop Showing Ad
        </button>
      )}
    </div>
  );
};

export default Devices;
