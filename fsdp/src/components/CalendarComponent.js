import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import '../styles/CalendarComponent.css';

const CalendarComponent = ({ onDateChange }) => {
    const [date, setDate] = useState(new Date());

    const onChange = (newDate) => {
        setDate(newDate);
        onDateChange(newDate);
    };

    return (
        <div className="calendar-container">
            <Calendar showWeekNumbers onChange={onChange} value={date} />
            <p>Selected date: {date.toDateString()}</p>
        </div>
    );
};

export default CalendarComponent;
