// Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'react-lottie';
import '../App.css';
import loadingAnimation from '../assets/loading.json';

const Login = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const savedUsername = localStorage.getItem('rememberedUsername');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'admin' && password === 'password') {
            setIsLoading(true);
            if (rememberMe) {
                localStorage.setItem('rememberedUsername', username);
            } else {
                localStorage.removeItem('rememberedUsername');
            }
            setTimeout(() => {
                setIsAuthenticated(true);
                navigate('/dashboard');
            }, 3000);
        } else {
            alert('Invalid username or password');
        }
    };

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

                        {/* Remember Me and Forgot Password */}
                        <div className="remember-forgot">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                />
                                Remember Me
                            </label>
                            <a href="/forgot-password" className="forgot-password-link">Forgot Password?</a>
                        </div>

                        <button type="submit" className="login-button">Login</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Login;
