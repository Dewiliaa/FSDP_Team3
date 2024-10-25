import React from 'react';
import MapComponent from '../components/MapComponent';
import StatisticsCard from '../components/StatisticsCard';
import AlertCard from '../components/AlertCard';
import '../App.css';

const Dashboard = () => {
    return (
        <div className="dashboard">
            <h2 className="page-title">Dashboard</h2>

            {/* Map Component */}
            <MapComponent />

            {/* Card Component below the Map */}
            <div className="card-container">
                <StatisticsCard />
                <AlertCard />
            </div>
        </div>
    );
};

export default Dashboard;
