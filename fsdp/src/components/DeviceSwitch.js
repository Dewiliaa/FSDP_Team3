import React from "react";
import '../App.css';

const DeviceSwitch = ({ isDevicesSelected, onToggle }) => {
    return (
        <label className="switch">
            <input type="checkbox" checked={!isDevicesSelected} onChange={onToggle} />
            <span className="slider">
                <span className="slider-text-left">Devices</span>
                <span className="slider-text-right">Groups</span>
            </span>
        </label>
    );
};

export default DeviceSwitch;
