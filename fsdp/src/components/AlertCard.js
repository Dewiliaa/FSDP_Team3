// Alert.js
import React, { useState, useEffect } from 'react';
import socket from '../socketConfig';

function Alert() {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        // Listen for schedule failure alerts
        socket.on('schedule_alert', (alertData) => {
            console.log('Received schedule alert:', alertData);
            const newAlert = {
                id: Date.now(),
                message: `Failed to display scheduled ad "${alertData.adName}" on device "${alertData.deviceName}" at ${new Date(alertData.scheduledTime).toLocaleString()} - Device is disconnected`,
                timestamp: new Date(),
                type: 'schedule_failure'
            };
            
            setAlerts(prev => [newAlert, ...prev].slice(0, 10));
        });

        // Listen for ad interruption alerts
        socket.on('ad_interruption_alert', (alertData) => {
            console.log('Received interruption alert:', alertData);
            const newAlert = {
                id: Date.now(),
                message: `Ad "${alertData.adName}" display interrupted on device "${alertData.deviceName}" - ${alertData.reason}`,
                timestamp: new Date(),
                type: 'ad_interruption'
            };
            
            setAlerts(prev => [newAlert, ...prev].slice(0, 10));
        });

        // Listen for connection status alerts
        socket.on('connection_alert', (alertData) => {
            console.log('Received connection alert:', alertData);
            const newAlert = {
                id: Date.now(),
                message: `Device "${alertData.deviceName}" ${alertData.status} - ${alertData.activeAd ? `Currently displaying: ${alertData.activeAd}` : 'No active ad'}`,
                timestamp: new Date(),
                type: alertData.status === 'disconnected' ? 'connection_loss' : 'connection_restore'
            };
            
            setAlerts(prev => [newAlert, ...prev].slice(0, 10));
        });

        // Return cleanup function
        return () => {
            socket.off('schedule_alert');
            socket.off('ad_interruption_alert');
            socket.off('connection_alert');
        };
    }, []); // Empty dependency array since socket is from outside

    const getAlertStyle = (type) => {
        switch(type) {
            case 'schedule_failure':
                return {
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    color: '#B91C1C'
                };
            case 'ad_interruption':
                return {
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    color: '#92400E'
                };
            case 'connection_loss':
                return {
                    backgroundColor: '#EEE',
                    border: '1px solid #CBD5E0',
                    color: '#4A5568'
                };
            case 'connection_restore':
                return {
                    backgroundColor: '#D1FAE5',
                    border: '1px solid #6EE7B7',
                    color: '#065F46'
                };
            default:
                return {
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    color: '#B91C1C'
                };
        }
    };

    return (
        <div className="card">
            <h1>Alerts</h1>
            <div className="alert-list" style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                {alerts.length > 0 ? (
                    alerts.map(alert => (
                        <div 
                            key={alert.id} 
                            className="alert-item"
                            style={{
                                padding: '1rem',
                                marginBottom: '0.5rem',
                                borderRadius: '0.375rem',
                                ...getAlertStyle(alert.type)
                            }}
                        >
                            <div style={{ fontWeight: '500' }}>{alert.message}</div>
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
