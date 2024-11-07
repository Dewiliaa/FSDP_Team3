// backend/server.js
const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (socket) => {
    console.log('Client connected');

    // Receive message from client
    socket.on('message', (message) => {
        console.log('Received:', message);

        // Echo message back to client
        socket.send(`Server says: ${message}`);
    });

    // Handle client disconnection
    socket.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server running on ws://localhost:8080');
