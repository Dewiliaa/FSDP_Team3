const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// Load environment variables
require('dotenv').config();

// JWT Secret
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// AWS Configuration
AWS.config.update({
    region: process.env.REACT_APP_AWS_REGION,
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// JWT token generator
const generateToken = (userData) => {
    return jwt.sign(userData, JWT_SECRET, { expiresIn: '24h' });
};

// Token verification middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log('Login attempt for username:', username);
        console.log('AWS Config:', {
            region: process.env.REACT_APP_AWS_REGION,
            accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID ? 'Set' : 'Not Set'
        });

        const result = await dynamoDB.get({
            TableName: 'Users',
            Key: { username }
        }).promise();

        console.log('DynamoDB response:', result);
        const user = result.Item;
        console.log('Found user:', user);

        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken({
            username: user.username,
            role: user.role
        });

        res.json({
            token,
            name: user.username, // Added name field for frontend
            user: {
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

app.get('/api/auth/validate', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    },
    pingTimeout: 60000,
    transports: ['websocket', 'polling']
});

let connectedDevices = new Map();
let registeredDevices = new Map();

const createDevicesTable = async () => {
    const dynamodb = new AWS.DynamoDB();
    
    const params = {
      TableName: 'Devices',
      KeySchema: [
        { AttributeName: 'deviceId', KeyType: 'HASH' }  // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: 'deviceId', AttributeType: 'S' }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    };
  
    try {
      await dynamodb.createTable(params).promise();
      console.log('Devices table created successfully');
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log('Devices table already exists');
      } else {
        console.error('Error creating Devices table:', error);
        throw error;
      }
    }
  };

  const createTVGroupsTable = async () => {
    const dynamodb = new AWS.DynamoDB();
    
    const params = {
        TableName: 'TV_Groups',
        KeySchema: [
            { AttributeName: 'tv_group_id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'tv_group_id', AttributeType: 'S' }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    try {
        await dynamodb.createTable(params).promise();
        console.log('TV_Groups table created successfully');
    } catch (error) {
        if (error.code === 'ResourceInUseException') {
            console.log('TV_Groups table already exists');
        } else {
            console.error('Error creating TV_Groups table:', error);
            throw error;
        }
    }
};

const createActiveAdsTable = async () => {
    const dynamodb = new AWS.DynamoDB();
    
    const params = {
        TableName: 'ActiveAds',
        KeySchema: [
            { AttributeName: 'deviceId', KeyType: 'HASH' }  // Partition key
        ],
        AttributeDefinitions: [
            { AttributeName: 'deviceId', AttributeType: 'S' }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    try {
        await dynamodb.createTable(params).promise();
        console.log('ActiveAds table created successfully');
    } catch (error) {
        if (error.code === 'ResourceInUseException') {
            console.log('ActiveAds table already exists');
        } else {
            console.error('Error creating ActiveAds table:', error);
            throw error;
        }
    }
};

const getDeviceInfo = (userAgent) => {
    const info = {
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Unknown',
    };
    
    // TV detection
    if (userAgent.match(/TV|WebOS|SMART-TV|SmartTV|Tizen|BRAVIA|LG Browser|NetCast|NETTV|CE-HTML|Opera TV|Roku|DLNA|HbbTV|CrKey|Philips|Sharp|Viera|VIDAA|Hisense|Orsay|Toshiba|Thomson|SmartHub|LGE|SRAF|Panasonic/i)) {
        info.device = 'TV';
    }
    // Screen size check for large displays
    else if (typeof window !== 'undefined' && window.screen) {
        const screenSize = Math.sqrt(Math.pow(window.screen.width, 2) + Math.pow(window.screen.height, 2)) / 96;
        if (screenSize > 32 && !userAgent.includes('Mobile') && !userAgent.includes('Tablet')) {
            info.device = 'TV';
        }
        else if (userAgent.includes('Mobile')) info.device = 'Mobile';
        else if (userAgent.includes('Tablet')) info.device = 'Tablet';
        else info.device = 'Desktop';
    }
    else if (userAgent.includes('Mobile')) info.device = 'Mobile';
    else if (userAgent.includes('Tablet')) info.device = 'Tablet';
    else info.device = 'Desktop';
    
    // OS Detection
    if (userAgent.includes('Windows')) info.os = 'Windows';
    else if (userAgent.includes('Mac')) info.os = 'MacOS';
    else if (userAgent.includes('Linux')) info.os = 'Linux';
    else if (userAgent.includes('Android')) info.os = 'Android';
    else if (userAgent.includes('iOS')) info.os = 'iOS';
    else if (userAgent.includes('Tizen')) info.os = 'Tizen';
    else if (userAgent.includes('WebOS')) info.os = 'WebOS';

    // Browser Detection
    if (userAgent.includes('Chrome')) info.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) info.browser = 'Firefox';
    else if (userAgent.includes('Safari')) info.browser = 'Safari';
    else if (userAgent.includes('Edge')) info.browser = 'Edge';
    else if (userAgent.includes('Opera')) info.browser = 'Opera';
    else if (userAgent.includes('TV Safari')) info.browser = 'TV Safari';
    else if (userAgent.includes('Samsung')) info.browser = 'Samsung Browser';
    else if (userAgent.includes('LG')) info.browser = 'LG Browser';

    return info;
};

const initializeDevices = async () => {
    try {
        const result = await dynamoDB.scan({
            TableName: 'Devices'
        }).promise();
        
        result.Items.forEach(device => {
            registeredDevices.set(device.deviceId, {
                ...device,
                status: 'Disconnected' // Start all as disconnected
            });
        });
    } catch (error) {
        console.error('Error initializing devices:', error);
    }
};

// Socket.IO middleware for authentication
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        console.log('Socket auth attempt with token:', token ? 'Present' : 'Missing');
        
        if (!token) {
            return next(new Error('Authentication token required'));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.user = decoded;
            console.log('Socket authenticated for user:', decoded.username);
            next();
        } catch (error) {
            console.error('JWT verification failed:', error.message);
            next(new Error('Invalid token'));
        }
    } catch (error) {
        console.error('Socket authentication error:', error.message);
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log(`New device connected: ${socket.id}, User: ${socket.user?.username}`);

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    socket.on('device_connected', async (userAgent) => {
        const deviceInfo = getDeviceInfo(userAgent);
        const deviceId = `${deviceInfo.device}_${deviceInfo.browser}_${deviceInfo.os}_${socket.handshake.address}`.replace(/[^a-zA-Z0-9]/g, '_');
    
        try {
            const result = await dynamoDB.scan({
                TableName: 'Devices',
                FilterExpression: 'deviceId = :deviceId',
                ExpressionAttributeValues: {
                    ':deviceId': deviceId
                }
            }).promise();
    
            if (result.Items && result.Items.length > 0) {
                const existingDevice = result.Items[0];

                const activeAd = await dynamoDB.get({
                    TableName: 'ActiveAds',
                    Key: { deviceId: existingDevice.deviceId }
                }).promise();

                io.emit('connection_alert', {
                    deviceName: existingDevice.name,
                    status: 'reconnected',
                    activeAd: activeAd.Item ? activeAd.Item.ad.name : null
                });
    
                const updatedDevice = {
                    ...existingDevice,
                    socketId: socket.id,
                    status: 'Connected',
                    lastSeen: new Date().toISOString()
                };
    
                await dynamoDB.update({
                    TableName: 'Devices',
                    Key: { deviceId: existingDevice.deviceId },
                    UpdateExpression: 'SET socketId = :socketId, #status = :status, lastSeen = :lastSeen',
                    ExpressionAttributeNames: {
                        '#status': 'status'
                    },
                    ExpressionAttributeValues: {
                        ':socketId': socket.id,
                        ':status': 'Connected',
                        ':lastSeen': new Date().toISOString()
                    }
                }).promise();
    
                registeredDevices.set(deviceId, updatedDevice);
                
                // Emit updated list with this device's correct connection status
                io.emit('device_list', Array.from(registeredDevices.values()));
            } else {
                // Handle unregistered device
                const deviceData = {
                    deviceId,
                    socketId: socket.id,
                    status: 'Connected',
                    lastSeen: new Date().toISOString(),
                    info: deviceInfo,
                    ip: socket.handshake.address
                };
                connectedDevices.set(deviceId, deviceData);
                io.emit('available_devices', Array.from(connectedDevices.values()));
            }
        } catch (error) {
            console.error('Error handling device connection:', error);
        }
    });

    socket.on('register_device', async (deviceDetails) => {
        if (socket.user.role !== 'admin') {
            socket.emit('error', { message: 'Admin access required' });
            return;
        }

        try {
            await dynamoDB.put({
                TableName: 'Devices',
                Item: deviceDetails
            }).promise();

            // Update both maps correctly
            connectedDevices.delete(deviceDetails.deviceId);
            registeredDevices.set(deviceDetails.deviceId, {
                ...deviceDetails,
                status: 'Connected'
            });

            // Broadcast full lists immediately to all clients
            io.emit('device_list', Array.from(registeredDevices.values()));
            
            console.log('Broadcasting updated device list:', Array.from(registeredDevices.values()));
        } catch (error) {
            console.error('Error registering device:', error);
            socket.emit('error', { message: 'Failed to register device' });
        }
    });

    socket.on('heartbeat', () => {
        if (connectedDevices.has(socket.id)) {
            const device = connectedDevices.get(socket.id);
            device.lastSeen = new Date().toISOString();
            connectedDevices.set(socket.id, device);
            io.emit('available_devices', Array.from(connectedDevices.values()));
        }
    });

    socket.on('disconnect', async (reason) => {
        try {
            // Find device by current socket ID
            const deviceEntry = Array.from(registeredDevices.entries()).find(
                ([_, device]) => device.socketId === socket.id
            );
    
            if (deviceEntry) {
                const [deviceId, device] = deviceEntry;
    
                // Check if device had an active ad
                const activeAd = await dynamoDB.get({
                    TableName: 'ActiveAds',
                    Key: { deviceId }
                }).promise();
    
                if (activeAd.Item) {
                    // Emit alert about interrupted ad
                    io.emit('ad_interruption_alert', {
                        deviceName: device.name,
                        adName: activeAd.Item.ad.name,
                        reason: `Connection lost: ${reason}`
                    });
                }
    
                // Update device status
                await dynamoDB.update({
                    TableName: 'Devices',
                    Key: { deviceId },
                    UpdateExpression: 'SET #status = :status, lastSeen = :lastSeen',
                    ExpressionAttributeNames: {
                        '#status': 'status'
                    },
                    ExpressionAttributeValues: {
                        ':status': 'Disconnected',
                        ':lastSeen': new Date().toISOString()
                    }
                }).promise();
    
                // Update in-memory status
                device.status = 'Disconnected';
                registeredDevices.set(deviceId, device);
    
                // Emit connection alert
                io.emit('connection_alert', {
                    deviceName: device.name,
                    status: 'disconnected',
                    activeAd: activeAd.Item ? activeAd.Item.ad.name : null
                });
    
                io.emit('device_list', Array.from(registeredDevices.values()));
            }
        } catch (error) {
            console.error('Error handling device disconnect:', error);
        }
    });

    socket.on('trigger_ad', (adImagePath) => {
        console.log('Ad trigger attempt by:', socket.user.username, 'Path:', adImagePath);
        if (socket.user.role !== 'admin') {
            console.log('Non-admin tried to trigger ad');
            socket.emit('error', { message: 'Admin access required' });
            return;
        }

        if (adImagePath) {
            console.log('Broadcasting ad to all clients');
            socket.broadcast.emit('display_ad', adImagePath);
            socket.emit('ad_confirmed');
            console.log('Ad broadcast complete');
        } else {
            console.error("Ad image path is missing");
        }
    });

    socket.on('stop_ad', () => {
      if (socket.user.role !== 'admin') {
        socket.emit('error', { message: 'Admin access required' });
        return;
      }
      
      // Broadcast null to stop the ad on all clients
      io.emit('display_ad', null);
      
      // Also emit the ad_stopped event for consistency
      io.emit('ad_stopped', { deviceId: 'all' });
    });

    socket.on('trigger_device_ad', async ({ deviceId, adUrl, ad }) => {
        if (socket.user.role !== 'admin') {
            socket.emit('error', { message: 'Admin access required' });
            return;
        }
        
        try {
            // Store the active ad in DynamoDB
            await dynamoDB.put({
                TableName: 'ActiveAds',
                Item: {
                    deviceId,
                    ad,
                    startTime: new Date().toISOString()
                }
            }).promise();
    
            io.to(deviceId).emit('display_ad', adUrl);
            io.emit('device_ad_update', { deviceId, ad });
        } catch (error) {
            console.error('Error storing active ad:', error);
        }
    });

    socket.on('stop_device_ad', async (deviceId) => {
        if (socket.user.role !== 'admin') {
            socket.emit('error', { message: 'Admin access required' });
            return;
        }
    
        try {
            // Remove the active ad from DynamoDB
            await dynamoDB.delete({
                TableName: 'ActiveAds',
                Key: { deviceId }
            }).promise();
    
            io.to(deviceId).emit('display_ad', null);
            io.emit('ad_stopped', { deviceId });
            io.emit('device_ad_update', { deviceId, ad: null });
        } catch (error) {
            console.error('Error removing active ad:', error);
        }
    });

    socket.on('display_ad', (adMediaPath) => {
      console.log('Received display_ad event:', adMediaPath);
      
      if (!adMediaPath) {
        // If adMediaPath is null, emit both events for consistency
        socket.emit('display_ad', null);
        socket.broadcast.emit('ad_stopped', { deviceId: socket.id });
      } else {
        // Regular ad display logic
        socket.emit('display_ad', adMediaPath);
      }
    });
    
    socket.on('remove_device', async (deviceId) => {
        if (socket.user.role !== 'admin') {
          socket.emit('error', { message: 'Admin access required' });
          return;
        }
    
        try {
          await dynamoDB.delete({
            TableName: 'Devices',
            Key: { deviceId }
          }).promise();
    
          registeredDevices.delete(deviceId);
          
          // If device is still connected, move it back to available devices
          const deviceData = Array.from(connectedDevices.values())
            .find(device => device.deviceId === deviceId);
          
          if (deviceData) {
            deviceData.isRegistered = false;
            connectedDevices.set(deviceId, deviceData);
          }
    
          // Broadcast both lists to all clients
          io.emit('device_list', Array.from(registeredDevices.values()));
          io.emit('available_devices', Array.from(connectedDevices.values()));
    
        } catch (error) {
          console.error('Error removing device:', error);
          socket.emit('error', { message: 'Failed to remove device' });
        }
    });

    socket.on('create_group', async (groupData) => {
        if (socket.user.role !== 'admin') {
            socket.emit('error', { message: 'Admin access required' });
            return;
        }
    
        try {
            await dynamoDB.put({
                TableName: 'TV_Groups',
                Item: groupData
            }).promise();
    
            // Emit updated groups list
            const result = await dynamoDB.scan({ TableName: 'TV_Groups' }).promise();
            io.emit('groups_list', result.Items);
    
        } catch (error) {
            console.error('Error creating group:', error);
            socket.emit('error', { message: 'Failed to create group' });
        }
    });

    socket.on('schedule_alert', (alertData) => {
        // Broadcast the alert to all connected clients
        io.emit('schedule_alert', alertData);
    });
});

const startServer = async () => {
    try {
        await createDevicesTable();
        await createTVGroupsTable();
        await createActiveAdsTable();
        await initializeDevices();
        server.listen(3001, () => {
            console.log('SERVER IS RUNNING ON PORT 3001');
            console.log('Environment check:', {
                region: process.env.REACT_APP_AWS_REGION ? 'Set' : 'Not Set',
                accessKey: process.env.REACT_APP_AWS_ACCESS_KEY_ID ? 'Set' : 'Not Set',
                secretKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not Set'
            });
        });
    } catch (error) {
        console.error('Server startup error:', error);
    }
};

startServer();