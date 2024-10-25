import React from 'react';
import MapComponent from '../components/MapComponent';
import '../App.css';

const Dashboard = () => {
    return (
        <div className="dashboard">
            <h2 className="page-title">Dashboard</h2>

            {/* do your page content here */}
            <MapComponent />
        </div>
    );
};

export default Dashboard;
