import React, { useState } from 'react';
import '../App.css';
import DeviceSwitch from '../components/DeviceSwitch';
import { FaTabletAlt, FaPlus } from 'react-icons/fa';

const Devices = () => {
    const [isDevicesSelected, setIsDevicesSelected] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [deviceName, setDeviceName] = useState('');
    const [connectedDevices, setConnectedDevices] = useState([]);

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
            setConnectedDevices([...connectedDevices, { name: deviceName, status: 'Not connected' }]);
            closeModal();
        }
    };

    return (
        <div className="devices">
            <h2 className="page-title">{isDevicesSelected ? "Devices" : "Groups"}</h2>

            <div className="switch-container">
                <DeviceSwitch isDevicesSelected={isDevicesSelected} onToggle={handleToggle} />
            </div>

            <div className="button-container">
                <button className="select-button">
                    <FaTabletAlt className="icon" />
                    {isDevicesSelected ? "Select Devices" : "Select Groups"}
                </button>
                <button className="add-button" onClick={openModal}>
                    <FaPlus className="icon" />
                    {isDevicesSelected ? "Add Device" : "Add Group"}
                </button>
            </div>

            {connectedDevices.length === 0 ? (
                <div className="no-devices-message">
                    There are currently no devices added.
                </div>
            ) : (
                <div className="device-grid">
                    {connectedDevices.map((device, index) => (
                        <div key={index} className="device-container">
                            {device.name} - {device.status}
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Select a Device</h3>
                        <ul className="device-list">
                            {["Device 1", "Device 2", "Device 3"].map((device, index) => (
                                <li 
                                    key={index} 
                                    onClick={() => setSelectedDevice(device)}
                                    className={selectedDevice === device ? 'selected' : ''}
                                >
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
        </div>
    );
};

export default Devices;
