import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import '../styles/CalendarComponent.css';

const CalendarComponent = ({ onDateTimeRangeChange }) => {
    const [dateRange, setDateRange] = useState([new Date(), new Date()]);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState("23:59");

    useEffect(() => {
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setStartTime(currentTime);
    }, []);
    
    const onDateChange = (newDateRange) => {
        if (newDateRange[0] >= new Date().setHours(0, 0, 0, 0)) { 
            setDateRange(newDateRange);
            onDateTimeRangeChange(newDateRange, startTime, endTime); // Pass changes to parent
        }
    };
    
    const handleStartTimeChange = (e) => {
        const selectedTime = e.target.value;
        const now = new Date();
        const selectedDate = dateRange[0];
    
        if (selectedDate.toDateString() === now.toDateString()) {
            if (selectedTime >= now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) {
                setStartTime(selectedTime);
                onDateTimeRangeChange(dateRange, selectedTime, endTime); // Update parent
            } else {
                alert("Start time cannot be in the past for today's date.");
            }
        } else {
            setStartTime(selectedTime);
            onDateTimeRangeChange(dateRange, selectedTime, endTime);
        }
    };
    
    const handleEndTimeChange = (e) => {
        const selectedTime = e.target.value;
        setEndTime(selectedTime);
        onDateTimeRangeChange(dateRange, startTime, selectedTime); // Update parent
    };
    
    const tileDisabled = ({ date, view }) => {
        return view === 'month' && date < new Date().setHours(0, 0, 0, 0); 
    };

    return (
        <div className="calendar-container">
            <Calendar
                onChange={onDateChange}
                value={dateRange}
                selectRange={true} 
                showWeekNumbers
                tileDisabled={tileDisabled} 
            />
            <div className="time-selection">
                <label>
                    Start Time:
                    <input 
                        type="time" 
                        value={startTime} 
                        onChange={handleStartTimeChange} 
                    />
                </label>
                <label>
                    End Time:
                    <input 
                        type="time" 
                        value={endTime} 
                        onChange={handleEndTimeChange} 
                    />
                </label>
            </div>
        </div>
    );
};

export default CalendarComponent;
