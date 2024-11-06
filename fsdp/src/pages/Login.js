import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'react-lottie';
import AWS from '../aws-config';
import '../App.css';
import loadingAnimation from '../assets/loading.json';

const Login = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Check for saved username in localStorage on page load
    useEffect(() => {
        const savedUsername = localStorage.getItem('rememberedUsername');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);

    // Handle the login process
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Use AWS STS to assume a role and get temporary credentials
            const sts = new AWS.STS();
            const params = {
                RoleArn: 'arn:aws:iam::060795902170:role/LoginAccessRole',
                RoleSessionName: 'sessionName',
            };
            const data = await sts.assumeRole(params).promise();
            AWS.config.credentials = new AWS.Credentials(data.Credentials);

            // Save username if "Remember Me" is checked
            if (rememberMe) {
                localStorage.setItem('rememberedUsername', username);
            } else {
                localStorage.removeItem('rememberedUsername');
            }

            // Set authenticated status in localStorage and update app state
            localStorage.setItem('isAuthenticated', 'true');
            setIsAuthenticated(true);
            navigate('/dashboard');

        } catch (error) {
            alert('Invalid username or password');
            console.error('AWS Authentication failed:', error);
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
