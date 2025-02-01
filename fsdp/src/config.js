const config = {
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://ec2-54-252-192-167.ap-southeast-2.compute.amazonaws.com:3001',  // For API calls
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://ec2-54-252-192-167.ap-southeast-2.compute.amazonaws.com:3001'      // For socket.io
};
//change both
export default config;