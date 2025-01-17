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

const getDeviceInfo = (userAgent) => {
    const info = {
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Unknown',
    };
    
    // Enhanced device detection including TV
    if (userAgent.includes('SmartTV') || 
        userAgent.includes('SMART-TV') || 
        userAgent.includes('WebOS') || 
        userAgent.includes('Tizen') || 
        userAgent.includes('BRAVIA') ||
        userAgent.includes('TV Safari')) info.device = 'TV';
    else if (userAgent.includes('Mobile')) info.device = 'Mobile';
    else if (userAgent.includes('Tablet')) info.device = 'Tablet';
    else info.device = 'Desktop';
    
    if (userAgent.includes('Windows')) info.os = 'Windows';
    else if (userAgent.includes('Mac')) info.os = 'MacOS';
    else if (userAgent.includes('Linux')) info.os = 'Linux';
    else if (userAgent.includes('Android')) info.os = 'Android';
    else if (userAgent.includes('iOS')) info.os = 'iOS';

    if (userAgent.includes('Chrome')) info.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) info.browser = 'Firefox';
    else if (userAgent.includes('Safari')) info.browser = 'Safari';
    else if (userAgent.includes('Edge')) info.browser = 'Edge';

    return info;
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

    socket.on('device_connected', (userAgent) => {
        const deviceInfo = getDeviceInfo(userAgent);
        const deviceData = {
            socketId: socket.id,
            status: 'Connected',
            lastSeen: new Date().toISOString(),
            info: deviceInfo,
            ip: socket.handshake.address,
            isRegistered: false,
            user: socket.user.username,
            role: socket.user.role
        };

        // Check for device reconnection
        for (const [id, device] of registeredDevices.entries()) {
            if (device.ip === deviceData.ip && 
                device.info.browser === deviceInfo.browser && 
                device.info.os === deviceInfo.os && 
                device.info.device === deviceInfo.device) {
                
                device.socketId = socket.id;
                device.status = 'Connected';
                device.lastSeen = new Date().toISOString();
                
                registeredDevices.delete(id);
                registeredDevices.set(socket.id, device);
                connectedDevices.set(socket.id, device);
                
                io.emit('device_list', Array.from(registeredDevices.values()));
                return;
            }
        }

        console.log('Adding new device to connected devices:', deviceData);
        connectedDevices.set(socket.id, deviceData);
        io.emit('available_devices', Array.from(connectedDevices.values()));
    });

    socket.on('register_device', ({ deviceName, socketId }) => {
        if (socket.user.role !== 'admin') {
            socket.emit('error', { message: 'Admin access required' });
            return;
        }

        const device = connectedDevices.get(socketId);
        if (device) {
            device.name = deviceName;
            device.isRegistered = true;
            registeredDevices.set(socketId, device);
            io.emit('device_list', Array.from(registeredDevices.values()));
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

    socket.on('disconnect', (reason) => {
        const device = connectedDevices.get(socket.id);
        if (device && registeredDevices.has(socket.id)) {
            device.status = 'Disconnected';
            registeredDevices.set(socket.id, device);
            io.emit('device_list', Array.from(registeredDevices.values()));
        } else {
            connectedDevices.delete(socket.id);
            io.emit('available_devices', Array.from(connectedDevices.values()));
        }
        console.log(`Device disconnected: ${socket.id}, Reason: ${reason}`);
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
        io.emit('display_ad', null);
    });

    socket.on('trigger_device_ad', ({ deviceId, adUrl, ad }) => {
        if (socket.user.role !== 'admin') {
            socket.emit('error', { message: 'Admin access required' });
            return;
        }
        io.to(deviceId).emit('display_ad', adUrl);
        io.emit('device_ad_update', { deviceId, ad });
    });

    socket.on('stop_device_ad', (deviceId) => {
        if (socket.user.role !== 'admin') {
            socket.emit('error', { message: 'Admin access required' });
            return;
        }
        io.to(deviceId).emit('display_ad', null);
        io.emit('device_ad_update', { deviceId, ad: null });
    });
    
    socket.on('remove_device', (deviceId) => {
        if (socket.user.role !== 'admin') {
            socket.emit('error', { message: 'Admin access required' });
            return;
        }
        
        if (connectedDevices.has(deviceId)) {
            const device = connectedDevices.get(deviceId);
            device.isRegistered = false;
            connectedDevices.set(deviceId, device);
            registeredDevices.delete(deviceId);
            io.emit('available_devices', Array.from(connectedDevices.values()));
            io.emit('device_list', Array.from(registeredDevices.values()));
        }
    });
});

const startServer = async () => {
    try {
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