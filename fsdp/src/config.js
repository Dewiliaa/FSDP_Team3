const config = {
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://52.65.65.69:3001/',  // For API calls
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://52.65.65.69:3001/'      // For socket.io
};
//change both
export default config;