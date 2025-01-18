import React, { useState, useEffect } from 'react';
import CalendarComponent from '../components/CalendarComponent';
import AWS from '../aws-config'; // Import AWS configuration
import '../styles/Scheduling.css';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const Scheduling = () => {
    const [ads, setAds] = useState([]); // Store ads from the database
    const [selectedRange, setSelectedRange] = useState([new Date(), new Date()]);
    const [startTime, setStartTime] = useState("00:00");
    const [endTime, setEndTime] = useState("00:00"); // Added end time
    const [selectedAd, setSelectedAd] = useState("");
    const [selectedDevice, setSelectedDevice] = useState("Device 1");
    const [scheduledAds, setScheduledAds] = useState([]);

    // Load schedules from localStorage
    useEffect(() => {
        const savedSchedules = JSON.parse(localStorage.getItem("adSchedules")) || [];
        setScheduledAds(savedSchedules);
    }, []);

    // Fetch ads from the database on component mount
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

    // Cleanup expired schedules periodically
    useEffect(() => {
        const interval = setInterval(() => {
            const currentTime = new Date();
            const updatedSchedules = scheduledAds.filter(ad => new Date(ad.startDateTime) > currentTime);
            setScheduledAds(updatedSchedules);
            localStorage.setItem("adSchedules", JSON.stringify(updatedSchedules));
        }, 1000 * 60); // Check every minute

        return () => clearInterval(interval); // Cleanup on unmount
    }, [scheduledAds]);

    // Function to handle scheduling
    const handleScheduleClick = () => {
        if (!startTime || !endTime) {
            alert("Both start time and end time must be filled to post the advertisement.");
            return;
        }

        const startDateTime = new Date(
            `${selectedRange[0].toDateString()} ${startTime}`
        );

        const endDateTime = new Date(
            `${selectedRange[1].toDateString()} ${endTime}`
        );

        if (startDateTime >= endDateTime) {
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
        };

        const updatedSchedules = [...scheduledAds, newSchedule];
        setScheduledAds(updatedSchedules);
        localStorage.setItem("adSchedules", JSON.stringify(updatedSchedules));

        alert("Ad scheduled successfully!");
    };

    return (
        <div className="scheduling">
            <h2 className="page-title">Ad Scheduling</h2>
            <div className="scheduling-calendar">
                <CalendarComponent onDateTimeRangeChange={setSelectedRange} />
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
                            <option value="Device 1">Device 1</option>
                            <option value="Device 2">Device 2</option>
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
                                {new Date(ad.endDateTime).toLocaleString()}
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
