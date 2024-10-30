// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // Use existing styles for consistency

const Login = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        // Hardcoded login credentials check
        if (username === 'admin' && password === 'password') { 
            setIsAuthenticated(true); // Set authenticated status to true
            navigate('/dashboard'); // Redirect to dashboard
        } else {
            alert('Invalid username or password'); // Show an error message
        }
    };

    return (
        <div className="login-page standalone">
            <div className="login-container">
                <h1 className="login-title">Welcome to DineAd Connect</h1>
                <form onSubmit={handleLogin} className="login-form">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="input-field"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="input-field"
                    />
                    <button type="submit" className="login-button">Login</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
