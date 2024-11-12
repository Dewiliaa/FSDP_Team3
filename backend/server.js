// Backend: server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

let devices = []; // Keep track of connected devices

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Listen for device status updates
  socket.on('add_device', (deviceName) => {
    devices.push({ name: deviceName, status: 'Not connected', socketId: socket.id });
    io.emit('device_list', devices); // Broadcast updated list to all clients
  });

  // Listen for status updates
  socket.on('update_device_status', (deviceName, status) => {
    const device = devices.find((d) => d.name === deviceName);
    if (device) {
      device.status = status;
      io.emit('device_list', devices); // Update all clients
    }
  });

  socket.on('disconnect', () => {
    devices = devices.filter((device) => device.socketId !== socket.id);
    io.emit('device_list', devices); // Broadcast updated list to all clients
    console.log(`User Disconnected: ${socket.id}`);
  });
});

server.listen(3001, () => {
  console.log('SERVER IS RUNNING');
});
