import React, { useState, useEffect, useCallback } from 'react';
import CalendarComponent from '../components/CalendarComponent';
import AWS from '../aws-config';
import io from 'socket.io-client';
import '../styles/Scheduling.css';
import config from '../config';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const socket = io(config.socketUrl, {
    auth: {
        token: localStorage.getItem('token')
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
});

const Scheduling = () => {
    const [ads, setAds] = useState([]);
    const [selectedRange, setSelectedRange] = useState([new Date(), new Date()]);
    const [selectedAd, setSelectedAd] = useState("");
    const [selectedDevice, setSelectedDevice] = useState("");
    const [scheduledAds, setScheduledAds] = useState([]);
    const [connectedDevices, setConnectedDevices] = useState([]);
    const [startTime, setStartTime] = useState("12:00");
    const [endTime, setEndTime] = useState("12:00");

    // Comprehensive schedule fetching and management
    const fetchAndManageSchedules = useCallback(async () => {
        try {
            const params = {
                TableName: 'AdSchedules'
            };
            const result = await dynamoDb.scan(params).promise();
            const currentTime = new Date().getTime();
            
            // Filter and process active schedules
            const processedSchedules = await Promise.all(
                result.Items.filter(schedule => {
                    const startTime = new Date(schedule.startDateTime).getTime();
                    const endTime = new Date(schedule.endDateTime).getTime();
                    
                    // Remove completely expired schedules
                    if (endTime < currentTime) {
                        dynamoDb.delete({
                            TableName: 'AdSchedules',
                            Key: { scheduleId: schedule.scheduleId }
                        }).promise().catch(console.error);
                        return false;
                    }

                    return endTime > currentTime;
                }).map(async (schedule) => {
                    const startTime = new Date(schedule.startDateTime).getTime();
                    const endTime = new Date(schedule.endDateTime).getTime();
                    const currentTime = new Date().getTime();

                    // Find the device
                    const deviceParams = {
                        TableName: 'Devices',
                        Key: { deviceId: schedule.deviceId }
                    };
                    const deviceResult = await dynamoDb.get(deviceParams).promise();
                    const currentDevice = deviceResult.Item;

                    // If current time is between start and end, and device is connected
                    if (startTime <= currentTime && endTime > currentTime && 
                        currentDevice && currentDevice.status === 'Connected') {
                        // Trigger the ad
                        socket.emit('trigger_device_ad', {
                            deviceId: currentDevice.socketId,
                            adUrl: schedule.adUrl,
                            ad: {
                                id: schedule.adId,
                                name: schedule.adName,
                                url: schedule.adUrl,
                                type: schedule.adType
                            }
                        });
                    }

                    // If current time is past start but before end, check for end time trigger
                    if (startTime < currentTime && endTime <= currentTime) {
                        if (currentDevice && currentDevice.status === 'Connected') {
                            socket.emit('stop_device_ad', currentDevice.socketId);
                            
                            // Remove the schedule
                            dynamoDb.delete({
                                TableName: 'AdSchedules',
                                Key: { scheduleId: schedule.scheduleId }
                            }).promise().catch(console.error);
                        }
                    }

                    return schedule;
                })
            );

            // Update local state with active schedules
            setScheduledAds(processedSchedules);
        } catch (error) {
            console.error("Error fetching and managing schedules:", error);
        }
    }, []);

    // Periodic schedule check
    useEffect(() => {
        // Initial fetch
        fetchAndManageSchedules();

        // Set up periodic check
        const intervalId = setInterval(fetchAndManageSchedules, 30000); // Check every 30 seconds

        // Socket event to handle potential missed schedules
        socket.on('sync_schedules', fetchAndManageSchedules);

        return () => {
            clearInterval(intervalId);
            socket.off('sync_schedules', fetchAndManageSchedules);
        };
    }, [fetchAndManageSchedules]);

    // Fetch ads from DynamoDB
    useEffect(() => {
        const fetchAds = async () => {
            try {
                const params = { TableName: 'Ads' };
                const result = await dynamoDb.scan(params).promise();
                const fetchedAds = result.Items.map(item => ({
                    id: item.ad_id,
                    name: item.name,
                    url: item.url,
                    type: item.type
                }));
                setAds(fetchedAds);
                if (fetchedAds.length > 0) {
                    setSelectedAd(fetchedAds[0].id);
                }
            } catch (error) {
                console.error("Error fetching ads:", error);
            }
        };
        fetchAds();
    }, []);

    // Device list management
    useEffect(() => {
        socket.on('device_list', (devices) => {
            const connected = devices.filter(device => device.status === 'Connected');
            setConnectedDevices(connected);
            if (connected.length === 1 && !selectedDevice) {
                setSelectedDevice(connected[0].deviceId);
            }
        });

        return () => {
            socket.off('device_list');
        };
    }, [selectedDevice]);

    // Validation function
    const validateSchedule = () => {
        const currentTime = new Date();
        const selectedStartDateTime = new Date(`${selectedRange[0].toDateString()} ${startTime}`);
        const selectedEndDateTime = new Date(`${selectedRange[1].toDateString()} ${endTime}`);
        
        if (selectedStartDateTime < currentTime) {
            alert("Cannot schedule ads in the past.");
            return false;
        }
        
        if (selectedEndDateTime <= selectedStartDateTime) {
            alert("End time must be after start time.");
            return false;
        }

        if (!selectedDevice || !selectedAd) {
            alert("Please select both a device and an ad.");
            return false;
        }

        const device = connectedDevices.find(d => d.deviceId === selectedDevice);
        if (!device || device.status !== 'Connected') {
            alert("Selected device is not connected.");
            return false;
        }

        return true;
    };

    // Handle schedule click
    const handleScheduleClick = async () => {
        if (!validateSchedule()) return;
    
        const selectedAdDetails = ads.find(ad => ad.id === selectedAd);
        const startDateTime = new Date(`${selectedRange[0].toDateString()} ${startTime}`);
        const endDateTime = new Date(`${selectedRange[1].toDateString()} ${endTime}`);
        const device = connectedDevices.find(d => d.deviceId === selectedDevice);
        
        const scheduleData = {
            scheduleId: `schedule_${Date.now()}`,
            deviceId: selectedDevice,
            deviceSocketId: device.socketId,
            deviceName: device.name,
            adId: selectedAd,
            adName: selectedAdDetails.name,
            adUrl: selectedAdDetails.url,
            adType: selectedAdDetails.type,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            status: 'scheduled'
        };
    
        try {
            // Store in DynamoDB
            await dynamoDb.put({
                TableName: 'AdSchedules',
                Item: scheduleData
            }).promise();

            // Notify other clients to sync
            socket.emit('sync_schedules');

            // Update local state
            setScheduledAds(prev => [...prev, scheduleData]);

            alert("Ad scheduled successfully!");
    
        } catch (error) {
            console.error("Error scheduling ad:", error);
            alert("Failed to schedule ad. Please try again.");
        }
    };

    return (
        <div className="scheduling">
            <h2 className="page-title">Ad Scheduling</h2>
            <div className="scheduling-calendar">
                <CalendarComponent 
                    onDateTimeRangeChange={(dateRange, start, end) => {
                        setSelectedRange(dateRange);
                        setStartTime(start);
                        setEndTime(end);
                    }} 
                />
                <div className="selection-container">
                    <label>
                        Select Ad
                        <select 
                            value={selectedAd} 
                            onChange={(e) => setSelectedAd(e.target.value)}
                        >
                            {ads.map((ad) => (
                                <option key={ad.id} value={ad.id}>
                                    {ad.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Select Device
                        <select 
                            value={selectedDevice} 
                            onChange={(e) => setSelectedDevice(e.target.value)}
                        >
                            {connectedDevices.length > 0 ? (
                                connectedDevices.map((device) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.name}
                                    </option>
                                ))
                            ) : (
                                <option value="">No devices available</option>
                            )}
                        </select>
                    </label>
                </div>
                <div className="button-container">
                    <button 
                        onClick={handleScheduleClick} 
                        className="schedule-button"
                        disabled={!selectedDevice || !selectedAd}
                    >
                        Schedule
                    </button>
                </div>
            </div>

            <div className="scheduled-ads">
                <h3>Scheduled Ads</h3>
                {scheduledAds.length > 0 ? (
                    <ul>
                        {scheduledAds.map((schedule) => (
                            <li key={schedule.scheduleId} className="scheduled-ad-item">
                                <strong>{schedule.adName}</strong> on <em>{schedule.deviceName}</em>
                                <br />
                                From: {new Date(schedule.startDateTime).toLocaleString()}
                                <br />
                                To: {new Date(schedule.endDateTime).toLocaleString()}
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