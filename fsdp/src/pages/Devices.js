import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import AWS from '../aws-config';
import '../styles/devices.css';
import { FaEllipsisH } from 'react-icons/fa';
import DeviceSwitch from '../components/DeviceSwitch';
import { FaTabletAlt, FaPlus, FaBullhorn } from 'react-icons/fa';

const socket = io.connect('http://192.168.1.233:3001'); // Replace with your server's IP address and port
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const Devices = () => {
  const [isDevicesSelected, setIsDevicesSelected] = useState(true);
  const [isAdConfirmModalOpen, setIsAdConfirmModalOpen] = useState(false);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deviceAds, setDeviceAds] = useState(new Map());
  const [isDisplayModalOpen, setIsDisplayModalOpen] = useState(false);
  const [selectedDeviceForAd, setSelectedDeviceForAd] = useState(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [deviceToRemove, setDeviceToRemove] = useState(null);

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
  }, [ads, isServerSite]);

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

  useEffect(() => {
    // Set up heartbeat
    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat');
    }, 5000);
  
    return () => clearInterval(heartbeatInterval);
  }, []);

  useEffect(() => {
    // Announce this device's presence
    socket.emit('device_connected', navigator.userAgent);
  
    // Listen for available devices updates
    socket.on('available_devices', (devices) => {
      setAvailableDevices(devices);
    });
  
    // Set up heartbeat
    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat');
    }, 5000);
  
    return () => {
      clearInterval(heartbeatInterval);
      socket.off('available_devices');
    };
  }, []);

  useEffect(() => {
    socket.on('device_ad_update', ({ deviceId, ad }) => {
      const newDeviceAds = new Map(deviceAds);
      if (ad) {
        newDeviceAds.set(deviceId, ad);
      } else {
        newDeviceAds.delete(deviceId);
      }
      setDeviceAds(newDeviceAds);
    });
  
    return () => {
      socket.off('device_ad_update');
    };
  }, [deviceAds]);

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
    if (!selectedDevice) {
      alert("Please select a device.");
      return;
    }
  
    const deviceDetails = selectedDevice
      ? {
          deviceName: deviceName || `${selectedDevice.info.device}_${selectedDevice.socketId.slice(0, 6)}`,
          socketId: selectedDevice.socketId,
        }
      : {
          deviceName,
          socketId: socket.id,
        };
  
    socket.emit('register_device', deviceDetails);
    closeAddDeviceModal();
  };

  const toggleDropdown = (deviceName) => {
    setOpenDropdown((prev) => (prev === deviceName ? null : deviceName));
  };  

  const handleViewDevice = (device) => {
    setSelectedDevice(device);
    setIsViewModalOpen(true);
    setOpenDropdown(null);
  };
  
  const handleDisplayAd = (device) => {
    const isDisplaying = deviceAds.has(device.socketId);
    if (isDisplaying) {
      // Stop the ad
      socket.emit('stop_device_ad', device.socketId);
      const newDeviceAds = new Map(deviceAds);
      newDeviceAds.delete(device.socketId);
      setDeviceAds(newDeviceAds);
    } else {
      // Show ad selection modal
      setSelectedDeviceForAd(device);
      setIsDisplayModalOpen(true);
    }
    setOpenDropdown(null);
  };
  
  const handleRemoveDevice = (device) => {
    setDeviceToRemove(device);
    setIsRemoveModalOpen(true);
    setOpenDropdown(null);
  };
  
  const confirmRemoveDevice = () => {
    if (deviceToRemove) {
      socket.emit('remove_device', deviceToRemove.socketId);
      setIsRemoveModalOpen(false);
      setDeviceToRemove(null);
    }
  };

  const confirmDisplayAd = () => {
    if (selectedAd && selectedDeviceForAd) {
      socket.emit('trigger_device_ad', {
        deviceId: selectedDeviceForAd.socketId,
        adUrl: selectedAd.url,
        ad: selectedAd // Send full ad object
      });
      
      // Update device ads map
      const newDeviceAds = new Map(deviceAds);
      newDeviceAds.set(selectedDeviceForAd.socketId, selectedAd);
      setDeviceAds(newDeviceAds);
      
      setIsDisplayModalOpen(false);
      setSelectedDeviceForAd(null);
    } else {
      alert("Please select an ad to display.");
    }
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
                  <button onClick={() => handleViewDevice(device)}>View</button>
                  <button onClick={() => handleDisplayAd(device)}>
                    {deviceAds.has(device.socketId) ? 'Stop Display' : 'Display'}
                  </button>
                  <button onClick={() => handleRemoveDevice(device)}>Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}


      {/* Device View Modal */}
      {isViewModalOpen && selectedDevice && (
        <div className="modal">
          <div className="modal-content">
            <h3>Device Details</h3>
            <div className="device-details">
              <p><strong>Name:</strong> {selectedDevice.name}</p>
              <p><strong>Status:</strong> {selectedDevice.status}</p>
              <p><strong>Operating System:</strong> {selectedDevice.info.os}</p>
              <p><strong>Device Type:</strong> {selectedDevice.info.device}</p>
              <p><strong>Browser:</strong> {selectedDevice.info.browser}</p>
              <p><strong>Last Seen:</strong> {new Date(selectedDevice.lastSeen).toLocaleString()}</p>
              
              {/* Current Display Section */}
              <div className="current-display" style={{ marginTop: '20px' }}>
                <h4>Currently Displaying</h4>
                {deviceAds.has(selectedDevice.socketId) ? (
                  <div className="current-ad" style={{ marginTop: '10px' }}>
                    <p><strong>{deviceAds.get(selectedDevice.socketId).name}</strong></p>
                    {deviceAds.get(selectedDevice.socketId).type === 'image' ? (
                      <img 
                        src={deviceAds.get(selectedDevice.socketId).url}
                        alt={deviceAds.get(selectedDevice.socketId).name}
                        style={{
                          maxWidth: '200px',
                          maxHeight: '150px',
                          objectFit: 'contain',
                          marginTop: '10px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    ) : (
                      <video
                        src={deviceAds.get(selectedDevice.socketId).url}
                        style={{
                          maxWidth: '200px',
                          maxHeight: '150px',
                          objectFit: 'contain',
                          marginTop: '10px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                        controls
                      />
                    )}
                  </div>
                ) : (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>No ad currently displaying</p>
                )}
              </div>
            </div>
            <button onClick={() => setIsViewModalOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Display Ad to Device Modal */}
      {isDisplayModalOpen && selectedDeviceForAd && (
        <div className="modal">
          <div className="modal-content">
            <h3>Display Ad to {selectedDeviceForAd.name}</h3>
            <div className="ad-selection">
              <h4>Select an Advertisement</h4>
              <div className="ad-grid" style={{ maxHeight: '300px', overflow: 'auto' }}>
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    className={`ad-item ${selectedAd && selectedAd.id === ad.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAd(ad)}
                    style={{
                      border: selectedAd && selectedAd.id === ad.id ? '2px solid #6a4fe7' : '1px solid #ccc',
                      padding: '8px',
                      margin: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <p>{ad.name}</p>
                    <small>{ad.type}</small>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button onClick={confirmDisplayAd}>Display Ad</button>
              <button onClick={() => {
                setIsDisplayModalOpen(false);
                setSelectedDeviceForAd(null);
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {isRemoveModalOpen && deviceToRemove && (
        <div className="modal">
          <div className="modal-content">
            <h3>Remove Device</h3>
            <p>Are you sure you want to remove {deviceToRemove.name}?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <button onClick={confirmRemoveDevice}>Yes, Remove</button>
              <button onClick={() => {
                setIsRemoveModalOpen(false);
                setDeviceToRemove(null);
              }}>Cancel</button>
            </div>
          </div>
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
            
            {/* Available Devices Section */}
            <div className="available-devices-section" style={{ marginBottom: '20px' }}>
              <h4>Available Devices</h4>
              {availableDevices.filter(device => !device.isRegistered).map((device) => (
                <div 
                  key={device.socketId}
                  className={`device-option ${selectedDevice?.socketId === device.socketId ? 'selected' : ''}`}
                  onClick={() => setSelectedDevice(device)}
                  style={{
                    padding: '10px',
                    margin: '5px 0',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    backgroundColor: selectedDevice === device ? '#FFFFFF' : '#f5f5f5',
                    border: '1px solid #ccc',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>
                    {device.info.device} ({device.info.os})
                  </div>
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    Browser: {device.info.browser}
                    {device.socketId === socket.id ? ' (This Device)' : ''}
                  </div>
                </div>
              ))}
            </div>

            <div className="custom-name-section">
              <h4>Device Name</h4>
              <input
                type="text"
                placeholder="Enter custom device name (optional)"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {/* Add Device Button */}
              <button
                className="confirm-button"
                onClick={confirmAddDevice}
                disabled={!selectedDevice} // Disable button if no device is selected
                style={{
                  backgroundColor: !selectedDevice ? '#ccc' : '#6a4fe7', // Gray color for disabled state
                  cursor: !selectedDevice ? 'not-allowed' : 'pointer',  // Pointer cursor only when enabled
                }}
              >
                Add Device
              </button>
              <button onClick={closeAddDeviceModal}>Cancel</button>
            </div>
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
