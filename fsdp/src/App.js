import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './Home';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import ProfileDropdown from './components/ProfileDropdown';
import './App.css';

function App() {
    const location = useLocation(); 

    return (
        <div className="App">
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

const AppWrapper = () => (
    <Router>
        <App />
    </Router>
);

export default AppWrapper;

