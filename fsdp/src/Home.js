import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import slide1 from './assets/ad1.jpg';
import slide2 from './assets/ad2.jpg';
import slide3 from './assets/ad3.jpg';
import aboutImage from './assets/ad1.jpg'; // Import About Us image
import servicesImage from './assets/ad1.jpg'; // Import What We Do image

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

<section id="about" className="section about-section">
    <div className="text-content">
        <h2 className="section-title">About Us</h2>
        <p className="section-content">
        We are a team of passionate Diploma in Information Technology students from Ngee Ann Polytechnic, 
        collaborating with the Advanced Innovation and Development Centre 
        (AIDC) to create a cutting-edge prototype. Our project focuses on building an innovative ad provider
        service tailored specifically for the Food & Beverage (F&B) industry. 
        This service is designed to help F&B companies effectively connect with their 
        target audience through smart and engaging digital advertising solutions.
        </p>
    </div>
    <div className="image-content">
        <img src={aboutImage} alt="About Us" className="about-image" />
    </div>
</section>

<section id="services" className="section services-section">
    <div className="text-content">
        <h2 className="section-title">What We Do</h2>
        <p className="section-content">
        At our core, we aim to revolutionize digital advertising for F&B companies.
        Our service enables F&B businesses to showcase their products, promotions, 
        and special offers to a wider audience, enhancing visibility and customer engagement. 
        Utilizing modern technology and industry insights, we provide a seamless platform for targeted advertisements, 
        ensuring that the right customers see the right promotions at the right time. 
        Our mission is to empower F&B brands with tools to drive sales, build customer loyalty, 
        and stay ahead in a competitive market.
        </p>
    </div>
    <div className="image-content">
        <img src={servicesImage} alt="What We Do" className="services-image" />
    </div>
</section>

            </main>
        </div>
    );
};

export default Home;
