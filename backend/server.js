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

// Handling new socket connections
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Listen for advertisement trigger event
  socket.on('trigger_ad', (adImagePath) => {
    if (adImagePath) {
      socket.broadcast.emit('display_ad', adImagePath); // Broadcast the ad image URL to all other clients
      socket.emit('ad_confirmed'); // Inform the client that the ad has been triggered
    } else {
      console.error("Ad image path is missing");
    }
  });

  // Listen for stop ad event to stop showing ads to all clients
  socket.on('stop_ad', () => {
    // Broadcast null to stop the ad on all clients
    io.emit('display_ad', null);
  });

  // Handling new device addition
  socket.on('add_device', (deviceName) => {
    devices.push({ name: deviceName, status: 'Not connected', socketId: socket.id });
    io.emit('device_list', devices); // Broadcast updated list to all clients
  });

  // Handling device status update
  socket.on('update_device_status', (deviceName, status) => {
    const device = devices.find((d) => d.name === deviceName);
    if (device) {
      device.status = status;
      io.emit('device_list', devices); // Broadcast updated list to all clients
    }
  });

  // Handling user disconnect
  socket.on('disconnect', () => {
    devices = devices.filter((device) => device.socketId !== socket.id);
    io.emit('device_list', devices); // Broadcast updated list to all clients
    console.log(`User Disconnected: ${socket.id}`);
  });
});

// Start the server on port 3001
server.listen(3001, () => {
  console.log('SERVER IS RUNNING');
});
