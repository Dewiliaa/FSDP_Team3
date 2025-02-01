import React from 'react';
import MapComponent from '../components/MapComponent';
import StatisticsCard from '../components/StatisticsCard';
import AlertCard from '../components/AlertCard';

// In Dashboard.js

const Dashboard = ({ isNavExpanded }) => {
    return (
        <div className={`dashboard-container ${isNavExpanded ? 'nav-expanded' : 'nav-collapsed'}`}>
            <div className="dashboard-header">
                <h2 className="dashboard-title">Dashboard</h2>
            </div>

            <div className="dashboard-content">
                <div className="content-wrapper">
                    <div className="map-section">
                        <MapComponent />
                    </div>

                    <div className="cards-section">
                        <div className="cards-row">
                            <StatisticsCard />
                            <AlertCard />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-container {
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    background: #f5f6fa;
                }

                .dashboard-header {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    margin-bottom: 24px;
                }

                .dashboard-title {
                    margin: 0;
                    font-size: 28px;
                    color: #2c3e50;
                }

                .nav-expanded {
                    margin-left: 240px;
                    width: calc(100% - 240px);
                }

                .nav-collapsed {
                    margin-left: 60px;
                    width: calc(100% - 60px);
                }

                .dashboard-content {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                }

                .content-wrapper {
                    width: 100%;
                    max-width: 1400px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .map-section {
                    width: 100%;
                    height: 75vh; /* Increased height */
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    overflow: hidden; /* Ensure map controls don't overflow */
                }

                .map-section > div {
                    height: 100%;
                    width: 100%;
                }

                .cards-section {
                    width: 100%;
                    margin-top: 24px;
                }

                .cards-row {
                    display: flex;
                    gap: 24px;
                }

                .cards-row > div {
                    flex: 1;
                    min-width: 0;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                }

                @media screen and (max-width: 768px) {
                    .dashboard-container {
                        padding: 16px;
                        margin-left: 0;
                        width: 100%;
                    }

                    .nav-expanded, .nav-collapsed {
                        margin-left: 0;
                        width: 100%;
                    }

                    .dashboard-title {
                        font-size: 24px;
                    }

                    .map-section {
                        height: 60vh;
                    }

                    .cards-row {
                        flex-direction: column;
                    }

                    .cards-row > div {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;

