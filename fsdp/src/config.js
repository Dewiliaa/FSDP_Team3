const config = {
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://192.168.1.97:3001',  // For API calls
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://192.168.1.97:3001'      // For socket.io
};
//change both
export default config;