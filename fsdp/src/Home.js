import React from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate(); // Hook for navigation

    const handleLogin = () => {
        navigate('/dashboard'); // Navigate to the dashboard
    };

    return (
        <div className="home-page">
            <header className="header">
                <h1>My Website</h1>
                <button className="login-button" onClick={handleLogin}>
                    Login
                </button>
            </header>
            <main className="content">
                <section id="about">
                    <h2>About Us</h2>
                    <p>We are a dedicated team committed to providing the best services for our clients.</p>
                </section>
                <section id="services">
                    <h2>What We Do</h2>
                    <p>Our mission is to deliver top-notch solutions in web development, app development, and design.</p>
                </section>
            </main>
        </div>
    );
};

export default Home;
