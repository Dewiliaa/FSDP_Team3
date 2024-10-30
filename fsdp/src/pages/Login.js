// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'react-lottie';
import '../App.css';
import loadingAnimation from '../assets/loading.json'; // Import the Lottie JSON file

const Login = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); // State to track loading

    const handleLogin = (e) => {
        e.preventDefault();
        // Basic credential check
        if (username === 'admin' && password === 'password') {
            setIsLoading(true); // Show loading animation
            setTimeout(() => {
                setIsAuthenticated(true); // Set authentication
                navigate('/dashboard'); // Redirect to dashboard
            }, 3000); // 3-second delay to simulate loading
        } else {
            alert('Invalid username or password');
        }
    };

    // Lottie animation options
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: loadingAnimation,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
        }
    };

    return (
        <div className="login-page standalone">
            {isLoading ? (
                <div className="loading-animation">
                    <Lottie options={defaultOptions} height={200} width={200} />
                    <p>Loading Dashboard...</p>
                </div>
            ) : (
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
            )}
        </div>
    );
};

export default Login;
