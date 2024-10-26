import React, { useState } from 'react';
import CalendarComponent from '../components/CalendarComponent';

const Scheduling = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
    };

    return (
        <div className="scheduling">
            <h2 className="page-title">Scheduling</h2>
            <div className="scheduling-calendar">
                <CalendarComponent onDateChange={handleDateChange} />
                <p>Currently selected date: {selectedDate.toDateString()}</p>
            </div>
        </div>
    );
};

export default Scheduling;
