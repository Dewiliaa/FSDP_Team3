import React from 'react';
import MapComponent from '../components/MapComponent';
import StatisticsCard from '../components/StatisticsCard';
import AlertCard from '../components/AlertCard';

const Dashboard = ({ isNavExpanded }) => {
    return (
        <div className={`dashboard-container ${isNavExpanded ? 'nav-expanded' : 'nav-collapsed'}`}>
            <h2 className="dashboard-title">Dashboard</h2>

            <div className="dashboard-content">
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

                .dashboard-content {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    align-items: center;
                }

                .map-section {
                    width: 90%; /* Center the map with 90% width */
                    max-width: 1000px; /* Optional: Limit the map's max width */
                    height: 65vh; /* Fixed height for the map */
                    border-radius: 8px;
                    overflow: visible;
                    position: relative;
                    margin-bottom: 20px;
                }

                .cards-section {
                    width: 90%; /* Ensure the cards section is the same width as the map */
                    max-width: 1000px; /* Optional: Limit the cards' max width */
                    margin-top: 30px; /* Add some space above the cards */
                    margin-bottom: 20px;
                }

                .cards-row {
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                }

                .cards-row > div {
                    width: 48%; /* Allow both cards to take up nearly half of the row */
                }

                /* Responsive layout for large screens */
                @media (min-width: 768px) {
                    .map-section {
                        width: 70%; /* Map takes up 70% of the width on large screens */
                        height: 65vh;
                    }

                    .cards-section {
                        width: 70%; /* Cards also take up the same width as map */
                    }

                    .cards-row {
                        display: flex;
                        justify-content: space-between;
                        gap: 20px;
                    }

                    .cards-row > div {
                        width: 48%; /* Ensure cards sit side by side */
                    }
                }

                /* For small screens, the layout becomes more compact */
                @media (max-width: 768px) {
                    .map-section {
                        height: 50vh; /* Reduce the map size on small screens */
                    }

                    .cards-section {
                        width: 100%; /* Full width for the cards */
                    }

                    .cards-row {
                        flex-direction: column;
                    }

                    .cards-row > div {
                        width: 100%; /* Stack cards vertically on small screens */
                    }
                }

                /* Additional styles for map controls visibility */
                .map-container {
                    width: 100% !important;
                    height: 100% !important;
                }

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

