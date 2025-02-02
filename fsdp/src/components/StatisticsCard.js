import React, { useState, useEffect } from 'react';
import { FaRegClock } from "react-icons/fa";
import { MdDevices } from "react-icons/md";
import io from 'socket.io-client';
import config from '../config';

const socket = io(config.socketUrl, {
    auth: {
        token: localStorage.getItem('token')
    },
    transports: ['websocket', 'polling']
});

function StatisticsCard() {
    const [stats, setStats] = useState({
        activeDevices: 0,
        totalDisplayTime: 0
    });

    useEffect(() => {
        let displayStartTime;
        let timeInterval;

        // Listen for device list updates
        socket.on('device_list', (devices) => {
            setStats(prev => ({
                ...prev,
                activeDevices: devices.filter(d => d.status === 'Connected').length
            }));
        });

        // Listen for ad displays to track time
        socket.on('device_ad_update', ({ deviceId, ad }) => {
            if (ad && !displayStartTime) {
                displayStartTime = Date.now();
                timeInterval = setInterval(() => {
                    const currentTime = Math.floor((Date.now() - displayStartTime) / 1000);
                    setStats(prev => ({
                        ...prev,
                        totalDisplayTime: currentTime
                    }));
                }, 1000);
            } else if (!ad && displayStartTime) {
                clearInterval(timeInterval);
                displayStartTime = null;
            }
        });

        // Initial data fetch
        socket.emit('sync_schedules');

        return () => {
            socket.off('device_list');
            socket.off('device_ad_update');
            if (timeInterval) clearInterval(timeInterval);
        };
    }, []);

    const formatDisplayTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    return (
        <div className="stats-card">
            <h1 className="card-title">Statistics</h1>

            <div className="stats-content">
                <div className="stat-item">
                    <div className="stat-icon">
                        <FaRegClock />
                    </div>
                    <div className="stat-text">
                        <h2>{formatDisplayTime(stats.totalDisplayTime)}</h2>
                        <p>Ad Display Times</p>
                    </div>
                </div>

                <div className="stat-item">
                    <div className="stat-icon">
                        <MdDevices />
                    </div>
                    <div className="stat-text">
                        <h2>{stats.activeDevices}</h2>
                        <p>Devices Used Today</p>
                    </div>
                </div>
            </div>

            <style>{`
                .stats-card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .card-title {
                    text-align: left;
                    margin: 0 0 20px 0;
                    font-size: 20px;
                    padding-left: 20px;
                }

                .stats-content {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    padding: 0 20px;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    text-align: left;
                    padding: 15px 0;
                }

                .stat-icon {
                    font-size: 24px;
                    margin-right: 15px;
                    color: #2c3e50;
                    width: 24px;
                    display: flex;
                    align-items: center;
                }

                .stat-text {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }

                .stat-text h2 {
                    margin: 0;
                    font-size: 18px;
                    color: #2c3e50;
                }

                .stat-text p {
                    margin: 5px 0 0 0;
                    font-size: 14px;
                    color: #6c757d;
                }
            `}</style>
        </div>
    );
}

export default StatisticsCard;