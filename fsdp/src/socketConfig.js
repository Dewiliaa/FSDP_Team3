// socketConfig.js
import io from 'socket.io-client';
import config from './config';

const socket = io(config.socketUrl, {
    auth: {
        token: localStorage.getItem('token')
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,  // Keep trying to reconnect
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,  // Increase timeout
    forceNew: true,  // Force a new connection
});

// Connection event handlers
socket.on('connect', () => {
    console.log('Socket connected successfully');
});

socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    // Attempt to reconnect on disconnect
    if (reason === 'io server disconnect') {
        // If the server disconnected us, reconnect manually
        socket.connect();
    }
});

socket.on('connect_error', (error) => {
    console.log('Socket connection error:', error.message);
    // Check if the error is due to authentication
    if (error.message.includes('Authentication')) {
        // Refresh the token or redirect to login
        window.location.href = '/login';
    }
});

// Debug events
socket.io.on("error", (error) => {
    console.log('Transport error:', error);
});

socket.io.on("reconnect_attempt", (attempt) => {
    console.log('Reconnection attempt:', attempt);
});

socket.io.on("reconnect", (attempt) => {
    console.log('Reconnected on attempt:', attempt);
});

// Export the singleton socket instance
export default socket;