import React from 'react';
import MapComponent from '../components/MapComponent';
import StatisticsCard from '../components/StatisticsCard';
import AlertCard from '../components/AlertCard';

const Dashboard = ({ isNavExpanded }) => {
    return (
        <div className={`dashboard-container ${isNavExpanded ? 'nav-expanded' : 'nav-collapsed'}`}>
            <h2 className="dashboard-title">Dashboard</h2>
            
            <div className="map-outer-container">
                <div className="map-section">
                    <MapComponent />
                </div>
            </div>

            <div className="cards-section">
                <StatisticsCard />
                <AlertCard />
            </div>

            <style>{`
                .dashboard-container {
                    transition: margin-left 0.3s ease;
                    box-sizing: border-box;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    padding: 20px 0;
                }

                .nav-expanded {
                    margin-left: 240px;
                    width: calc(100% - 240px);
                }

                .nav-collapsed {
                    margin-left: 60px;
                    width: calc(100% - 60px);
                }

                .dashboard-title {
                    text-align: center;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    padding: 0 20px;
                }

                .map-outer-container {
                    width: 100%;
                    padding: 0 20px;
                    margin-bottom: 20px;
                    box-sizing: border-box;
                }

                .map-section {
                    width: 100%;
                    height: 65vh;
                    border-radius: 8px;
                    overflow: visible;  /* Changed to visible to show controls */
                    position: relative;
                }

                .map-section > div {
                    border-radius: 8px;
                }

                .cards-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                    padding: 0 20px;
                }

                @media (max-width: 768px) {
                    .dashboard-container {
                        margin-left: 60px;
                        width: calc(100% - 60px);
                        padding: 15px 0;
                    }

                    .nav-expanded {
                        margin-left: 60px;
                        width: calc(100% - 60px);
                    }

                    .map-section {
                        height: 50vh;
                    }

                    .cards-section {
                        grid-template-columns: 1fr;
                    }
                }

                /* Additional styles for map controls visibility */
                .map-container {
                    width: 100% !important;
                    height: 100% !important;
                }

                /* Ensure Google Maps controls are visible */
                .gm-style-cc,
                .gmnoprint,
                .gm-fullscreen-control {
                    margin: 10px !important;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;