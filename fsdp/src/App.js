import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './Home';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import ProfileDropdown from './components/ProfileDropdown'; // Import ProfileDropdown component
import './App.css';

function App() {
    const location = useLocation(); // Get the current location for conditional rendering

    return (
        <div className="App">
            {/* Show the Navbar and ProfileDropdown on all pages except the Home page */}
            {location.pathname !== '/' && (
                <>
                    <Navbar />
                    <ProfileDropdown />
                </>
            )}
            
            {/* Define the main Routes */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </div>
    );
}

// Wrapper for the App with Router
const AppWrapper = () => (
    <Router>
        <App />
    </Router>
);

export default AppWrapper;

