import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import slide1 from './assets/ad1.jpg';
import slide2 from './assets/ad2.jpg';
import slide3 from './assets/ad3.jpg';

const Home = () => {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null);

    const handleLogin = () => {
        navigate('/dashboard');
    };

    // Use imported images
    const images = [slide1, slide2, slide3];

    // Handle Swipe Detection
    const handleTouchStart = (e) => {
        setTouchStartX(e.touches[0].clientX); // Save initial touch position
    };

    const handleTouchEnd = (e) => {
        if (touchStartX === null) return; // If no touch start, exit

        const touchEndX = e.changedTouches[0].clientX;
        const swipeDistance = touchStartX - touchEndX;

        if (swipeDistance > 50) {
            // Swipe left
            setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
        } else if (swipeDistance < -50) {
            // Swipe right
            setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
        }

        setTouchStartX(null); // Reset touch start position
    };

    // Interval timer to change image every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
        }, 3000); // 3 seconds interval

        return () => clearInterval(interval); // Cleanup on component unmount
    }, [images.length]);

    // Handle dot click to navigate to a specific slide
    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    return (
        <div className="home-page">
            <header className="header">
                <h1 className="company-title">DineAd Connect</h1>
                <button className="login-button" onClick={handleLogin}>
                    Login
                </button>
            </header>
            <main className="content">
                {/* Carousel Component */}
                <div
                    className="carousel-container"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="carousel-slide">
                        <img src={images[currentIndex]} alt={`Slide ${currentIndex}`} />
                        {/* Slide Indicators Overlay */}
                        <div className="carousel-indicators-overlay">
                            {images.map((_, index) => (
                                <span
                                    key={index}
                                    className={`indicator-dot ${index === currentIndex ? 'active' : ''}`}
                                    onClick={() => goToSlide(index)}
                                ></span>
                            ))}
                        </div>
                    </div>
                </div>
                {/* End of Carousel Component */}
                
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
