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
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

let devices = []; // Keep track of connected devices

// Backend: server.js

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Listen for advertisement trigger
  socket.on('trigger_ad', (adImagePath) => {
    // Broadcast to all clients except the one triggering the event
    socket.broadcast.emit('display_ad', adImagePath);
  });

  socket.on('add_device', (deviceName) => {
    devices.push({ name: deviceName, status: 'Not connected', socketId: socket.id });
    io.emit('device_list', devices); // Broadcast updated list to all clients
  });

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

