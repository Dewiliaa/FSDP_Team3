import React, { useState, useEffect } from 'react';
import CalendarComponent from '../components/CalendarComponent'; // Import the calendar component
import AWS from '../aws-config'; // Import AWS configuration
import io from 'socket.io-client'; // Import socket.io-client
import '../styles/Scheduling.css'; // Import styles
import config from '../config'; // Import config

const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Initialize the socket connection
const socket = io(config.apiBaseUrl, {
    auth: {
        token: localStorage.getItem('token') // Assuming token is stored in localStorage
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
});

const Scheduling = () => {
    const [ads, setAds] = useState([]); // Store ads from the database
    const [selectedRange, setSelectedRange] = useState([new Date(), new Date()]); // Date range for scheduling
    const [selectedAd, setSelectedAd] = useState(""); // Store selected ad
    const [selectedDevice, setSelectedDevice] = useState(""); // Store selected device
    const [scheduledAds, setScheduledAds] = useState([]); // Store scheduled ads
    const [connectedDevices, setConnectedDevices] = useState([]); // Store connected devices

    // Add startTime and endTime state variables
    const [startTime, setStartTime] = useState("12:00");
    const [endTime, setEndTime] = useState("12:00");

    // Load schedules from localStorage
    useEffect(() => {
        const savedSchedules = JSON.parse(localStorage.getItem("adSchedules")) || [];
        setScheduledAds(savedSchedules);
    }, []);

    // Fetch ads from DynamoDB
    useEffect(() => {
        const fetchAds = async () => {
            try {
                const adsParams = { TableName: 'Ads' };
                const adsData = await dynamoDb.scan(adsParams).promise();
                const fetchedAds = adsData.Items.map(item => ({
                    id: item.ad_id,
                    name: item.name,
                    url: item.url,
                }));
                setAds(fetchedAds);
                if (fetchedAds.length > 0) {
                    setSelectedAd(fetchedAds[0].id); // Set the first ad as default
                }
            } catch (error) {
                console.error("Error fetching ads:", error);
            }
        };
        fetchAds();
    }, []);

    // Fetch connected devices from the server (device_list event)
    useEffect(() => {
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id); // Confirm socket is connected
        });

        socket.on('device_list', (devices) => {
            console.log('Received device list:', devices); // Log received devices
            const connected = devices.filter(device => device.status === 'Connected');
            console.log('Filtered connected devices:', connected); // Log filtered connected devices
            setConnectedDevices(connected); // Update the connectedDevices state

            // Automatically select the first device if only one is available
            if (connected.length === 1 && !selectedDevice) {
                setSelectedDevice(connected[0].deviceId); // Automatically select the device if it's the only one
            }
        });

        return () => {
            socket.off('device_list');
            socket.off('connect');
        };
    }, [selectedDevice]); // Re-run when selectedDevice changes

    // Validate if the start time is valid (must be current time or later)
    const validateStartTime = () => {
        const currentTime = new Date();
        const selectedStartDateTime = new Date(`${selectedRange[0].toDateString()} ${startTime}`);
        
        if (selectedStartDateTime < currentTime) {
            alert("You cannot schedule an ad for a time in the past. Please select a time equal to or later than the current time.");
            return false;
        }
        return true;
    };

    const handleScheduleClick = () => {
        console.log("Selected Ad:", selectedAd);
        console.log("Selected Device:", selectedDevice);
    
        // Validate the start time
        if (!validateStartTime()) {
            return;
        }
    
        if (!selectedDevice || !selectedAd) {
            alert("Please select both a device and an ad.");
            return;
        }
    
        const selectedDeviceDetails = connectedDevices.find(device => device.deviceId === selectedDevice);
        if (!selectedDeviceDetails || selectedDeviceDetails.status !== 'Connected') {
            alert("Please select a connected device.");
            return;
        }
    
        const startDateTime = new Date(`${selectedRange[0].toDateString()} ${startTime}`);
        const endDateTime = new Date(`${selectedRange[1].toDateString()} ${endTime}`);
    
        if (endDateTime <= startDateTime) {
            alert("The end time must be after the start time.");
            return;
        }
    
        const selectedAdDetails = ads.find(ad => ad.id === selectedAd);
    
        const newSchedule = {
            ad: selectedAdDetails.name,
            device: selectedDevice,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            adUrl: selectedAdDetails.url,
            startTime: startDateTime.toLocaleString(), // Added startTime to the scheduled ad data
        };
    
        const updatedSchedules = [...scheduledAds, newSchedule];
        setScheduledAds(updatedSchedules);
        localStorage.setItem("adSchedules", JSON.stringify(updatedSchedules));
    
        // Emit the scheduled ad to devices immediately for testing
        socket.emit('display_ad', {
            adUrl: selectedAdDetails.url,
            deviceId: selectedDevice,
            ad: selectedAdDetails.name,
            scheduledTime: startDateTime.toLocaleString(), // Send start time with the ad data
        });
    
        alert("Ad scheduled and broadcasted immediately!");
    
        // Schedule the ad to appear at the right time
        const delay = startDateTime - new Date(); // Calculate the delay in milliseconds
        if (delay > 0) {
            setTimeout(() => {
                socket.emit('display_ad', {
                    adUrl: selectedAdDetails.url,
                    deviceId: selectedDevice,
                    ad: selectedAdDetails.name,
                    scheduledTime: startDateTime.toLocaleString(), // Send start time with the ad data
                });
                console.log(`Ad ${selectedAdDetails.name} is now displayed on device ${selectedDevice}`);
            }, delay); // Emit the event when the time comes
        }
    };
        
    // Clear expired ads
    useEffect(() => {
        const clearExpiredAds = () => {
            const currentTime = new Date().toISOString();
            const filteredAds = scheduledAds.filter(ad => new Date(ad.endDateTime) > new Date(currentTime));
            setScheduledAds(filteredAds);
            localStorage.setItem("adSchedules", JSON.stringify(filteredAds));
        };

        clearExpiredAds();  // Clear expired ads when the component mounts or the ad schedules are updated
    }, [scheduledAds]);  // Re-run when scheduled ads change

    return (
        <div className="scheduling">
            <h2 className="page-title">Ad Scheduling</h2>
            <div className="scheduling-calendar">
                <CalendarComponent onDateTimeRangeChange={(dateRange, start, end) => {
                    setSelectedRange(dateRange);
                    setStartTime(start);
                    setEndTime(end);
                }} />
                <div className="selection-container">
                    <label>
                        Select Ad
                        <select value={selectedAd} onChange={(e) => setSelectedAd(e.target.value)}>
                            {ads.map((ad) => (
                                <option key={ad.id} value={ad.id}>
                                    {ad.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Select Device
                        <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
                            {connectedDevices.length > 0 ? (
                                connectedDevices.map((device) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.name}
                                    </option>
                                ))
                            ) : (
                                <option>No devices available</option>
                            )}
                        </select>
                    </label>
                </div>
                <div className="button-container">
                    <button onClick={handleScheduleClick} className="schedule-button">Schedule</button>
                </div>
            </div>

            <div className="scheduled-ads">
                <h3>Scheduled Ads</h3>
                {scheduledAds.length > 0 ? (
                    <ul>
                        {scheduledAds.map((ad, index) => (
                            <li key={index} className="scheduled-ad-item">
                                <strong>{ad.ad}</strong> on <em>{ad.device}</em> from{" "}
                                {new Date(ad.startDateTime).toLocaleString()} to{" "}
                                {new Date(ad.endDateTime).toLocaleString()}<br />
                                <strong>Start Time:</strong> {ad.startTime}  {/* Display the start time */}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No ads scheduled yet.</p>
                )}
            </div>
        </div>
    );
};

export default Scheduling;
