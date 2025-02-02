import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle } from "react-icons/fa";
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
        // Listen for various alert types
        socket.on('schedule_alert', (alertData) => {
            addNewAlert({
                message: `Failed to display scheduled ad "${alertData.adName}" on device "${alertData.deviceName}" - Device is disconnected`,
                type: 'schedule_failure'
            });
        });

        socket.on('connection_alert', (data) => {
            const message = data.activeAd 
                ? `Device "${data.deviceName}" ${data.status} while displaying "${data.activeAd}"`
                : `Device "${data.deviceName}" ${data.status}`;
            addNewAlert({
                message,
                type: data.status === 'disconnected' ? 'error' : 'success'
            });
        });

        socket.on('ad_interruption_alert', (data) => {
            addNewAlert({
                message: `Ad "${data.adName}" on device "${data.deviceName}" was interrupted - ${data.reason}`,
                type: 'warning'
            });
        });

        return () => {
            socket.off('schedule_alert');
            socket.off('connection_alert');
            socket.off('ad_interruption_alert');
        };
    }, []);

    const addNewAlert = (alert) => {
        setAlerts(prev => [{
            id: Date.now(),
            ...alert,
            timestamp: new Date()
        }, ...prev].slice(0, 10)); // Keep latest 10 alerts
    };

    const getAlertStyle = (type) => {
        switch(type) {
            case 'error':
                return { bg: '#FEE2E2', border: '#FCA5A5', text: '#B91C1C' };
            case 'success':
                return { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' };
            case 'warning':
                return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' };
            default:
                return { bg: '#FEE2E2', border: '#FCA5A5', text: '#B91C1C' };
        }
    };

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <FaExclamationTriangle className="text-red-600" />
                <h1 className="text-xl font-semibold">Alerts</h1>
            </div>
            <div className="space-y-3">
                {alerts.length > 0 ? (
                    alerts.map(alert => {
                        const style = getAlertStyle(alert.type);
                        return (
                            <div 
                                key={alert.id} 
                                className="p-4 rounded-md"
                                style={{
                                    backgroundColor: style.bg,
                                    borderColor: style.border,
                                    borderWidth: '1px'
                                }}
                            >
                                <div style={{ color: style.text }} className="font-medium">
                                    {alert.message}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    {alert.timestamp.toLocaleString()}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-gray-500 text-center py-4">
                        No alerts at this time
                    </div>
                )}
            </div>
        </div>
    );
}

export default Alert;