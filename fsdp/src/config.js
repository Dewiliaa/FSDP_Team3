const config = {
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://192.168.86.28:3000',
    wsUrl: process.env.REACT_APP_WS_URL || 'http://192.168.86.28:3001'  // Change to your server's IP address
};

export default config;