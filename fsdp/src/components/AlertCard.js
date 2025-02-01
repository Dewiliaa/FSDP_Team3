import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import config from '../config';

const socket = io(config.socketUrl, {
    auth: {
        token: localStorage.getItem('token')
    },
    transports: ['websocket', 'polling']
});

function Alert() {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        // Listen for schedule failure alerts
        socket.on('schedule_alert', (alertData) => {
            const newAlert = {
                id: Date.now(),
                message: `Failed to display scheduled ad "${alertData.adName}" on device "${alertData.deviceName}" at ${new Date(alertData.scheduledTime).toLocaleString()} - Device is disconnected`,
                timestamp: new Date(),
                type: 'schedule_failure'
            };
            
            setAlerts(prev => [newAlert, ...prev].slice(0, 10)); // Keep only latest 10 alerts
        });

        return () => {
            socket.off('schedule_alert');
        };
    }, []);

    return (
        <div className="card">
            <h1>Alerts</h1>
            <div className="alert-list" style={{ marginTop: '1rem' }}>
                {alerts.length > 0 ? (
                    alerts.map(alert => (
                        <div 
                            key={alert.id} 
                            className="alert-item"
                            style={{
                                padding: '1rem',
                                marginBottom: '0.5rem',
                                backgroundColor: '#FEE2E2', // Light red background
                                borderRadius: '0.375rem',
                                border: '1px solid #FCA5A5' // Light red border
                            }}
                        >
                            <div style={{ color: '#B91C1C', fontWeight: '500' }}>{alert.message}</div>
                            <div style={{ 
                                fontSize: '0.875rem', 
                                color: '#666', 
                                marginTop: '0.25rem' 
                            }}>
                                {alert.timestamp.toLocaleString()}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ color: '#666', textAlign: 'center' }}>
                        No alerts at this time
                    </div>
                )}
            </div>
        </div>
    );
}

export default Alert;