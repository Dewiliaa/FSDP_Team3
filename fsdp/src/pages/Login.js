import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'react-lottie';
import loadingAnimation from '../assets/loading.json';
import '../App.css';
import config from '../config';

const Login = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check for saved username in localStorage
        const savedUsername = localStorage.getItem('rememberedUsername');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }

        // Check for existing valid token
        const token = localStorage.getItem('token');
        if (token) {
            validateToken(token);
        }
    }, []);

    const validateToken = async (token) => {
        try {
            const response = await fetch(config.apiBaseUrl +'/api/auth/validate', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setIsAuthenticated(true);
                navigate('/dashboard');
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            localStorage.removeItem('token');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
    
        try {
            const response = await fetch(config.apiBaseUrl + '/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
    
            const responseText = await response.text(); // Get the raw response text
            console.log('Response:', responseText); // Log it to see if it's HTML or JSON
    
            if (response.ok) {
                const data = JSON.parse(responseText); // Parse the correct JSON response
                const { token } = data;
    
                // Save the token and username if 'remember me' is selected
                localStorage.setItem('token', token);
                if (rememberMe) {
                    localStorage.setItem('rememberedUsername', username);
                }
    
                setIsAuthenticated(true);
                navigate('/dashboard');
            } else {
                setError('Login failed');
            }
        } catch (error) {
            console.error('Login failed:', error);
            setError('An error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: loadingAnimation,
        rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
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
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleLogin} className="login-form">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="input-field"
                        />
                        <div className="password-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="input-field"
                            />
                            <span
                                className="password-toggle-icon"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <i className="fas fa-eye"></i>
                                ) : (
                                    <i className="fas fa-eye-slash"></i>
                                )}
                            </span>
                        </div>
                        
                        <div className="remember-forgot">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                />
                                Remember Me
                            </label>
                            <button 
                                type="button" 
                                onClick={() => alert('Forgot Password functionality is currently unavailable.')} 
                                className="forgot-password-link"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button type="submit" className="login-button">Login</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Login;