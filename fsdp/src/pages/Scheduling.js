import React, { useState } from 'react';
import CalendarComponent from '../components/CalendarComponent';
import '../styles/Scheduling.css';

const Scheduling = () => {
    const [selectedRange, setSelectedRange] = useState([new Date(), new Date()]);
    const [startTime, setStartTime] = useState("00:00");
    const [endTime, setEndTime] = useState("23:59");

    const handleDateTimeRangeChange = (newDateRange, newStartTime, newEndTime) => {
        setSelectedRange(newDateRange);
        setStartTime(newStartTime);
        setEndTime(newEndTime);
    };

    const handleScheduleClick = () => {
        alert(`Scheduled from ${selectedRange[0].toDateString()} ${startTime} to ${selectedRange[1].toDateString()} ${endTime}`);
    };

    return (
        <div className="scheduling">
            <h2 className="page-title">Scheduling</h2>
            <div className="scheduling-calendar">
                <CalendarComponent onDateTimeRangeChange={handleDateTimeRangeChange} />
                <div className="selection-container">
                    <label>
                        Select Ad
                        <select>
                            <option>Ad 1</option>
                            <option>Ad 2</option>
                        </select>
                    </label>
                    <label>
                        Select Device
                        <select>
                            <option>Device 1</option>
                            <option>Device 2</option>
                        </select>
                    </label>
                </div>
                <div className="button-container">
                    <button onClick={handleScheduleClick} className="schedule-button">Schedule</button>
                </div>
            </div>
            <div className="time-display">
                <p>Selected date range: {selectedRange[0].toDateString()} - {selectedRange[1].toDateString()}</p>
                <p>Selected time range: {startTime} - {endTime}</p>
            </div>
        </div>
    );
};

export default Scheduling;
