// Modified Server.js
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

let connectedDevices = new Map(); // Devices that are connected but not necessarily added
let registeredDevices = new Map(); // Devices that have been officially added

const getDeviceInfo = (userAgent) => {
  const info = {
    browser: 'Unknown',
    os: 'Unknown',
    device: 'Unknown',
  };
  
  if (userAgent.includes('Windows')) info.os = 'Windows';
  else if (userAgent.includes('Mac')) info.os = 'MacOS';
  else if (userAgent.includes('Linux')) info.os = 'Linux';
  else if (userAgent.includes('Android')) info.os = 'Android';
  else if (userAgent.includes('iOS')) info.os = 'iOS';

  if (userAgent.includes('Mobile')) info.device = 'Mobile';
  else if (userAgent.includes('Tablet')) info.device = 'Tablet';
  else info.device = 'Desktop';

  // Detect browser
  if (userAgent.includes('Chrome')) info.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) info.browser = 'Firefox';
  else if (userAgent.includes('Safari')) info.browser = 'Safari';
  else if (userAgent.includes('Edge')) info.browser = 'Edge';

  return info;
};

io.on('connection', (socket) => {
  console.log(`New device connected: ${socket.id}`);


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


  // Handle initial connection and device detection
  socket.on('device_connected', (userAgent) => {
    const deviceInfo = getDeviceInfo(userAgent);
    const deviceData = {
      socketId: socket.id,
      status: 'Connected',
      lastSeen: new Date().toISOString(),
      info: deviceInfo,
      ip: socket.handshake.address,
      isRegistered: false
    };

    connectedDevices.set(socket.id, deviceData);
    // Broadcast updated list of connected (but not necessarily registered) devices
    io.emit('available_devices', Array.from(connectedDevices.values()));
  });

  // Handle official device registration
  socket.on('register_device', ({ deviceName, socketId }) => {
    const device = connectedDevices.get(socketId);
    if (device) {
      device.name = deviceName;
      device.isRegistered = true;
      registeredDevices.set(socketId, device);
      
      // Update the devices list for the main interface
      io.emit('device_list', Array.from(registeredDevices.values()));
    }
  });

  // Handle heartbeat
  socket.on('heartbeat', () => {
    if (connectedDevices.has(socket.id)) {
      const device = connectedDevices.get(socket.id);
      device.lastSeen = new Date().toISOString();
      connectedDevices.set(socket.id, device);
      io.emit('available_devices', Array.from(connectedDevices.values()));
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    connectedDevices.delete(socket.id);
    registeredDevices.delete(socket.id);
    io.emit('available_devices', Array.from(connectedDevices.values()));
    io.emit('device_list', Array.from(registeredDevices.values()));
    console.log(`Device disconnected: ${socket.id}`);
  });

  // Keep your existing ad-related socket handlers here

  socket.on('trigger_device_ad', ({ deviceId, adUrl, ad }) => {
    io.to(deviceId).emit('display_ad', adUrl);
    // Broadcast ad status update to all clients
    io.emit('device_ad_update', { deviceId, ad });
  });

  socket.on('stop_device_ad', (deviceId) => {
    io.to(deviceId).emit('display_ad', null);
    // Broadcast ad status update to all clients
    io.emit('device_ad_update', { deviceId, ad: null });
  });
  
  // Handle device removal
  socket.on('remove_device', (deviceId) => {
    if (connectedDevices.has(deviceId)) {
      const device = connectedDevices.get(deviceId);
      // Keep the device in connectedDevices but mark as unregistered
      device.isRegistered = false;
      connectedDevices.set(deviceId, device);
      
      // Remove from registered devices
      registeredDevices.delete(deviceId);
      
      // Broadcast updates
      io.emit('available_devices', Array.from(connectedDevices.values()));
      io.emit('device_list', Array.from(registeredDevices.values()));
    }
  });
});

server.listen(3001, () => {
  console.log('SERVER IS RUNNING');
});