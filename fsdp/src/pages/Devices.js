import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import AWS from '../aws-config';
import '../styles/devices.css';
import { FaEllipsisH } from 'react-icons/fa';
import DeviceSwitch from '../components/DeviceSwitch';
import { FaTabletAlt, FaPlus, FaBullhorn, FaPlay } from 'react-icons/fa';

const socket = io.connect('http://192.168.1.233:3001'); // Replace with your server's IP address and port
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const Devices = () => {
  const [isDevicesSelected, setIsDevicesSelected] = useState(true);
  const [isAdConfirmModalOpen, setIsAdConfirmModalOpen] = useState(false);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);

  const [ads, setAds] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [liveAd, setLiveAd] = useState(''); // State for currently live ad
  const isServerSite = window.location.hostname === 'localhost';

  useEffect(() => {
    socket.on('device_list', (devices) => setConnectedDevices(devices));

    // Display ad only on non-localhost clients
    socket.on('display_ad', (adMediaPath) => {
      if (!isServerSite) {
        const ad = ads.find(ad => ad.url === adMediaPath);
        setSelectedAd(ad || null);
        if (ad?.type === 'image') {
          setIsImageModalOpen(true);
        } else if (ad?.type === 'video') {
          setIsVideoModalOpen(true);
        }
        setLiveAd(ad ? ad.name : ''); // Update live ad name
      }
    });

    // Confirm ad is showing for localhost
    socket.on('ad_confirmed', () => setIsAdConfirmModalOpen(false));

    return () => {
      socket.off('device_list');
      socket.off('display_ad');
      socket.off('ad_confirmed');
    };
  }, [ads]);

  useEffect(() => {
    const fetchAdsFromDynamoDB = async () => {
      const params = { TableName: 'Ads' };

      try {
        const data = await dynamoDb.scan(params).promise();
        setAds(data.Items.map(ad => ({
          id: ad.ad_id,
          name: ad.name,
          url: ad.url,
          type: ad.type,
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
      socket.emit('show_ad_message', `Now playing: ${selectedAd.name}`);
      setLiveAd(selectedAd.name); // Set live ad name in the banner
      setIsAdConfirmModalOpen(false);
    } else {
      alert("Please select an ad to display.");
    }
  };

  const handleStopAdClick = () => {
    setIsImageModalOpen(false);
    setIsVideoModalOpen(false);
    socket.emit('stop_ad');
    socket.emit('show_ad_message', "No ad is currently playing.");
    setLiveAd(''); // Clear live ad banner when stopped
    alert('The ad has stopped showing.');
  };

  const openAddDeviceModal = () => setIsAddDeviceModalOpen(true);

  const closeAddDeviceModal = () => {
    setIsAddDeviceModalOpen(false);
    setDeviceName('');
  };

  const confirmAddDevice = () => {
    if (deviceName) {
      socket.emit('add_device', deviceName);
      closeAddDeviceModal();
    } else {
      alert("Please enter a device name.");
    }
  };

  const toggleDropdown = (deviceName) => {
    setOpenDropdown((prev) => (prev === deviceName ? null : deviceName));
  };  

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.device-container')) {
        setOpenDropdown(null);
      }
    };
  
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);
  

  return (
    <div className="devices">
      {/* Live Ad Banner - Display only on localhost, above media section */}
      {isServerSite && liveAd && (
        <div className="live-ad-banner" style={{
          width: '100%',
          backgroundColor: '#333',
          color: 'white',
          textAlign: 'center',
          padding: '10px',
          fontWeight: 'bold',
          marginBottom: '10px', // Adds space below the banner
        }}>
          Currently Live: {liveAd}
        </div>
      )}

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
              <span>{device.name} - {device.status}</span>
              <button
                className="more-button"
                onClick={() => toggleDropdown(device.name)}
              >
                <FaEllipsisH />
              </button>
              {openDropdown === device.name && (
                <div className={`dropdown-menu ${openDropdown === device.name ? 'show' : ''}`}>
                  <button onClick={() => console.log(`Viewing ${device.name}`)}>View</button>
                  <button onClick={() => console.log(`Displaying ${device.name}`)}>Display</button>
                  <button onClick={() => console.log(`Deleting ${device.name}`)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Gallery of Ads */}
      <div className="ads-header">
        <h3>Advertisement Gallery</h3>
        <hr />
      </div>
      <div className="ad-gallery">
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
            {ad.type === 'image' ? (
              <img
                src={ad.url}
                alt={ad.name}
                style={{
                  width: '100%',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '5px',
                }}
                onClick={() => { setIsImageModalOpen(true); setSelectedAd(ad); }}
              />
            ) : (
              <video
                src={ad.url}
                controls
                style={{
                  width: '100%',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '5px',
                }}
                onClick={() => { setIsVideoModalOpen(true); setSelectedAd(ad); }}
              />
            )}
            <p style={{ textAlign: 'center', fontWeight: 'bold', color: selectedAd && selectedAd.id === ad.id ? '#6a4fe7' : 'black' }}>{ad.name}</p>
          </div>
        ))}
      </div>

      {/* Full-Screen Image Modal */}
      {isImageModalOpen && selectedAd && selectedAd.type === 'image' && (
        <div className="full-screen-ad" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: '#000', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1000
        }}>
          <img
            src={selectedAd.url}
            alt={selectedAd.name}
            style={{
              maxWidth: '100%',
              maxHeight: '95%',
              borderRadius: '10px',
            }}
            onClick={() => setIsImageModalOpen(false)}
          />
        </div>
      )}

      {/* Full-Screen Video Modal */}
      {isVideoModalOpen && selectedAd && selectedAd.type === 'video' && (
        <div className="full-screen-ad">
          <video
            src={selectedAd.url}
            controls
            autoPlay
            loop
            onClick={() => setIsVideoModalOpen(false)}
          />
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
          className="stop-ad-button"
        >
          Stop Showing Ad
        </button>
      )}
    </div>
  );
};

export default Devices;
